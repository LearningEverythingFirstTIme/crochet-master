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
          className="h-40 w-40 rounded-xl object-cover border-2"
          style={{ borderColor: "var(--border-strong)" }}
        />
        <button
          onClick={clearImage}
          className="absolute -top-2 -right-2 rounded-full border shadow-sm p-1 transition-colors"
          style={{
            backgroundColor: "var(--bg-card)",
            borderColor: "var(--border)",
            color: "var(--text-muted)",
          }}
          type="button"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 cursor-pointer transition-all duration-200"
      style={{
        borderColor: isDragActive ? "var(--primary)" : "var(--border-strong)",
        backgroundColor: isDragActive ? "var(--primary-muted)" : "transparent",
      }}
    >
      <input {...getInputProps()} />
      {loading ? (
        <div className="flex items-center gap-2 text-sm" style={{ color: "var(--primary)" }}>
          <div
            className="h-4 w-4 animate-spin rounded-full border-2"
            style={{ borderColor: "var(--border-strong)", borderTopColor: "var(--primary)" }}
          />
          Processing image…
        </div>
      ) : (
        <>
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: "var(--primary-muted)" }}
          >
            {isDragActive ? (
              <Upload className="h-5 w-5" style={{ color: "var(--primary)" }} />
            ) : (
              <ImageIcon className="h-5 w-5" style={{ color: "var(--primary)" }} />
            )}
          </div>
          <div className="text-center">
            <p className="text-sm font-medium" style={{ color: "var(--primary)" }}>
              {isDragActive ? "Drop image here" : "Upload a photo"}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              JPEG, PNG, WebP — optional
            </p>
          </div>
        </>
      )}
    </div>
  );
}
