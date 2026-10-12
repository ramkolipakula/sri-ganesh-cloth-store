import { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { compressImage, validateImage } from "@/lib/storage";

/**
 * Two explicit inputs: camera (capture="environment", rear camera) and gallery/file picker (no capture).
 * Immediately passes chosen and compressed image to parent onChange, with option to change or remove.
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
  const [chosenUrl, setChosenUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    return () => {
      if (chosenUrl && chosenUrl.startsWith("blob:")) {
        URL.revokeObjectURL(chosenUrl);
      }
    };
  }, [chosenUrl]);

  async function handle(file: File | undefined) {
    setError(null);
    if (!file) return;

    const err = validateImage(file);
    if (err) {
      setError(err);
      return;
    }

    setProcessing(true);
    try {
      const small = await compressImage(file);
      const previewUrl = URL.createObjectURL(small);
      setChosenUrl(previewUrl);
      onChange(small);
    } catch {
      setError("Failed to process image. Please try a different photo.");
    } finally {
      setProcessing(false);
    }
  }

  function handleRemove() {
    setChosenUrl(null);
    setError(null);
    onChange(null);
  }

  const shown = chosenUrl ?? currentUrl;

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
        {processing && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70 text-xs font-semibold">
            <RefreshCw className="mr-1.5 size-4 animate-spin" /> Processing image…
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {camera && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => camRef.current?.click()}
            disabled={processing}
          >
            <Camera className="size-4 mr-1.5" /> Take photo
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => galRef.current?.click()}
          disabled={processing}
        >
          <ImagePlus className="size-4 mr-1.5" />
          {shown ? "Change photo" : "Choose from gallery"}
        </Button>
        {chosenUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={processing}
          >
            <X className="size-4 mr-1" /> Remove
          </Button>
        )}
      </div>

      {/* Hidden file inputs supporting all image types across mobile & desktop */}
      <input
        ref={camRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          handle(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <input
        ref={galRef}
        type="file"
        accept="image/*,image/jpeg,image/jpg,image/png,image/webp,image/avif,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={(e) => {
          handle(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      <p className="text-xs text-muted-foreground">
        Supports JPG, JPEG, PNG, WebP, etc. Automatically optimized for fast mobile loading.
      </p>

      {error && (
        <p role="alert" className="text-sm text-destructive font-medium">
          {error}
        </p>
      )}
    </div>
  );
}
