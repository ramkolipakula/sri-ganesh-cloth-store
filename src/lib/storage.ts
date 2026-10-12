import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/pjpeg",
  "image/x-png",
];

export function validateImage(file: File): string | null {
  const ext = file.name.split(".").pop()?.toLowerCase();
  const allowedExts = ["jpg", "jpeg", "png", "webp", "avif", "gif"];
  const typeMatches = file.type ? ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase()) : false;
  const extMatches = ext ? allowedExts.includes(ext) : false;

  if (!typeMatches && !extMatches) {
    return "Please choose a JPG, PNG or WebP image";
  }
  if (file.size > 25 * 1024 * 1024) {
    return "Image is too large (max 25 MB before compression)";
  }
  return null;
}

export function extFor(file: File): string {
  const nameExt = file.name.split(".").pop()?.toLowerCase();
  if (nameExt && ["jpg", "jpeg", "png", "webp", "avif", "gif"].includes(nameExt)) {
    return nameExt === "jpeg" ? "jpg" : nameExt;
  }
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/avif") return "avif";
  if (file.type === "image/gif") return "gif";
  return "jpg";
}

/** Resize large photos (phone cameras) to max 1800px to keep uploads fast and lightweight. */
export async function compressImage(file: File, maxDim = 1800, quality = 0.85): Promise<File> {
  try {
    // If it's already WebP and small enough, keep original
    if (file.size <= 2 * 1024 * 1024 && (file.type === "image/webp" || file.name.endsWith(".webp"))) {
      return file;
    }
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size <= 1.5 * 1024 * 1024) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const isPng = file.type === "image/png" || file.name.toLowerCase().endsWith(".png");
    const mime = isPng ? "image/png" : "image/jpeg";
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, mime, quality));
    if (!blob) return file;
    const ext = isPng ? "png" : "jpg";
    return new File([blob], file.name.replace(/\.\w+$/, "") + `.${ext}`, { type: mime });
  } catch {
    return file;
  }
}

/** Get public URL for public bucket items (product-images, store-assets). Instant & never expires. */
export function getProductImageUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
    return path;
  }
  const cleanPath = path.replace(/^(\/)?((product-images|store-assets)\/)?/, "");
  const { data } = supabase.storage.from("product-images").getPublicUrl(cleanPath);
  return data?.publicUrl;
}

/** Upload with real progress events (with SDK upload and XHR progress fallback). */
export async function uploadWithProgress(
  bucket: string,
  path: string,
  file: File,
  onProgress?: (pct: number) => void,
): Promise<string> {
  if (file.size > MAX_IMAGE_BYTES) throw new Error("Image must be 15 MB or smaller");

  // Attempt upload via Supabase SDK first
  try {
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type || "application/octet-stream",
    });
    if (!error) {
      onProgress?.(100);
      return path;
    }
  } catch {
    // proceed to fallback
  }

  // Fallback to direct XHR with progress tracking
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Please sign in again");

  const rawBase = (import.meta.env["VITE_SUPABASE_URL"] || "") as string;
  const base = rawBase.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
  const key = (import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] || "") as string;
  const url = `${base}/storage/v1/object/${bucket}/${path.split("/").map(encodeURIComponent).join("/")}`;

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("apikey", key);
    xhr.setRequestHeader("x-upsert", "true");
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (e) =>
      e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else {
        let msg = "Upload failed";
        try {
          msg = JSON.parse(xhr.responseText).message || msg;
        } catch {
          /* ignore */
        }
        reject(new Error(msg));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(file);
  });
  onProgress?.(100);
  return path;
}

/** Image URLs resolver: Uses public URLs for product-images & store-assets, signed URLs for private payment-proofs. */
export function useImageUrls(
  bucket: string,
  paths: (string | null | undefined)[],
  expires = 60 * 60 * 6,
) {
  const clean = [...new Set(paths.filter((p): p is string => !!p))].sort();
  return useQuery({
    queryKey: ["image-urls", bucket, clean],
    enabled: clean.length > 0,
    staleTime: 1000 * 60 * 30, // 30 minutes
    queryFn: async () => {
      const map: Record<string, string> = {};

      // Public buckets: construct instant public URLs (never fail for guests or unauthenticated users)
      if (bucket === "product-images" || bucket === "store-assets") {
        for (const p of clean) {
          if (p.startsWith("http://") || p.startsWith("https://") || p.startsWith("data:")) {
            map[p] = p;
          } else {
            const cleanPath = p.replace(/^(\/)?((product-images|store-assets)\/)?/, "");
            const { data } = supabase.storage.from(bucket).getPublicUrl(cleanPath);
            if (data?.publicUrl) {
              map[p] = data.publicUrl;
            }
          }
        }
        return map;
      }

      // Private bucket (e.g., payment-proofs): require signed URLs
      try {
        const { data, error } = await supabase.storage.from(bucket).createSignedUrls(clean, expires);
        if (error) {
          console.warn(`Failed to create signed URLs for bucket ${bucket}:`, error);
          return map;
        }
        data?.forEach((d) => d.path && d.signedUrl && (map[d.path] = d.signedUrl));
      } catch (err) {
        console.warn(`Error resolving signed URLs for ${bucket}:`, err);
      }
      return map;
    },
  });
}
