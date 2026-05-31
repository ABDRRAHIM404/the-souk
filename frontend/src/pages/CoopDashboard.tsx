import { useState, useEffect, useRef, useCallback } from "react";
import type { Product, Cooperative, ProductCategory } from "@/types";
import { productService } from "@/services/productService";
import { coopService } from "@/services/coopService";
import api from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FadeSection from "@/components/FadeSection";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES: ProductCategory[] = ["argan", "carpets", "saffron", "pottery", "food", "leather", "other"];
const CURRENCIES = ["MAD", "EUR", "USD", "GBP"];

function getErrorMessage(error: unknown, fallback: string) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response &&
    typeof error.response.data === "object" &&
    error.response.data !== null &&
    "message" in error.response.data &&
    typeof error.response.data.message === "string"
  ) {
    return error.response.data.message;
  }

  return fallback;
}

// ─── Product form schema ──────────────────────────────────────────────────────
// price.amount uses valueAsNumber on the input so the field arrives as a number.
// category stays string in the schema; we cast to ProductCategory on submit.
const productSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(20, "Please write at least 20 characters"),
  category: z.string().min(1, "Select a category"),
  priceAmount: z.number({ message: "Enter a valid price" }).positive("Price must be positive"),
  priceCurrency: z.string().min(1, "Select a currency"),
  stock: z.number({ message: "Enter a valid stock number" }).int().min(0, "Stock cannot be negative"),
  fairTradeCertified: z.boolean(),
  materials: z.string().optional(),
  origin: z.string().optional(),
  impactStatement: z.string().optional(),
});

type ProductForm = z.infer<typeof productSchema>;

// ─── Coop settings schema ─────────────────────────────────────────────────────
const coopSettingsSchema = z.object({
  cooperativeName: z.string().min(2, "Name must be at least 2 characters"),
  cooperativeCity: z.string().optional(),
  description: z.string().optional(),
  impactStatement: z.string().optional(),
  artisanCount: z.number({ message: "Enter a number" }).int().min(0).optional(),
  foundedYear: z.number({ message: "Enter a year" }).int().min(1900).max(new Date().getFullYear()).optional(),
});

type CoopSettingsForm = z.infer<typeof coopSettingsSchema>;

// ─── Account settings schema ──────────────────────────────────────────────────
const accountSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional().refine((v) => !v || v.length >= 8, { message: "Min 8 characters" }),
  confirmPassword: z.string().optional(),
}).refine((d) => !d.newPassword || d.newPassword === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type AccountForm = z.infer<typeof accountSchema>;

// ─── Star Rating ──────────────────────────────────────────────────────────────
function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} width={size} height={size} viewBox="0 0 20 20" fill="none">
          <polygon
            points="10,2 12.4,7.8 18.5,8.2 14,12.2 15.6,18.1 10,15 4.4,18.1 6,12.2 1.5,8.2 7.6,7.8"
            fill={s <= Math.round(rating) ? "#E9C46A" : "#f0e8e0"}
            stroke={s <= Math.round(rating) ? "#E9C46A" : "#d4c8be"}
            strokeWidth="0.5"
          />
        </svg>
      ))}
    </span>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────
