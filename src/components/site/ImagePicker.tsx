import { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, RotateCcw, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { compressImage, validateImage } from "@/lib/storage";

/**
 * Two explicit inputs: camera (capture="environment", rear camera) and gallery/file picker (no capture).
 * Shows a preview with Retake / Cancel / Use Photo before handing the file to the parent.
 */
export function ImagePicker({
  currentUrl,
  onChange,
  camera = true,
  label = "Product photo",
}: {
  currentUrl?: string | undefined;
  onChange: (file: File | null) => void;
  camera?: boolean | undefined;
  label?: string | undefined;
}) {
  const camRef = useRef<HTMLInputElement>(null);
  const galRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{
    file: File;
    url: string;
    source: "camera" | "gallery";
  } | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(
    () => () => {
      if (pending) URL.revokeObjectURL(pending.url);
    },
    [pending],
  );

  async function handle(file: File | undefined, source: "camera" | "gallery") {
    setError(null);
    if (!file) return;
    const err = validateImage(file);
    if (err) return setError(err);
    const small = await compressImage(file);
    setPending({ file: small, url: URL.createObjectURL(small), source });
  }

  const shown = pending?.url ?? chosen ?? currentUrl;

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold">{label}</p>
      <div className="relative aspect-[3/4] w-full max-w-60 overflow-hidden rounded-xl border bg-muted">
        {shown ? (
          <img src={shown} alt="Preview" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center p-4 text-center text-sm text-muted-foreground">
            No photo selected
          </div>
        )}
        {pending && (
          <span className="absolute left-2 top-2 rounded bg-navy px-2 py-0.5 text-xs text-navy-foreground">
            Preview
          </span>
        )}
      </div>

      {pending ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => (pending.source === "camera" ? camRef : galRef).current?.click()}
          >
            <RotateCcw /> {pending.source === "camera" ? "Retake" : "Choose another"}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setPending(null)}>
            <X /> Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setChosen(pending.url);
              onChange(pending.file);
              setPending(null);
            }}
          >
            <Check /> Use photo
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {camera && (
            <Button type="button" variant="outline" onClick={() => camRef.current?.click()}>
              <Camera /> Take photo
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => galRef.current?.click()}>
            <ImagePlus /> Choose from gallery
          </Button>
          {chosen && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setChosen(null);
                onChange(null);
              }}
            >
              <X /> Remove new photo
            </Button>
          )}
        </div>
      )}
      <input
        ref={camRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          handle(e.target.files?.[0], "camera");
          e.target.value = "";
        }}
      />
      <input
        ref={galRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          handle(e.target.files?.[0], "gallery");
          e.target.value = "";
        }}
      />
      <p className="text-xs text-muted-foreground">
        JPG, PNG or WebP. Large photos are resized automatically.
      </p>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
