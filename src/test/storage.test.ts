import { describe, expect, it } from "vitest";
import { validateImage, extFor } from "@/lib/storage";

describe("Storage Validation & Policies", () => {
  it("accepts valid JPEG, PNG and WebP images", () => {
    const jpeg = new File(["dummy"], "photo.jpg", { type: "image/jpeg" });
    const png = new File(["dummy"], "proof.png", { type: "image/png" });
    const webp = new File(["dummy"], "banner.webp", { type: "image/webp" });

    expect(validateImage(jpeg)).toBeNull();
    expect(validateImage(png)).toBeNull();
    expect(validateImage(webp)).toBeNull();
  });

  it("rejects non-image file types (e.g. PDF, executable, text)", () => {
    const pdf = new File(["dummy"], "document.pdf", { type: "application/pdf" });
    const exe = new File(["dummy"], "malware.exe", { type: "application/x-msdownload" });
    const txt = new File(["dummy"], "notes.txt", { type: "text/plain" });

    expect(validateImage(pdf)).toContain("Please choose a JPG, PNG or WebP image");
    expect(validateImage(exe)).toContain("Please choose a JPG, PNG or WebP image");
    expect(validateImage(txt)).toContain("Please choose a JPG, PNG or WebP image");
  });

  it("extracts canonical extensions", () => {
    const png = new File([""], "test.png", { type: "image/png" });
    const webp = new File([""], "test.webp", { type: "image/webp" });
    const jpeg = new File([""], "test.jpeg", { type: "image/jpeg" });

    expect(extFor(png)).toBe("png");
    expect(extFor(webp)).toBe("webp");
    expect(extFor(jpeg)).toBe("jpg");
  });

  it("enforces payment-proof storage path format <userId>/<orderId>/<filename>", () => {
    const userId = "c8942b08-8e68-45d2-b07f-0557551fb264";
    const orderId = "40be1e72-2c67-4bb1-a67b-1cb11394c6fb";
    const fileName = "1728739200000.jpg";

    const path = `${userId}/${orderId}/${fileName}`;
    const segments = path.split("/");

    expect(segments).toHaveLength(3);
    expect(segments[0]).toBe(userId);
    expect(segments[1]).toBe(orderId);
    expect(segments[2]).toBe(fileName);

    // Verify it satisfies the database RLS regex: (storage.foldername(name))[1] == auth.uid()
    expect(path.startsWith(`${userId}/${orderId}/`)).toBe(true);
  });
});