function Field({ label, error, children, hint }: { label: string; error?: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-[#1a1008]">{label}</label>
      {hint && <p className="text-xs text-[#9a8a7a] mb-1.5">{hint}</p>}
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-[#e8ddd3] bg-white px-3.5 py-2.5 text-sm text-[#1a1008] placeholder:text-[#b7a99d] transition-all focus:border-[#2A9D8F] focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/20";

const textareaClass =
  "w-full resize-none rounded-lg border border-[#e8ddd3] bg-white px-3.5 py-2.5 text-sm text-[#1a1008] placeholder:text-[#b7a99d] transition-all focus:border-[#2A9D8F] focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/20";

const panelClass = "rounded-xl border border-[#eadfd5] bg-white shadow-[0_1px_2px_rgba(26,16,8,0.04)]";
const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-[#1a1008] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#332216] disabled:opacity-60";
const secondaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-[#e8ddd3] bg-white px-4 py-2.5 text-sm font-semibold text-[#5f5046] transition-colors hover:bg-[#faf6f2]";

function formatCategory(category: string) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

function formatPrice(price: number | undefined) {
  return `MAD ${(price ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getProductStatus(product: Product) {
  if (product.stock === 0 || product.isAvailable === false) return { label: "Out of stock", tone: "danger" as const };
  if ((product.stock ?? 0) <= 5) return { label: "Low stock", tone: "warning" as const };
  return { label: "Active", tone: "success" as const };
}

function StatusChip({ label, tone }: { label: string; tone: "success" | "warning" | "danger" | "neutral" }) {
  const tones = {
    success: "border-[#b9dfd8] bg-[#edf8f6] text-[#19786d]",
    warning: "border-[#ead9a2] bg-[#fff8e5] text-[#8b6417]",
    danger: "border-[#f1c5bc] bg-[#fff0ed] text-[#b4442e]",
    neutral: "border-[#e8ddd3] bg-[#faf6f2] text-[#6b5a4e]",
  };

  return (
    <span className={`inline-flex h-6 shrink-0 items-center rounded-full border px-2.5 text-xs font-semibold ${tones[tone]}`}>
      {label}
    </span>
  );
}

function LoadingRows() {
  return (
    <div className={`${panelClass} overflow-hidden`}>
      <div className="hidden grid-cols-[minmax(220px,2fr)_0.8fr_0.8fr_1fr_auto] gap-4 border-b border-[#eadfd5] bg-[#fbf7f2] px-4 py-3 md:grid">
        {["Product", "Category", "Price", "Inventory", ""].map((label) => (
          <div key={label} className="h-3 w-20 animate-pulse rounded bg-[#eadfd5]" />
        ))}
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className={`grid gap-4 px-4 py-4 md:grid-cols-[minmax(220px,2fr)_0.8fr_0.8fr_1fr_auto] ${i < 4 ? "border-b border-[#f1e8df]" : ""}`}>
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 animate-pulse rounded-lg bg-[#f2ebe4]" />
            <div className="space-y-2">
              <div className="h-3.5 w-36 animate-pulse rounded bg-[#f2ebe4]" />
              <div className="h-3 w-20 animate-pulse rounded bg-[#f6f0eb]" />
            </div>
          </div>
          <div className="h-3.5 w-20 animate-pulse self-center rounded bg-[#f2ebe4]" />
          <div className="h-3.5 w-20 animate-pulse self-center rounded bg-[#f2ebe4]" />
          <div className="h-6 w-24 animate-pulse self-center rounded-full bg-[#f2ebe4]" />
          <div className="h-8 w-16 animate-pulse self-center rounded-lg bg-[#f2ebe4]" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={`${panelClass} flex min-h-[260px] flex-col items-center justify-center px-6 py-10 text-center`}>
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-[#eadfd5] bg-[#faf6f2] text-[#7b6a5e]">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M4 7h16M6 7v12h12V7M9 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h3 className="text-base font-bold text-[#1a1008]">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-[#7b6a5e]">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ─── Image Upload Zone ────────────────────────────────────────────────────────
interface ImageUploadProps {
  existingImages: string[];
  onFilesChange: (files: File[]) => void;
  onRemoveExisting: (url: string) => void;
}

function ImageUploadZone({ existingImages, onFilesChange, onRemoveExisting }: ImageUploadProps) {
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function processFiles(files: FileList | null) {
    if (!files) return;
    const newFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    const newPreviews = newFiles.map((file) => ({ file, url: URL.createObjectURL(file) }));
    setPreviews((prev) => {
      const updated = [...prev, ...newPreviews];
      onFilesChange(updated.map((p) => p.file));
      return updated;
    });
  }

  function removePreview(url: string) {
    setPreviews((prev) => {
      const updated = prev.filter((p) => p.url !== url);
      onFilesChange(updated.map((p) => p.file));
      URL.revokeObjectURL(url);
      return updated;
    });
  }

  return (
    <div>
      {/* Existing images */}
      {existingImages.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {existingImages.map((url) => (
            <div key={url} className="relative w-20 h-20 rounded-[10px] overflow-hidden group">
              <img src={url} alt="Product" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => onRemoveExisting(url)}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* New previews */}
      {previews.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {previews.map((p) => (
            <div key={p.url} className="relative w-20 h-20 rounded-[10px] overflow-hidden group border-2 border-[#E76F51]/30">
              <img src={p.url} alt="New" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removePreview(p.url)}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); processFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-xl border border-dashed p-5 text-center transition-all ${
          dragging ? "border-[#2A9D8F] bg-[#2A9D8F]/5" : "border-[#e3d7cc] hover:border-[#2A9D8F]/50 hover:bg-[#faf6f2]"
        }`}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="mx-auto mb-2 text-[#9a8a7a]">
          <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <p className="text-sm text-[#6b5a4e] font-medium">Drop images or click to upload</p>
        <p className="text-xs text-[#9a8a7a] mt-1">JPG, PNG, WEBP accepted</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => processFiles(e.target.files)}
        />
      </div>
    </div>
  );
}

// ─── Product Modal ────────────────────────────────────────────────────────────
interface ProductModalProps {
  product: Product | null; // null = create mode
  coopId: string;
  onClose: () => void;
  onSaved: (product: Product) => void;
}

function ProductModal({ product, coopId, onClose, onSaved }: ProductModalProps) {
  const isEdit = !!product;
  const [existingImages, setExistingImages] = useState<string[]>(product?.images ?? []);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name ?? "",
      description: product?.description ?? "",
      category: product?.category ?? "" as ProductCategory,
      priceAmount: product?.price ?? 0,
      priceCurrency: "MAD",
      stock: product?.stock ?? 1,
      fairTradeCertified: product?.fairTradeCertified ?? true,
      materials: product?.materials?.join(", ") ?? "",
      origin: product?.origin ?? "",
      impactStatement: product?.impactStatement ?? "",
    },
  });

  const onSubmit: SubmitHandler<ProductForm> = async (data) => {
    try {
      setUploading(true);

      // For create: build FormData (backend expects multipart)
      // For edit: upload images separately then PATCH with JSON
      let saved: Product;

      if (isEdit && product) {
        // Upload new images first if any
        if (newImageFiles.length > 0) {
          const fd = new FormData();
          newImageFiles.forEach((f) => fd.append("images", f));
          const updated = await productService.uploadImages(product._id, fd);
          setExistingImages(updated.images);
        }

        saved = await productService.update(product._id, {
          name: data.name,
          description: data.description,
          category: data.category as ProductCategory,
          price: data.priceAmount,
          fairTradeCertified: data.fairTradeCertified,
          stock: data.stock,
          origin: data.origin,
          materials: data.materials ? data.materials.split(",").map((s) => s.trim()).filter(Boolean) : [],
          impactStatement: data.impactStatement,
          images: existingImages,
        });
        toast.success("Product updated!");
      } else {
        // Create via FormData (backend handles images in same request)
        const fd = new FormData();
        fd.append("name", data.name);
        fd.append("description", data.description);
        fd.append("category", data.category);
        fd.append("price", String(data.priceAmount));
        fd.append("fairTradeCertified", String(data.fairTradeCertified));
        fd.append("stock", String(data.stock));
        fd.append("origin", data.origin ?? "");
        if (data.materials) fd.append("materials", data.materials);
        if (data.impactStatement) fd.append("impactStatement", data.impactStatement);
        fd.append("cooperative", coopId);
        newImageFiles.forEach((f) => fd.append("images", f));

        saved = await productService.create(fd);
        toast.success("Product listed!");
      }
      onSaved(saved);
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not save product"));
    } finally {
      setUploading(false);
    }
  }

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/45 p-3 backdrop-blur-sm sm:p-4">
      <div
        className="my-6 w-full max-w-2xl rounded-xl border border-[#eadfd5] bg-[#FFFCF8] shadow-[0_18px_50px_rgba(26,16,8,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#eadfd5] px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8c7b6f]">Product management</p>
            <h2 className="mt-1 text-xl font-bold text-[#1a1008]">
              {isEdit ? "Edit product" : "List new product"}
            </h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-[#8c7b6f] transition-colors hover:bg-[#f5eee7] hover:text-[#1a1008]" aria-label="Close product modal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 p-5 sm:p-6">
          {/* Images */}
          <Field label="Product Images">
            <ImageUploadZone
              existingImages={existingImages}
              onFilesChange={setNewImageFiles}
              onRemoveExisting={(url) => setExistingImages((prev) => prev.filter((u) => u !== url))}
            />
          </Field>

          {/* Name */}
          <Field label="Product Name" error={errors.name?.message}>
            <input {...register("name")} className={inputClass} placeholder="e.g. Hand-woven Berber Rug" />
          </Field>

          {/* Description */}
          <Field label="Description" error={errors.description?.message}>
            <textarea {...register("description")} rows={4} className={textareaClass} placeholder="Tell the story behind this product…" />
          </Field>

          {/* Category + Price row */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category" error={errors.category?.message}>
              <select {...register("category")} className={inputClass}>
                <option value="">Select category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </Field>

            <Field label="Stock" error={errors.stock?.message}>
              <input {...register("stock", { valueAsNumber: true })} type="number" min={0} className={inputClass} placeholder="0" />
            </Field>
          </div>

          {/* Price row */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Field label="Price" error={errors.priceAmount?.message}>
                <input {...register("priceAmount", { valueAsNumber: true })} type="number" min={0} step="0.01" className={inputClass} placeholder="0.00" />
              </Field>
            </div>
            <Field label="Currency" error={errors.priceCurrency?.message}>
              <select {...register("priceCurrency")} className={inputClass}>
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </div>

          {/* Materials */}
          <Field label="Materials" hint="Comma-separated, e.g. wool, cotton, natural dye">
            <input {...register("materials")} className={inputClass} placeholder="wool, natural dye, cedar" />
          </Field>

          {/* Origin */}
          <Field label="Region of Origin">
            <input {...register("origin")} className={inputClass} placeholder="e.g. Souss-Massa" />
          </Field>

          {/* Impact statement */}
          <Field label="Impact Statement" hint="How does this product support the cooperative?">
            <textarea {...register("impactStatement")} rows={2} className={textareaClass} placeholder="10% goes directly to artisan education funds…" />
          </Field>

          {/* Fair Trade toggle */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div className="relative">
              <input {...register("fairTradeCertified")} type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-[#f0e8e0] rounded-full peer-checked:bg-[#2A9D8F] transition-colors" />
              <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
            </div>
            <div>
              <span className="text-sm font-semibold text-[#1a1008]">Fair Trade Certified</span>
              <p className="text-xs text-[#9a8a7a]">Mark this product as fair trade</p>
            </div>
          </label>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 border-t border-[#eadfd5] pt-5 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className={secondaryButtonClass}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || uploading}
              className={primaryButtonClass}
            >
              {(isSubmitting || uploading) ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  {uploading ? "Uploading…" : "Saving…"}
                </>
              ) : (
                isEdit ? "Update Product" : "List Product"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function ProductMobileCard({
  product,
  onEdit,
  onDelete,
}: {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const status = getProductStatus(product);

  return (
    <article className={`${panelClass} p-3.5`}>
      <div className="flex gap-3">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-[#f0e8e0] bg-[#faf6f2]">
          {product.images?.[0] ? (
            <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[#b7a99d]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold text-[#1a1008]">{product.name}</h3>
              <p className="mt-1 text-xs font-medium text-[#8c7b6f]">{formatCategory(product.category)}</p>
            </div>
            <StatusChip label={status.label} tone={status.tone} />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
            <div className="rounded-lg bg-[#fbf7f2] px-2.5 py-2">
              <p className="text-xs text-[#8c7b6f]">Price</p>
              <p className="font-semibold text-[#1a1008]">{formatPrice(product.price)}</p>
            </div>
            <div className="rounded-lg bg-[#fbf7f2] px-2.5 py-2">
              <p className="text-xs text-[#8c7b6f]">Stock</p>
              <p className="font-semibold text-[#1a1008]">{product.stock ?? 0}</p>
            </div>
            <div className="rounded-lg bg-[#fbf7f2] px-2.5 py-2">
              <p className="text-xs text-[#8c7b6f]">Trade</p>
              <p className="truncate font-semibold text-[#1a1008]">
                {(product.fairTradeCertified || product.isFairTrade) ? "Fair" : "Standard"}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button onClick={onEdit} className={`${secondaryButtonClass} flex-1`} type="button">
          Edit
        </button>
        <button onClick={onDelete} className="inline-flex flex-1 items-center justify-center rounded-lg border border-red-100 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50" type="button">
          Delete
        </button>
      </div>
    </article>
  );
}

function DeleteConfirmModal({ product, onConfirm, onCancel }: { product: Product; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-[#eadfd5] bg-[#FFFCF8] p-6 text-center shadow-[0_18px_50px_rgba(26,16,8,0.18)]">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-500">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <h3 className="mb-2 text-lg font-bold text-[#1a1008]">Delete product?</h3>
        <p className="text-[#6b5a4e] text-sm mb-6">
          <span className="font-semibold">"{product.name}"</span> will be permanently removed from the marketplace.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className={`${secondaryButtonClass} flex-1`}>
            Cancel
          </button>
          <button onClick={onConfirm} className="inline-flex flex-1 items-center justify-center rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CoopDashboard() {
  const { user, refreshAuth } = useAuth();

  const [activeTab, setActiveTab] = useState<"products" | "reviews" | "settings">("products");

  // Products
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [modalProduct, setModalProduct] = useState<Product | null | "new">(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  // Coop profile
  const [coop, setCoop] = useState<Cooperative | null>(null);

  // Reviews
  interface CoopReview { _id: string; userName: string; rating: number; comment: string; productName?: string; createdAt: string; }
  const [reviews, setReviews] = useState<CoopReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  // Coop settings form
  const coopForm = useForm<CoopSettingsForm>({
    resolver: zodResolver(coopSettingsSchema),
    defaultValues: {
      cooperativeName: "",
      cooperativeCity: "",
      description: "",
      impactStatement: "",
      artisanCount: undefined,
      foundedYear: undefined,
    },
  });

  // Account form
  const accountForm = useForm<AccountForm>({
    resolver: zodResolver(accountSchema),
    defaultValues: { name: user?.name ?? "", email: user?.email ?? "" },
  });

  // Fetch products
  useEffect(() => {
    async function load() {
      if (!user?.cooperativeId) {
        setLoadingProducts(false);
        return;
      }
      try {
        setLoadingProducts(true);
        const res = await productService.getAll({ cooperative: user!.cooperativeId, limit: 100 });
        setProducts(res.data);
      } catch {
        toast.error("Could not load products");
      } finally {
        setLoadingProducts(false);
      }
    }
    load();
  }, [user]);

  // Fetch coop profile + reviews
  useEffect(() => {
    async function load() {
      if (!user?.cooperativeId) {
        setLoadingReviews(false);
        return;
      }
      try {
        const data = await coopService.getById(user!.cooperativeId!);
        setCoop(data);
        coopForm.reset({
          cooperativeName: data.name ?? "",
          cooperativeCity: data.city ?? "",
          description: data.description ?? "",
          impactStatement: data.impactStatement ?? "",
          artisanCount: data.artisanCount ?? undefined,
          foundedYear: data.foundedYear ?? undefined,
        });
        setReviews(
          (data.reviews ?? []).map((r) => {
            const raw = r as unknown as { _id: string; rating: number; comment: string; createdAt: string; productName?: string; userName?: string; reviewer?: unknown };
            const reviewerName = typeof raw.reviewer === "object" && raw.reviewer !== null
              ? (raw.reviewer as { name?: string }).name
              : typeof raw.reviewer === "string" ? raw.reviewer : undefined;
            return {
              _id: raw._id,
              rating: raw.rating,
              comment: raw.comment,
              createdAt: raw.createdAt,
              productName: raw.productName,
              userName: raw.userName ?? reviewerName ?? "Anonymous",
            } satisfies CoopReview;
          })
        );
      } catch {
        // silent
      } finally {
        setLoadingReviews(false);
      }
    }
    load();
  }, [user, coopForm]);

  // Sync account form when user loads
  useEffect(() => {
    if (user) {
      accountForm.reset({ name: user.name, email: user.email });
    }
  }, [user, accountForm]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await productService.remove(deleteTarget._id);
      setProducts((prev) => prev.filter((p) => p._id !== deleteTarget._id));
      toast.success("Product deleted");
    } catch {
      toast.error("Could not delete product");
    } finally {
      setDeleteTarget(null);
    }
  }, [deleteTarget]);

  function handleProductSaved(saved: Product) {
    setProducts((prev) => {
      const idx = prev.findIndex((p) => p._id === saved._id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
    setModalProduct(null);
  }

  const onCoopSettingsSubmit: SubmitHandler<CoopSettingsForm> = async (data) => {
    try {
      const payload = {
        name: data.cooperativeName,
        city: data.cooperativeCity,
        description: data.description,
        impactStatement: data.impactStatement,
        artisanCount: data.artisanCount,
        foundedYear: data.foundedYear,
      };

      const saved = user?.cooperativeId
        ? await coopService.update(user.cooperativeId, payload)
        : await coopService.create({
            ...payload,
            location: { city: data.cooperativeCity ?? "", region: "Souss-Massa" },
            category: "other",
          });

      setCoop(saved);
      await refreshAuth();
      toast.success("Cooperative profile updated!");
    } catch {
      toast.error("Could not update cooperative profile");
    }
  }

  const onAccountSubmit: SubmitHandler<AccountForm> = async (data) => {
    try {
      await api.patch("/auth/me", {
        name: data.name,
        email: data.email,
        ...(data.currentPassword && data.newPassword
          ? { currentPassword: data.currentPassword, newPassword: data.newPassword }
          : {}),
      });
      await refreshAuth();
      toast.success("Account updated!");
    } catch {
      toast.error("Could not update account");
    }
  }

  // Summary stats
  const totalStock = products.reduce((sum, p) => sum + (p.stock ?? 0), 0);
  const activeProducts = products.filter((p) => p.stock > 0 && p.isAvailable !== false).length;
  const lowStockProducts = products.filter((p) => p.stock > 0 && p.stock <= 5).length;
  const avgRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : null;
  const coopId = user?.cooperativeId ?? coop?._id;
  const openNewProduct = () => {
    if (!coopId) {
      setActiveTab("settings");
      toast.error("Create your cooperative profile before adding products");
      return;
    }
    setModalProduct("new");
  };

  const tabs = [
    { id: "products" as const, label: "Products", description: "Inventory and listings", count: products.length },
    { id: "reviews" as const, label: "Reviews", description: "Customer feedback", count: reviews.length },
    { id: "settings" as const, label: "Settings", description: "Storefront and access", count: null },
  ];

  return (
    <div className="min-h-screen bg-[#FFFCF8]">
      <Navbar />

      {/* Header */}
      <div className="border-b border-[#eadfd5] bg-[#fbf7f2]">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#1a1008] text-lg font-bold text-white">
                {coop?.name?.charAt(0) ?? user?.name?.charAt(0) ?? "C"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8c7b6f]">Cooperative dashboard</p>
                <h1 className="mt-1 truncate text-2xl font-bold text-[#1a1008] md:text-3xl">
                  {coop?.name ?? user?.name ?? "Cooperative"}
                </h1>
                <p className="mt-1 text-sm leading-6 text-[#7b6a5e]">
                  {coop?.city ? `${coop.city}, Morocco` : "Set up your profile to help shoppers find your cooperative."}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={openNewProduct} className={primaryButtonClass} type="button">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    Add product
                  </button>
                  {coopId && (
                    <a href={`/coops/${coopId}`} className={secondaryButtonClass}>
                      View storefront
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[520px]">
              {[
                { label: "Active listings", value: activeProducts },
                { label: "Units in stock", value: totalStock },
                { label: "Low stock", value: lowStockProducts },
                { label: "Avg rating", value: avgRating !== null ? avgRating.toFixed(1) : "New" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-lg border border-[#eadfd5] bg-white px-3 py-2.5">
                  <p className="text-lg font-bold leading-none text-[#1a1008]">{stat.value}</p>
                  <p className="mt-1 text-xs font-medium text-[#8c7b6f]">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-7">
        {/* Tabs */}
        <div className="sticky top-[72px] z-20 mb-6 overflow-x-auto rounded-xl border border-[#eadfd5] bg-[#FFFCF8]/95 p-1 backdrop-blur">
          <div className="grid min-w-max grid-cols-3 gap-1 sm:min-w-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex min-h-12 items-center justify-between gap-4 rounded-lg px-3 text-left transition-colors sm:px-4 ${
                  activeTab === tab.id
                    ? "bg-[#1a1008] text-white"
                    : "text-[#7b6a5e] hover:bg-[#faf6f2] hover:text-[#1a1008]"
                }`}
              >
                <span>
                  <span className="block text-sm font-semibold">{tab.label}</span>
                  <span className={`hidden text-xs sm:block ${activeTab === tab.id ? "text-white/70" : "text-[#9a8a7a]"}`}>
                    {tab.description}
                  </span>
                </span>
                {tab.count !== null && tab.count > 0 && (
                  <span className={`rounded-full px-2 py-0.5 text-xs ${activeTab === tab.id ? "bg-white/15 text-white" : "bg-[#f0e8e0] text-[#6b5a4e]"}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Products Tab ──────────────────────────────────────────────────── */}
        {activeTab === "products" && (
          <FadeSection>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8c7b6f]">Inventory</p>
                <h2 className="mt-1 text-xl font-bold text-[#1a1008]">Product listings</h2>
                <p className="mt-1 text-sm text-[#7b6a5e]">Manage listing quality, pricing, and stock from one place.</p>
              </div>
              <button
                onClick={openNewProduct}
                className={primaryButtonClass}
                type="button"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Add product
              </button>
            </div>

            {loadingProducts ? (
              <LoadingRows />
            ) : products.length === 0 ? (
              <EmptyState
                title="No products listed"
                description="Add your first product with price, stock, materials, origin, and images so shoppers can buy from your cooperative."
                action={
                  <button
                    onClick={openNewProduct}
                    className={primaryButtonClass}
                    type="button"
                  >
                    Add first product
                  </button>
                }
              />
            ) : (
              <>
              <div className={`${panelClass} mb-12 hidden overflow-hidden md:block`}>
                {/* Table header */}
                <div className="grid grid-cols-[minmax(220px,2fr)_0.8fr_0.8fr_1fr_auto] gap-4 border-b border-[#eadfd5] bg-[#fbf7f2] px-4 py-3 text-xs font-bold uppercase tracking-[0.08em] text-[#8c7b6f]">
                  <span>Product</span>
                  <span>Category</span>
                  <span>Price</span>
                  <span>Inventory</span>
                  <span className="text-right">Actions</span>
                </div>

                {products.map((product, idx) => {
                  const status = getProductStatus(product);

                  return (
                  <div
                    key={product._id}
                    className={`grid grid-cols-[minmax(220px,2fr)_0.8fr_0.8fr_1fr_auto] items-center gap-4 px-4 py-3.5 ${
                      idx < products.length - 1 ? "border-b border-[#f1e8df]" : ""
                    } transition-colors hover:bg-[#faf6f2]`}
                  >
                    {/* Product name + image */}
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-[#faf6f2]">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[#b7a99d]">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[#1a1008]">{product.name}</p>
                        {(product.fairTradeCertified || product.isFairTrade) && (
                          <span className="text-xs font-semibold text-[#19786d]">Fair trade</span>
                        )}
                      </div>
                    </div>

                    {/* Category */}
                    <span className="truncate text-sm font-medium text-[#6b5a4e]">{formatCategory(product.category)}</span>

                    {/* Price */}
                    <span className="text-sm font-semibold text-[#1a1008]">{formatPrice(product.price)}</span>

                    {/* Stock */}
                    <div className="flex items-center gap-2">
                      <StatusChip label={status.label} tone={status.tone} />
                      <span className="text-xs font-medium text-[#8c7b6f]">{product.stock ?? 0} units</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setModalProduct(product)}
                        className="rounded-lg p-2 text-[#8c7b6f] transition-colors hover:bg-[#f5eee7] hover:text-[#1a1008]"
                        aria-label="Edit"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteTarget(product)}
                        className="rounded-lg p-2 text-[#8c7b6f] transition-colors hover:bg-red-50 hover:text-red-500"
                        aria-label="Delete"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                          <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                );
                })}
              </div>
              <div className="space-y-3 pb-10 md:hidden">
                {products.map((product) => (
                  <ProductMobileCard
                    key={product._id}
                    product={product}
                    onEdit={() => setModalProduct(product)}
                    onDelete={() => setDeleteTarget(product)}
                  />
                ))}
              </div>
              </>
            )}
          </FadeSection>
        )}

        {/* ── Reviews Tab ──────────────────────────────────────────────────── */}
        {activeTab === "reviews" && (
          <FadeSection>
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8c7b6f]">Feedback</p>
              <h2 className="mt-1 text-xl font-bold text-[#1a1008]">Customer reviews</h2>
              <p className="mt-1 text-sm text-[#7b6a5e]">Monitor product sentiment and shopper confidence.</p>
            </div>
            {loadingReviews ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className={`${panelClass} h-24 animate-pulse bg-[#f6f0eb]`} />
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <EmptyState
                title="No customer reviews yet"
                description="Reviews from product buyers will appear here with ratings, comments, dates, and product context."
              />
            ) : (
              <div>
                {/* Summary */}
                {avgRating !== null && (
                  <div className={`${panelClass} mb-5 flex w-full max-w-md items-center gap-4 p-4`}>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-[#1a1008]">{avgRating.toFixed(1)}</p>
                      <StarRating rating={avgRating} size={18} />
                      <p className="text-xs text-[#9a8a7a] mt-1">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</p>
                    </div>
                    <div className="space-y-1 min-w-35">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = reviews.filter((r) => Math.round(r.rating) === star).length;
                        const pct = reviews.length ? (count / reviews.length) * 100 : 0;
                        return (
                          <div key={star} className="flex items-center gap-2">
                            <span className="text-xs text-[#9a8a7a] w-3">{star}</span>
                            <div className="flex-1 h-1.5 bg-[#f0e8e0] rounded-full overflow-hidden">
                              <div className="h-full bg-[#E9C46A] rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-[#9a8a7a] w-4">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="space-y-3 pb-12">
                  {reviews.map((review) => (
                    <div key={review._id} className={`${panelClass} p-4`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1a1008] text-sm font-bold text-white">
                            {review.userName?.charAt(0).toUpperCase() ?? "?"}
                          </div>
                          <div>
                            <p className="font-semibold text-[#1a1008] text-sm">{review.userName ?? "Anonymous"}</p>
                            {review.productName && (
                              <p className="text-xs text-[#9a8a7a]">on {review.productName}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <StarRating rating={review.rating} size={13} />
                          <span className="text-xs text-[#9a8a7a]">
                            {new Date(review.createdAt).toLocaleDateString("en-GB", { year: "numeric", month: "short" })}
                          </span>
                        </div>
                      </div>
                      <p className="text-[#6b5a4e] text-sm mt-3 leading-relaxed">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </FadeSection>
        )}

        {/* ── Settings Tab ─────────────────────────────────────────────────── */}
        {activeTab === "settings" && (
          <FadeSection>
            <div className="grid gap-6 pb-12 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
              {/* Cooperative profile */}
              <div>
                <div className="mb-4">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8c7b6f]">Storefront</p>
                  <h2 className="mt-1 text-xl font-bold text-[#1a1008]">Cooperative profile</h2>
                  <p className="mt-1 text-sm text-[#7b6a5e]">These details shape how shoppers evaluate your cooperative.</p>
                </div>
                <form onSubmit={coopForm.handleSubmit(onCoopSettingsSubmit)} className={`${panelClass} overflow-hidden`}>
                  <div className="space-y-4 p-5 sm:p-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Cooperative name" error={coopForm.formState.errors.cooperativeName?.message}>
                        <input {...coopForm.register("cooperativeName")} className={inputClass} placeholder="e.g. Coopérative Tiziri" />
                      </Field>

                      <Field label="City" error={coopForm.formState.errors.cooperativeCity?.message}>
                        <input {...coopForm.register("cooperativeCity")} className={inputClass} placeholder="e.g. Taroudannt" />
                      </Field>
                    </div>

                    <Field label="Description">
                      <textarea {...coopForm.register("description")} rows={4} className={textareaClass} placeholder="Tell visitors about your cooperative…" />
                    </Field>

                    <Field label="Impact statement" hint="How does the cooperative support its artisans?">
                      <textarea {...coopForm.register("impactStatement")} rows={2} className={textareaClass} placeholder="We invest 20% of profits in education…" />
                    </Field>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Number of artisans" error={coopForm.formState.errors.artisanCount?.message}>
                        <input {...coopForm.register("artisanCount", { valueAsNumber: true })} type="number" min={0} className={inputClass} placeholder="e.g. 24" />
                      </Field>
                      <Field label="Founded year" error={coopForm.formState.errors.foundedYear?.message}>
                        <input {...coopForm.register("foundedYear", { valueAsNumber: true })} type="number" min={1900} max={new Date().getFullYear()} className={inputClass} placeholder="e.g. 2008" />
                      </Field>
                    </div>
                  </div>

                  <div className="flex justify-end border-t border-[#eadfd5] bg-[#fbf7f2] px-5 py-3 sm:px-6">
                    <button
                      type="submit"
                      disabled={coopForm.formState.isSubmitting}
                      className={primaryButtonClass}
                    >
                      {coopForm.formState.isSubmitting ? (
                        <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Saving…</>
                      ) : "Update profile"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Account settings */}
              <div>
                <div className="mb-4">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8c7b6f]">Access</p>
                  <h2 className="mt-1 text-xl font-bold text-[#1a1008]">Account settings</h2>
                  <p className="mt-1 text-sm text-[#7b6a5e]">Keep owner login details current and secure.</p>
                </div>
                <form onSubmit={accountForm.handleSubmit(onAccountSubmit)} className={`${panelClass} overflow-hidden`}>
                  <div className="space-y-4 p-5 sm:p-6">
                    <Field label="Full name" error={accountForm.formState.errors.name?.message}>
                      <input {...accountForm.register("name")} className={inputClass} placeholder="Your name" />
                    </Field>

                    <Field label="Email address" error={accountForm.formState.errors.email?.message}>
                      <input {...accountForm.register("email")} type="email" className={inputClass} />
                    </Field>

                    <div className="border-t border-[#eadfd5] pt-4">
                      <p className="mb-3 text-xs text-[#8c7b6f]">Leave password fields blank to keep your current password.</p>
                      <div className="space-y-4">
                        <Field label="Current password" error={accountForm.formState.errors.currentPassword?.message}>
                          <input {...accountForm.register("currentPassword")} type="password" className={inputClass} placeholder="••••••••" autoComplete="current-password" />
                        </Field>
                        <Field label="New password" error={accountForm.formState.errors.newPassword?.message}>
                          <input {...accountForm.register("newPassword")} type="password" className={inputClass} placeholder="••••••••" autoComplete="new-password" />
                        </Field>
                        <Field label="Confirm new password" error={accountForm.formState.errors.confirmPassword?.message}>
                          <input {...accountForm.register("confirmPassword")} type="password" className={inputClass} placeholder="••••••••" autoComplete="new-password" />
                        </Field>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end border-t border-[#eadfd5] bg-[#fbf7f2] px-5 py-3 sm:px-6">
                    <button
                      type="submit"
                      disabled={accountForm.formState.isSubmitting}
                      className={primaryButtonClass}
                    >
                      {accountForm.formState.isSubmitting ? (
                        <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Saving…</>
                      ) : "Save changes"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </FadeSection>
        )}
      </main>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      {modalProduct !== null && (
        <ProductModal
          product={modalProduct === "new" ? null : modalProduct}
          coopId={user?.cooperativeId ?? coop?._id ?? ""}
          onClose={() => setModalProduct(null)}
          onSaved={handleProductSaved}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          product={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <Footer />
    </div>
  );
}
