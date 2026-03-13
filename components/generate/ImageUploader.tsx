"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  onImageReady: (data: {
    base64: string;
    mediaType: "image/jpeg" | "image/png" | "image/webp";
    preview: string;
  } | null) => void;
}

const MAX_PIXELS = 1568;

async function resizeImage(
  file: File
): Promise<{ base64: string; mediaType: "image/jpeg" | "image/png" | "image/webp"; preview: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      if (width > MAX_PIXELS || height > MAX_PIXELS) {
        if (width > height) {
          height = Math.round((height * MAX_PIXELS) / width);
          width = MAX_PIXELS;
        } else {
          width = Math.round((width * MAX_PIXELS) / height);
          height = MAX_PIXELS;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);

      const mediaType =
        file.type === "image/png" ? "image/png" : "image/jpeg";
      const dataUrl = canvas.toDataURL(mediaType, 0.85);
      const base64 = dataUrl.split(",")[1];

      resolve({ base64, mediaType: mediaType as "image/jpeg" | "image/png", preview: dataUrl });
    };
    img.onerror = reject;
    img.src = objectUrl;
  });
}

export function ImageUploader({ onImageReady }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setLoading(true);
      try {
        const result = await resizeImage(file);
        setPreview(result.preview);
        onImageReady(result);
      } catch (err) {
        console.error("Image processing failed:", err);
      } finally {
        setLoading(false);
      }
    },
    [onImageReady]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/jpeg": [], "image/png": [], "image/webp": [] },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  });

  const clearImage = () => {
    setPreview(null);
    onImageReady(null);
  };

  if (preview) {
    return (
      <div className="relative inline-block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={preview}
          alt="Upload preview"
          className="h-40 w-40 rounded-xl object-cover border-2 border-rose-200"
        />
        <button
          onClick={clearImage}
          className="absolute -top-2 -right-2 rounded-full bg-white border border-gray-200 shadow-sm p-1 hover:bg-gray-50"
          type="button"
        >
          <X className="h-3.5 w-3.5 text-gray-500" />
        </button>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 cursor-pointer transition-colors",
        isDragActive
          ? "border-rose-400 bg-rose-50"
          : "border-rose-200 hover:border-rose-300 hover:bg-rose-50/50"
      )}
    >
      <input {...getInputProps()} />
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-rose-400">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-rose-300 border-t-rose-500" />
          Processing image...
        </div>
      ) : (
        <>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100">
            {isDragActive ? (
              <Upload className="h-5 w-5 text-rose-500" />
            ) : (
              <ImageIcon className="h-5 w-5 text-rose-400" />
            )}
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-rose-600">
              {isDragActive ? "Drop image here" : "Upload a photo"}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              JPEG, PNG, WebP — optional
            </p>
          </div>
        </>
      )}
    </div>
  );
}
