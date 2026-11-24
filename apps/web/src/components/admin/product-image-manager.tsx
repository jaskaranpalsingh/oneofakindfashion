"use client";

import Image from "next/image";
import {
  useCallback,
  useId,
  useRef,
  useState,
  type DragEvent as ReactDragEvent,
  type ChangeEvent,
} from "react";
import {
  Eye,
  GripVertical,
  ImagePlus,
  Loader2,
  Replace,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { getApiBaseUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

export const MAX_PRODUCT_IMAGES = 6;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export type ManagedProductImage = {
  /** Client key for React lists; Mongo id when persisted */
  clientId: string;
  id?: string;
  url: string;
  publicId?: string;
  alt: string;
  sortOrder: number;
  isPrimary: boolean;
};

type UploadProgress = {
  name: string;
  percent: number;
  status: "uploading" | "done" | "error";
  error?: string;
};

type ProductImageManagerProps = {
  images: ManagedProductImage[];
  onChange: (images: ManagedProductImage[]) => void;
  defaultAlt?: string;
  disabled?: boolean;
  className?: string;
};

function mediaUrl(url: string) {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return url;
  return `/${url}`;
}

function newClientId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `img-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function toManagedImages(
  images: Array<{
    id?: string;
    _id?: string;
    url: string;
    publicId?: string;
    alt?: string;
    sortOrder?: number;
    isPrimary?: boolean;
  }>
): ManagedProductImage[] {
  const sorted = [...images].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  );
  const primaryIndex = sorted.findIndex((image) => image.isPrimary);
  const primary = primaryIndex >= 0 ? primaryIndex : 0;

  return sorted.map((image, index) => ({
    clientId: String(image.id ?? image._id ?? newClientId()),
    id: image.id ?? (image._id ? String(image._id) : undefined),
    url: image.url,
    publicId: image.publicId,
    alt: image.alt ?? "",
    sortOrder: index,
    isPrimary: index === primary,
  }));
}

export function serializeManagedImages(images: ManagedProductImage[]) {
  const ordered = [...images].sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    return a.sortOrder - b.sortOrder;
  });
  return ordered.map((image, index) => ({
    ...(image.id ? { id: image.id } : {}),
    url: image.url,
    publicId: image.publicId,
    alt: image.alt,
    sortOrder: index,
    isPrimary: index === 0,
  }));
}

function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.has(file.type)) {
    return `${file.name}: only JPEG, PNG, and WebP are allowed`;
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `${file.name}: must be 5 MB or smaller`;
  }
  return null;
}

async function uploadFilesWithProgress(
  files: File[],
  onProgress: (index: number, percent: number) => void
): Promise<Array<{ url: string; publicId?: string }>> {
  const body = new FormData();
  files.forEach((file) => body.append("images", file));

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${getApiBaseUrl()}/api/v1/admin/uploads/images`);
    xhr.withCredentials = true;

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const percent = Math.round((event.loaded / event.total) * 100);
      files.forEach((_, index) => onProgress(index, percent));
    };

    xhr.onload = () => {
      try {
        const json = JSON.parse(xhr.responseText) as {
          success?: boolean;
          data?: Array<{ url: string; publicId?: string }>;
          error?: { message?: string };
        };
        if (xhr.status < 200 || xhr.status >= 300 || !json.success) {
          reject(new Error(json?.error?.message ?? "Image upload failed"));
          return;
        }
        resolve(json.data ?? []);
      } catch {
        reject(new Error("Image upload failed"));
      }
    };

    xhr.onerror = () => reject(new Error("Image upload failed"));
    xhr.send(body);
  });
}

