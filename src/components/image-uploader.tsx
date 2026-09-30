"use client";

import { ImagePlus, Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { IMAGE_BUCKET, imageUrl } from "@/lib/images";
import { createClient } from "@/lib/supabase/client";

const MAX_SIDE = 1600;

// Downscale and re-encode to WebP in the browser so uploads stay small.
async function compress(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("encode failed"))), "image/webp", 0.85),
  );
}

// Uploads straight to Supabase Storage and submits the storage paths as hidden inputs.
export function ImageUploader({ userId, max }: { userId: string; max: number }) {
  const t = useTranslations("images");
  const inputRef = useRef<HTMLInputElement>(null);
  const [paths, setPaths] = useState<string[]>([]);
  const [uploading, setUploading] = useState(0);

  async function onFiles(files: FileList | null) {
    if (!files) return;
    const room = max - paths.length - uploading;
    const picked = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, Math.max(room, 0));
    if (picked.length === 0) return;

    const supabase = createClient();
    setUploading((n) => n + picked.length);
    await Promise.all(
      picked.map(async (file) => {
        try {
          const blob = await compress(file);
          const path = `${userId}/${crypto.randomUUID()}.webp`;
          const { error } = await supabase.storage
            .from(IMAGE_BUCKET)
            .upload(path, blob, { contentType: "image/webp" });
          if (error) throw error;
          setPaths((current) => [...current, path]);
        } catch (error) {
          console.error(error);
          toast.error(t("uploadFailed"));
        } finally {
          setUploading((n) => n - 1);
        }
      }),
    );
    if (inputRef.current) inputRef.current.value = "";
  }

  async function remove(path: string) {
    setPaths((current) => current.filter((p) => p !== path));
    await createClient().storage.from(IMAGE_BUCKET).remove([path]);
  }

  const full = paths.length + uploading >= max;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {paths.map((path) => (
          <div key={path} className="relative size-20 overflow-hidden rounded-md border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl(path)} alt="" className="size-full object-cover" />
            <button
              type="button"
              onClick={() => remove(path)}
              aria-label={t("remove")}
              className="absolute top-1 right-1 rounded-full bg-black/60 p-0.5 text-white"
            >
              <X className="size-3.5" />
            </button>
            <input type="hidden" name="image_paths" value={path} />
          </div>
        ))}
        {Array.from({ length: uploading }, (_, i) => (
          <div key={`uploading-${i}`} className="flex size-20 items-center justify-center rounded-md border bg-muted">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ))}
        {!full && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex size-20 flex-col items-center justify-center gap-1 rounded-md border border-dashed text-xs text-muted-foreground hover:bg-accent"
          >
            <ImagePlus className="size-5" />
            {t("add")}
          </button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{t("hint", { max })}</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={max > 1}
        hidden
        onChange={(e) => onFiles(e.target.files)}
      />
    </div>
  );
}
