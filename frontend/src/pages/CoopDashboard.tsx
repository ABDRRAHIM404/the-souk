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
const CATEGORIES = ["weaving", "pottery", "argan", "jewellery", "leather", "woodwork", "cosmetics", "food", "other"];
const CURRENCIES = ["MAD", "EUR", "USD", "GBP"];

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
      <label className="block text-sm font-semibold text-[#1a1008] mb-1.5">{label}</label>
      {hint && <p className="text-xs text-[#9a8a7a] mb-1.5">{hint}</p>}
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

const inputClass =
  "w-full px-4 py-3 rounded-xl border border-[#f0e8e0] bg-white text-[#1a1008] text-sm placeholder:text-[#c4b8ae] focus:outline-none focus:ring-2 focus:ring-[#E76F51]/30 focus:border-[#E76F51] transition-all";

const textareaClass =
  "w-full px-4 py-3 rounded-xl border border-[#f0e8e0] bg-white text-[#1a1008] text-sm placeholder:text-[#c4b8ae] focus:outline-none focus:ring-2 focus:ring-[#E76F51]/30 focus:border-[#E76F51] transition-all resize-none";

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
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          dragging ? "border-[#E76F51] bg-[#E76F51]/5" : "border-[#f0e8e0] hover:border-[#E76F51]/40 hover:bg-[#faf6f2]"
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
    } catch {
      toast.error("Could not save product");
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div
        className="bg-[#FFFCF8] rounded-3xl w-full max-w-2xl my-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between p-6 border-b border-[#f0e8e0]">
          <h2 className="font-['Playfair_Display'] font-bold text-xl text-[#1a1008]">
            {isEdit ? "Edit Product" : "List New Product"}
          </h2>
          <button onClick={onClose} className="text-[#9a8a7a] hover:text-[#1a1008] transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
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
          <div className="grid grid-cols-2 gap-4">
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
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
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
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-full border border-[#f0e8e0] text-[#6b5a4e] font-semibold text-sm hover:bg-[#faf6f2] transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || uploading}
              className="flex-1 py-3 rounded-full bg-[#E76F51] text-white font-semibold text-sm hover:bg-[#d46043] transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(231,111,81,0.3)]"
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
function DeleteConfirmModal({ product, onConfirm, onCancel }: { product: Product; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#FFFCF8] rounded-3xl w-full max-w-sm p-8 shadow-2xl text-center">
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <h3 className="font-['Playfair_Display'] font-bold text-xl text-[#1a1008] mb-2">Delete Product?</h3>
        <p className="text-[#6b5a4e] text-sm mb-6">
          <span className="font-semibold">"{product.name}"</span> will be permanently removed from the marketplace.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-full border border-[#f0e8e0] text-[#6b5a4e] font-semibold text-sm hover:bg-[#faf6f2] transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-full bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-colors">
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
    if (!user?.cooperativeId) return;
    async function load() {
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
    if (!user?.cooperativeId) return;
    async function load() {
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
    if (!user?.cooperativeId) return;
    try {
      await coopService.update(user.cooperativeId, {
        name: data.cooperativeName,
        city: data.cooperativeCity,
        description: data.description,
        impactStatement: data.impactStatement,
        artisanCount: data.artisanCount,
        foundedYear: data.foundedYear,
      });
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
  const avgRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : null;

  const tabs = [
    { id: "products" as const, label: "Products", count: products.length },
    { id: "reviews" as const, label: "Reviews", count: reviews.length },
    { id: "settings" as const, label: "Settings", count: null },
  ];

  return (
    <div className="min-h-screen bg-[#FFFCF8]">
      <Navbar />

      {/* Header */}
      <div className="bg-linear-to-br from-[#2A9D8F]/8 via-[#FFFCF8] to-[#E9C46A]/5 border-b border-[#f0e8e0]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-[14px] bg-linear-to-br from-[#2A9D8F] to-[#E9C46A] flex items-center justify-center text-white font-['Playfair_Display'] font-bold text-2xl shrink-0">
                {coop?.name?.charAt(0) ?? user?.name?.charAt(0) ?? "C"}
              </div>
              <div>
                <h1 className="font-['Playfair_Display'] font-bold text-2xl md:text-3xl text-[#1a1008]">
                  {coop?.name ?? user?.name ?? "Cooperative"}
                </h1>
                <p className="text-[#9a8a7a] text-sm mt-0.5">
                  {coop?.city ? `📍 ${coop.city}, Morocco` : "Cooperative dashboard"}
                </p>
              </div>
            </div>

            {/* Quick stats */}
            <div className="flex gap-4 flex-wrap">
              {[
                { label: "Products", value: products.length },
                { label: "In Stock", value: totalStock },
                { label: "Reviews", value: reviews.length },
                ...(avgRating !== null ? [{ label: "Avg Rating", value: avgRating.toFixed(1) }] : []),
              ].map((stat) => (
                <div key={stat.label} className="bg-white rounded-[14px] px-4 py-3 shadow-[0_2px_12px_rgba(0,0,0,0.06)] text-center min-w-17.5">
                  <p className="text-xl font-['Playfair_Display'] font-bold text-[#1a1008]">{stat.value}</p>
                  <p className="text-xs text-[#9a8a7a] mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Tabs */}
        <div className="border-b border-[#f0e8e0] mb-8">
          <div className="flex gap-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? "border-[#2A9D8F] text-[#2A9D8F]"
                    : "border-transparent text-[#9a8a7a] hover:text-[#6b5a4e]"
                }`}
              >
                {tab.label}
                {tab.count !== null && tab.count > 0 && (
                  <span className="bg-[#f0e8e0] text-[#6b5a4e] text-xs px-2 py-0.5 rounded-full">
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-['Playfair_Display'] font-bold text-xl text-[#1a1008]">Your Listings</h2>
              <button
                onClick={() => setModalProduct("new")}
                className="flex items-center gap-2 bg-[#E76F51] text-white px-5 py-2.5 rounded-full font-semibold text-sm hover:bg-[#d46043] transition-colors shadow-[0_4px_16px_rgba(231,111,81,0.3)]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Add Product
              </button>
            </div>

            {loadingProducts ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl h-20 animate-pulse" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#f0e8e0] flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-[#E76F51]">
                    <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M12 12v4M10 14h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <h3 className="font-['Playfair_Display'] font-bold text-xl text-[#1a1008] mb-2">No products yet</h3>
                <p className="text-[#9a8a7a] mb-6">List your first product to start selling on The Souk.</p>
                <button
                  onClick={() => setModalProduct("new")}
                  className="inline-block bg-[#E76F51] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#d46043] transition-colors"
                >
                  Add your first product
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-[20px] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.06)] mb-12">
                {/* Table header */}
                <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-[#f0e8e0] text-xs font-semibold text-[#9a8a7a] uppercase tracking-wide">
                  <span>Product</span>
                  <span>Category</span>
                  <span>Price</span>
                  <span>Stock</span>
                  <span />
                </div>

                {products.map((product, idx) => (
                  <div
                    key={product._id}
                    className={`grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 items-center px-5 py-4 ${
                      idx < products.length - 1 ? "border-b border-[#f0e8e0]" : ""
                    } hover:bg-[#faf6f2] transition-colors`}
                  >
                    {/* Product name + image */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#faf6f2] shrink-0">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="opacity-30">
                              <rect x="3" y="3" width="18" height="18" rx="3" stroke="#6b5a4e" strokeWidth="1.5" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#1a1008] truncate">{product.name}</p>
                        {product.isFairTrade && (
                          <span className="text-[10px] text-[#2A9D8F] font-bold uppercase tracking-wide">Fair Trade</span>
                        )}
                      </div>
                    </div>

                    {/* Category */}
                    <span className="text-sm text-[#6b5a4e] capitalize truncate">{product.category}</span>

                    {/* Price */}
                    <span className="text-sm font-semibold text-[#E76F51]">
                      MAD {(product.price as number).toFixed(2)}
                    </span>

                    {/* Stock */}
                    <span className={`text-sm font-semibold ${product.stock === 0 ? "text-red-500" : "text-[#1a1008]"}`}>
                      {product.stock ?? "—"}
                      {product.stock === 0 && <span className="text-xs font-normal text-red-400 ml-1">Out</span>}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setModalProduct(product)}
                        className="p-2 text-[#9a8a7a] hover:text-[#E76F51] hover:bg-[#E76F51]/5 rounded-lg transition-colors"
                        aria-label="Edit"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteTarget(product)}
                        className="p-2 text-[#9a8a7a] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        aria-label="Delete"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                          <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </FadeSection>
        )}

        {/* ── Reviews Tab ──────────────────────────────────────────────────── */}
        {activeTab === "reviews" && (
          <FadeSection>
            {loadingReviews ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-[20px] h-24 animate-pulse" />
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#f0e8e0] flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-[#E76F51]">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 10h8M8 13h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <h3 className="font-['Playfair_Display'] font-bold text-xl text-[#1a1008] mb-2">No reviews yet</h3>
                <p className="text-[#9a8a7a]">Reviews left by customers on your products will appear here.</p>
              </div>
            ) : (
              <div>
                {/* Summary */}
                {avgRating !== null && (
                  <div className="flex items-center gap-4 mb-6 bg-white rounded-[20px] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.06)] w-fit">
                    <div className="text-center">
                      <p className="text-4xl font-['Playfair_Display'] font-bold text-[#1a1008]">{avgRating.toFixed(1)}</p>
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

                <div className="space-y-4 pb-12">
                  {reviews.map((review) => (
                    <div key={review._id} className="bg-white rounded-[20px] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#E76F51] to-[#E9C46A] flex items-center justify-center text-white font-bold text-sm shrink-0">
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
            <div className="max-w-xl space-y-8 pb-12">
              {/* Cooperative profile */}
              <div>
                <h2 className="font-['Playfair_Display'] font-bold text-xl text-[#1a1008] mb-5">Cooperative Profile</h2>
                <form onSubmit={coopForm.handleSubmit(onCoopSettingsSubmit)} className="bg-white rounded-[20px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] space-y-4">
                  <Field label="Cooperative Name" error={coopForm.formState.errors.cooperativeName?.message}>
                    <input {...coopForm.register("cooperativeName")} className={inputClass} placeholder="e.g. Coopérative Tiziri" />
                  </Field>

                  <Field label="City" error={coopForm.formState.errors.cooperativeCity?.message}>
                    <input {...coopForm.register("cooperativeCity")} className={inputClass} placeholder="e.g. Taroudannt" />
                  </Field>

                  <Field label="Description">
                    <textarea {...coopForm.register("description")} rows={4} className={textareaClass} placeholder="Tell visitors about your cooperative…" />
                  </Field>

                  <Field label="Impact Statement" hint="How does the cooperative support its artisans?">
                    <textarea {...coopForm.register("impactStatement")} rows={2} className={textareaClass} placeholder="We invest 20% of profits in education…" />
                  </Field>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Number of Artisans" error={coopForm.formState.errors.artisanCount?.message}>
                      <input {...coopForm.register("artisanCount", { valueAsNumber: true })} type="number" min={0} className={inputClass} placeholder="e.g. 24" />
                    </Field>
                    <Field label="Founded Year" error={coopForm.formState.errors.foundedYear?.message}>
                      <input {...coopForm.register("foundedYear", { valueAsNumber: true })} type="number" min={1900} max={2025} className={inputClass} placeholder="e.g. 2008" />
                    </Field>
                  </div>

                  <button
                    type="submit"
                    disabled={coopForm.formState.isSubmitting}
                    className="w-full py-3.5 rounded-full bg-[#2A9D8F] text-white font-semibold text-sm hover:bg-[#228a7d] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {coopForm.formState.isSubmitting ? (
                      <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Saving…</>
                    ) : "Update Profile"}
                  </button>
                </form>
              </div>

              {/* Account settings */}
              <div>
                <h2 className="font-['Playfair_Display'] font-bold text-xl text-[#1a1008] mb-5">Account Settings</h2>
                <form onSubmit={accountForm.handleSubmit(onAccountSubmit)} className="bg-white rounded-[20px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] space-y-4">
                  <Field label="Full name" error={accountForm.formState.errors.name?.message}>
                    <input {...accountForm.register("name")} className={inputClass} placeholder="Your name" />
                  </Field>

                  <Field label="Email address" error={accountForm.formState.errors.email?.message}>
                    <input {...accountForm.register("email")} type="email" className={inputClass} />
                  </Field>

                  <div className="pt-2 border-t border-[#f0e8e0]">
                    <p className="text-xs text-[#9a8a7a] mb-3">Leave password fields blank to keep your current password.</p>
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

                  <button
                    type="submit"
                    disabled={accountForm.formState.isSubmitting}
                    className="w-full py-3.5 rounded-full bg-[#E76F51] text-white font-semibold text-sm hover:bg-[#d46043] transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(231,111,81,0.3)]"
                  >
                    {accountForm.formState.isSubmitting ? (
                      <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Saving…</>
                    ) : "Save Account Changes"}
                  </button>
                </form>
              </div>
            </div>
          </FadeSection>
        )}
      </div>

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