export function ProductImageManager({
  images,
  onChange,
  defaultAlt = "Product image",
  disabled = false,
  className,
}: ProductImageManagerProps) {
  const inputId = useId();
  const replaceInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const replaceIndexRef = useRef<number | null>(null);
  const dragIndexRef = useRef<number | null>(null);

  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState<UploadProgress[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [editingAlt, setEditingAlt] = useState<string | null>(null);

  const uploading = progress.some((item) => item.status === "uploading");
  const remaining = MAX_PRODUCT_IMAGES - images.length;

  const applyOrder = useCallback(
    (next: ManagedProductImage[]) => {
      const primaryIndex = next.findIndex((image) => image.isPrimary);
      const safePrimary = primaryIndex >= 0 ? primaryIndex : 0;
      onChange(
        next.map((image, index) => ({
          ...image,
          sortOrder: index,
          isPrimary: index === safePrimary,
        }))
      );
    },
    [onChange]
  );

  const setPrimary = useCallback(
    (index: number) => {
      const next = [...images];
      const [picked] = next.splice(index, 1);
      next.unshift({ ...picked, isPrimary: true });
      applyOrder(next.map((image, i) => ({ ...image, isPrimary: i === 0 })));
    },
    [images, applyOrder]
  );

  const removeImage = useCallback(
    (index: number) => {
      const next = images.filter((_, i) => i !== index);
      if (!next.length) {
        onChange([]);
        return;
      }
      if (!next.some((image) => image.isPrimary)) {
        next[0] = { ...next[0], isPrimary: true };
      }
      applyOrder(next);
    },
    [images, applyOrder, onChange]
  );

  const handleFiles = useCallback(
    async (fileList: FileList | File[] | null, replaceIndex: number | null = null) => {
      if (!fileList || disabled) return;
      const files = Array.from(fileList);
      if (!files.length) return;

      setError(null);

      const validationErrors = files
        .map(validateFile)
        .filter((message): message is string => Boolean(message));
      if (validationErrors.length) {
        setError(validationErrors[0]);
        return;
      }

      if (replaceIndex !== null) {
        if (files.length !== 1) {
          setError("Select a single image to replace");
          return;
        }
      } else if (files.length > remaining) {
        setError(
          remaining <= 0
            ? `Maximum ${MAX_PRODUCT_IMAGES} images per product`
            : `Only ${remaining} more image${remaining === 1 ? "" : "s"} can be added (max ${MAX_PRODUCT_IMAGES})`
        );
        return;
      }

      setProgress(
        files.map((file) => ({
          name: file.name,
          percent: 0,
          status: "uploading",
        }))
      );

      try {
        const uploaded = await uploadFilesWithProgress(files, (index, percent) => {
          setProgress((current) =>
            current.map((item, i) =>
              i === index ? { ...item, percent } : item
            )
          );
        });

        setProgress((current) =>
          current.map((item) => ({ ...item, percent: 100, status: "done" }))
        );

        if (replaceIndex !== null) {
          const item = uploaded[0];
          if (!item) throw new Error("Image upload failed");
          const next = [...images];
          next[replaceIndex] = {
            ...next[replaceIndex],
            url: item.url,
            publicId: item.publicId,
            // Keep existing Mongo id so references stay stable; storage key updates.
          };
          applyOrder(next);
        } else {
          const startPrimary = images.length === 0;
          const appended = uploaded.map((item, index) => ({
            clientId: newClientId(),
            url: item.url,
            publicId: item.publicId,
            alt: defaultAlt,
            sortOrder: images.length + index,
            isPrimary: startPrimary && index === 0,
          }));
          applyOrder([...images, ...appended]);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Image upload failed";
        setError(message);
        setProgress((current) =>
          current.map((item) => ({
            ...item,
            status: "error",
            error: message,
          }))
        );
      } finally {
        window.setTimeout(() => setProgress([]), 900);
        if (fileInputRef.current) fileInputRef.current.value = "";
        if (replaceInputRef.current) replaceInputRef.current.value = "";
        replaceIndexRef.current = null;
      }
    },
    [applyOrder, defaultAlt, disabled, images, remaining]
  );

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    void handleFiles(event.target.files, null);
  }

  function onReplaceChange(event: ChangeEvent<HTMLInputElement>) {
    void handleFiles(event.target.files, replaceIndexRef.current);
  }

  function onDrop(event: ReactDragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragOver(false);
    if (disabled || remaining <= 0) return;
    void handleFiles(event.dataTransfer.files, null);
  }

  function onTileDragStart(index: number) {
    dragIndexRef.current = index;
  }

  function onTileDrop(targetIndex: number) {
    const from = dragIndexRef.current;
    dragIndexRef.current = null;
    if (from === null || from === targetIndex) return;
    const next = [...images];
    const [moved] = next.splice(from, 1);
    next.splice(targetIndex, 0, moved);
    applyOrder(next);
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl text-[#003F2D]">Product images</h2>
          <p className="mt-1 text-xs text-[#6B726E]">
            JPEG, PNG, or WebP · max 5 MB each · recommend 2–3 images · max{" "}
            {MAX_PRODUCT_IMAGES}
          </p>
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#003F2D]">
          {images.length} of {MAX_PRODUCT_IMAGES} images uploaded
        </p>
      </div>

      <div
        onDragEnter={(event) => {
          event.preventDefault();
          if (!disabled && remaining > 0) setDragOver(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled && remaining > 0) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          "rounded-sm border border-dashed px-4 py-5 transition duration-200",
          dragOver
            ? "border-[#C49A36] bg-[#C49A36]/10"
            : "border-[#E5DFD4] bg-[#FAF7F0]",
          (disabled || remaining <= 0) && "opacity-60"
        )}
      >
        <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="text-sm text-[#6B726E]">
            Drag and drop images here, or select multiple files at once.
            Additional uploads append — existing images are kept.
          </p>
          <label
            htmlFor={inputId}
            className={cn(
              "inline-flex cursor-pointer items-center gap-2 border border-[#E5DFD4] bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#003F2D] transition hover:border-[#C49A36]",
              (disabled || uploading || remaining <= 0) &&
                "pointer-events-none opacity-50"
            )}
          >
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ImagePlus className="h-3.5 w-3.5" />
            )}
            {uploading ? "Uploading…" : "Add images"}
          </label>
          <input
            id={inputId}
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            disabled={disabled || uploading || remaining <= 0}
            onChange={onFileChange}
          />
        </div>
      </div>

      {error ? (
        <p className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {progress.length > 0 ? (
        <ul className="space-y-2">
          {progress.map((item) => (
            <li key={item.name} className="text-xs text-[#6B726E]">
              <div className="mb-1 flex justify-between gap-2">
                <span className="truncate">{item.name}</span>
                <span>
                  {item.status === "error"
                    ? "Failed"
                    : item.status === "done"
                      ? "Done"
                      : `${item.percent}%`}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#E5DFD4]">
                <div
                  className={cn(
                    "h-full transition-all duration-200",
                    item.status === "error" ? "bg-red-600" : "bg-[#003F2D]"
                  )}
                  style={{ width: `${item.percent}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((image, index) => (
          <li
            key={image.clientId}
            draggable={!disabled}
            onDragStart={() => onTileDragStart(index)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => onTileDrop(index)}
            className={cn(
              "group relative border bg-white p-2 transition duration-200 motion-safe:animate-[fadeIn_200ms_ease-out]",
              image.isPrimary ? "border-[#C49A36]" : "border-[#E5DFD4]"
            )}
          >
            <div className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-sm bg-white/95 px-1.5 py-0.5 text-[#6B726E]">
              <GripVertical className="h-3.5 w-3.5" aria-hidden />
              <span className="text-[10px] font-semibold uppercase tracking-[0.1em]">
                {index + 1}
              </span>
            </div>
            {image.isPrimary ? (
              <span className="absolute right-3 top-3 z-10 rounded-sm bg-[#003F2D] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-white">
                Primary image
              </span>
            ) : null}

            <div className="relative aspect-[3/4] overflow-hidden bg-[#FAF7F0]">
              <Image
                src={mediaUrl(image.url)}
                alt={image.alt || defaultAlt}
                fill
                unoptimized
                className="object-cover"
              />
            </div>

            {editingAlt === image.clientId ? (
              <div className="mt-2 space-y-1">
                <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6B726E]">
                  Alt text
                  <input
                    value={image.alt}
                    onChange={(event) => {
                      const next = [...images];
                      next[index] = { ...image, alt: event.target.value };
                      onChange(next);
                    }}
                    className="mt-1 w-full border border-[#E5DFD4] px-2 py-1.5 text-xs text-[#003F2D]"
                    placeholder="Describe the product view"
                  />
                </label>
                <button
                  type="button"
                  className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#003F2D]"
                  onClick={() => setEditingAlt(null)}
                >
                  Done
                </button>
              </div>
            ) : (
              <p className="mt-2 truncate text-[11px] text-[#6B726E]">
                {image.alt || "No alt text"}
              </p>
            )}

            <div className="mt-2 flex flex-wrap gap-1">
              <button
                type="button"
                title="Set as primary image"
                disabled={disabled || image.isPrimary}
                onClick={() => setPrimary(index)}
                className="inline-flex h-7 w-7 items-center justify-center border border-[#E5DFD4] text-[#003F2D] transition hover:border-[#C49A36] disabled:opacity-40"
              >
                <Star
                  className={cn("h-3.5 w-3.5", image.isPrimary && "fill-current")}
                />
              </button>
              <button
                type="button"
                title="Preview image"
                onClick={() => setPreviewUrl(mediaUrl(image.url))}
                className="inline-flex h-7 w-7 items-center justify-center border border-[#E5DFD4] text-[#003F2D] transition hover:border-[#C49A36]"
              >
                <Eye className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                title="Replace image"
                disabled={disabled || uploading}
                onClick={() => {
                  replaceIndexRef.current = index;
                  replaceInputRef.current?.click();
                }}
                className="inline-flex h-7 w-7 items-center justify-center border border-[#E5DFD4] text-[#003F2D] transition hover:border-[#C49A36] disabled:opacity-40"
              >
                <Replace className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                title="Edit alt text"
                disabled={disabled}
                onClick={() => setEditingAlt(image.clientId)}
                className="inline-flex h-7 items-center border border-[#E5DFD4] px-1.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#003F2D] transition hover:border-[#C49A36] disabled:opacity-40"
              >
                Alt
              </button>
              <button
                type="button"
                title="Remove image"
                disabled={disabled}
                onClick={() => removeImage(index)}
                className="inline-flex h-7 w-7 items-center justify-center border border-[#E5DFD4] text-red-700 transition hover:border-red-300 disabled:opacity-40"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </li>
        ))}

        {remaining > 0 ? (
          <li>
            <button
              type="button"
              disabled={disabled || uploading}
              onClick={() => fileInputRef.current?.click()}
              className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-2 border border-dashed border-[#E5DFD4] bg-[#FAF7F0] text-[#003F2D] transition hover:border-[#C49A36] disabled:opacity-50"
              aria-label="Add product image"
            >
              <ImagePlus className="h-6 w-6" strokeWidth={1.5} />
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em]">
                Add image
              </span>
            </button>
          </li>
        ) : null}
      </ul>

      <input
        id={replaceInputId}
        ref={replaceInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        disabled={disabled || uploading}
        onChange={onReplaceChange}
      />

      {previewUrl ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 motion-safe:animate-[fadeIn_200ms_ease-out]"
          onClick={() => setPreviewUrl(null)}
        >
          <button
            type="button"
            aria-label="Close preview"
            className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-sm bg-white text-[#003F2D]"
            onClick={() => setPreviewUrl(null)}
          >
            <X className="h-5 w-5" />
          </button>
          <div
            className="relative h-[min(80vh,720px)] w-full max-w-3xl"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={previewUrl}
              alt="Product preview"
              fill
              unoptimized
              className="object-contain"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
