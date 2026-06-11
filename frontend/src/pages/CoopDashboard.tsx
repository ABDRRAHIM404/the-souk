import { useState, useEffect, useRef, useCallback } from "react";
import type { Product, Cooperative, ProductCategory, Order } from "@/types";
import { productService } from "@/services/productService";
import { coopService } from "@/services/coopService";
import { orderService } from "@/services/orderService";
import api from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import FadeSection from "@/components/FadeSection";
import {
  DashboardEmptyState,
  DashboardMobileTabs,
  DashboardShell,
  DashboardTopBar,
} from "@/components/DashboardShell";
import StatusChip from "@/components/ui/StatusChip";
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
      <label className="mb-1.5 block text-xs font-semibold text-[#6B5840]">{label}</label>
      {hint && <p className="mb-1.5 text-[11px] text-[#9E8F7A]">{hint}</p>}
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

const inputClass =
  "w-full rounded-[7px] border-[1.5px] border-[#EDE8DF] bg-[#F5EFE4] px-3 py-2.5 text-[13.5px] text-[#1A1209] placeholder:text-[#9E8F7A] transition-all focus:border-[#C8922A] focus:bg-white focus:outline-none";

const textareaClass =
  "w-full resize-y rounded-[7px] border-[1.5px] border-[#EDE8DF] bg-[#F5EFE4] px-3 py-2.5 text-[13.5px] text-[#1A1209] placeholder:text-[#9E8F7A] transition-all focus:border-[#C8922A] focus:bg-white focus:outline-none min-h-[80px]";

const panelClass = "rounded-[10px] border border-[#EDE8DF] bg-white overflow-hidden";
const primaryButtonClass =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#1A1209] px-4 py-2.5 text-[13px] font-semibold text-[#F5EFE4] transition-colors hover:bg-[#2D2010] disabled:opacity-60";
const secondaryButtonClass =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[#EDE8DF] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#6B5840] transition-colors hover:border-[#d8cbbf] hover:bg-[#faf6f2] hover:text-[#1A1209]";
const goldButtonClass =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#C8922A] px-3.5 py-2 text-[13px] font-semibold text-[#1A1209] transition-colors hover:bg-[#D4A030] disabled:opacity-60";
const ghostSidebarButtonClass =
  "inline-flex w-full items-center justify-center gap-2 rounded-md border border-[#2A1E10] bg-transparent px-3.5 py-2 text-[13px] font-medium text-[#9E8F7A] transition-all hover:border-[#6B5840] hover:text-[#F5EFE4]";
const outlineButtonClass =
  "inline-flex items-center justify-center gap-1.5 rounded-md border-[1.5px] border-[#1A1209] bg-transparent px-4 py-2 text-[13px] font-semibold text-[#1A1209] transition-all hover:bg-[#1A1209] hover:text-[#F5EFE4]";

function formatCategory(category: string) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

function formatPrice(price: number | undefined) {
  return `MAD ${(price ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDateShort(value?: string) {
  if (!value) return "Not updated yet";
  return new Date(value).toLocaleDateString("en-GB", { month: "short", day: "numeric" });
}

function getProductStatus(product: Product) {
  if (product.stock === 0 || product.isAvailable === false) return { label: "Out of stock", tone: "danger" as const };
  if ((product.stock ?? 0) <= 5) return { label: "Low stock", tone: "warning" as const };
  return { label: "Active", tone: "success" as const };
}

function getCoopLocation(coop: Cooperative | null) {
  const city = coop?.location?.city ?? coop?.city;
  const region = coop?.location?.region ?? coop?.region;
  const place = [city, region].filter(Boolean).join(" · ");
  return place ? `${place}, Morocco` : "Set up your profile to help shoppers find your cooperative.";
}

function getGreeting(name: string) {
  const hour = new Date().getHours();
  const salutation = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return `${salutation}, ${name.split(" ")[0]}`;
}

function isStaleConfirmedOrder(order: Order) {
  if (order.status !== "confirmed") return false;
  const reference = order.updatedAt ?? order.createdAt;
  const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
  return Date.now() - new Date(reference).getTime() > twoDaysMs;
}

function getDaysSinceConfirmed(order: Order) {
  const reference = order.updatedAt ?? order.createdAt;
  return Math.floor((Date.now() - new Date(reference).getTime()) / (24 * 60 * 60 * 1000));
}

function CoopOrderBadge({ status }: { status: Order["status"] }) {
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  const toneClass =
    status === "confirmed"
      ? "coop-order-badge-confirmed"
      : status === "delivered"
        ? "coop-order-badge-delivered"
        : status === "pending"
          ? "coop-order-badge-pending"
          : "coop-order-badge-cancelled";

  return (
    <span className={`coop-order-badge ${toneClass}`}>
      <span className="coop-order-badge-dot" />
      {label}
    </span>
  );
}

function AmazighDivider() {
  return (
    <svg className="mx-5 mb-5 h-3 w-[calc(100%-40px)] overflow-visible" viewBox="0 0 180 12" fill="none" aria-hidden="true">
      <line x1="0" y1="6" x2="60" y2="6" stroke="#2A1E10" strokeWidth="1" />
      <rect x="72" y="2" width="8" height="8" transform="rotate(45 76 6)" fill="none" stroke="#C8922A" strokeWidth="1.2" />
      <line x1="68" y1="6" x2="72" y2="6" stroke="#2A1E10" strokeWidth="1" />
      <line x1="80" y1="6" x2="84" y2="6" stroke="#2A1E10" strokeWidth="1" />
      <line x1="96" y1="2" x2="96" y2="10" stroke="#6B5840" strokeWidth="1" />
      <line x1="84" y1="6" x2="96" y2="6" stroke="#2A1E10" strokeWidth="1" />
      <line x1="96" y1="6" x2="108" y2="6" stroke="#2A1E10" strokeWidth="1" />
      <rect x="108" y="2" width="8" height="8" transform="rotate(45 112 6)" fill="none" stroke="#C8922A" strokeWidth="1.2" />
      <line x1="116" y1="6" x2="120" y2="6" stroke="#2A1E10" strokeWidth="1" />
      <line x1="120" y1="6" x2="180" y2="6" stroke="#2A1E10" strokeWidth="1" />
    </svg>
  );
}

function CoopPageHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-7">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#C8922A]">{eyebrow}</p>
      <h1 className="font-display mt-1 text-[28px] font-medium tracking-[-0.02em] text-[#1A1209]">{title}</h1>
    </div>
  );
}

function CoopStatCard({
  label,
  value,
  detail,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  detail: React.ReactNode;
  accent: "gold" | "green" | "clay" | "ink";
}) {
  return (
    <div className="coop-stat-card" data-accent={accent}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#9E8F7A]">{label}</p>
      <p className="font-display mt-2 text-[36px] font-light leading-none tracking-[-0.02em] text-[#1A1209]">{value}</p>
      <p className="mt-1.5 text-xs text-[#9E8F7A]">{detail}</p>
    </div>
  );
}

function Icon({ name, className = "" }: { name: "plus" | "store" | "box" | "star" | "settings" | "review" | "empty" | "orders" | "trend"; className?: string }) {
  const paths = {
    plus: <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />,
    store: <path d="M4 10h16l-1.2-5.2A1 1 0 0017.8 4H6.2a1 1 0 00-1 .8L4 10Zm1 0v10h14V10M9 20v-6h6v6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />,
    box: <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Zm0 8.8 8-4.3M12 11.8 4 7.5M12 21v-9.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />,
    star: <path d="m12 3.5 2.5 5.1 5.6.8-4 3.9.9 5.5-5-2.6-5 2.6.9-5.5-4-3.9 5.6-.8L12 3.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />,
    settings: <path d="M12 15.5A3.5 3.5 0 1012 8a3.5 3.5 0 000 7.5Zm7.4-2.2a7.8 7.8 0 000-2.6l2-1.5-2-3.5-2.4 1a8 8 0 00-2.2-1.3L14.5 3h-4l-.4 2.4A8 8 0 008 6.7l-2.4-1-2 3.5 2 1.5a7.8 7.8 0 000 2.6l-2 1.5 2 3.5 2.4-1a8 8 0 002.2 1.3l.4 2.4h4l.4-2.4a8 8 0 002.2-1.3l2.4 1 2-3.5-2.2-1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />,
    review: <path d="M4 5.5A2.5 2.5 0 016.5 3h11A2.5 2.5 0 0120 5.5v7A2.5 2.5 0 0117.5 15H9l-5 4V5.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />,
    empty: <path d="M5 8h14M7 8v11h10V8M10 8V6a2 2 0 014 0v2M9.5 13h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />,
    orders: <path d="M7 7h10M7 12h10M7 17h6M5 3h14a1 1 0 011 1v16l-3-2-3 2-3-2-3 2-3-2-3 2V4a1 1 0 011-1Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />,
    trend: <path d="M4 17l5-5 4 4 7-8M15 8h5v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />,
  };

  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">{paths[name]}</svg>;
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
    <article className={`${panelClass} p-4`}>
      <div className="flex gap-3">
        <div className="h-18 w-18 shrink-0 overflow-hidden rounded-lg border border-[#f0e8e0] bg-[#faf6f2]">
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
              <p className="mt-1 text-xs font-medium text-[#8c7b6f]">
                {formatCategory(product.category)}{product.origin ? ` · ${product.origin}` : ""}
              </p>
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
              <p className="font-semibold text-[#1a1008]">{product.stock ?? 0} units</p>
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
function getOrderItemSummary(order: Order) {
  const firstItem = order.items[0];
  const firstProduct = typeof firstItem?.product === "object" ? firstItem.product : null;
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  return {
    itemCount,
    title: firstProduct?.name ?? "Marketplace order",
    image: firstProduct?.images?.[0],
    extra: itemCount > 1 ? `+${itemCount - 1} more` : "Single item",
  };
}

function getTourist(order: Order) {
  if (typeof order.tourist === "object") {
    return {
      name: order.tourist.name,
      email: order.tourist.email,
      country: order.tourist.country,
    };
  }
  return { name: "Tourist", email: "", country: "" };
}

function OrderActions({
  order,
  busy,
  onUpdate,
}: {
  order: Order;
  busy: boolean;
  onUpdate: (id: string, status: "confirmed" | "delivered" | "cancelled") => void;
}) {
  if (order.status === "pending") {
    return (
      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" disabled={busy} onClick={() => onUpdate(order._id, "confirmed")} className="rounded-lg bg-[#1a1008] px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-[#332216] disabled:opacity-50">
          Confirm
        </button>
        <button type="button" disabled={busy} onClick={() => onUpdate(order._id, "cancelled")} className="rounded-lg border border-red-100 bg-white px-3 py-2 text-xs font-bold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50">
          Cancel
        </button>
      </div>
    );
  }

  if (order.status === "confirmed") {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={() => onUpdate(order._id, "delivered")}
        className="whitespace-nowrap rounded-md bg-[#1A1209] px-3 py-1.5 text-xs font-semibold text-[#F5EFE4] transition-colors hover:bg-[#2D2010] disabled:opacity-50"
      >
        Confirm delivery
      </button>
    );
  }

  return <span className="text-xs text-[#9E8F7A]">No actions</span>;
}

function OrderRow({
  order,
  busy,
  onUpdate,
}: {
  order: Order;
  busy: boolean;
  onUpdate: (id: string, status: "confirmed" | "delivered" | "cancelled") => void;
}) {
  const summary = getOrderItemSummary(order);
  const tourist = getTourist(order);
  const needsAction = isStaleConfirmedOrder(order);

  return (
    <div
      className={`grid grid-cols-1 items-center gap-4 border-b border-[#EDE8DF] px-5 py-3.5 transition-colors last:border-b-0 hover:bg-[#FDFAF6] sm:grid-cols-[1fr_auto_auto_auto] ${needsAction ? "coop-needs-action" : ""}`}
    >
      <div className="min-w-0">
        <p className="coop-order-id text-[13px] font-semibold text-[#1A1209]">#{order._id.slice(-6).toUpperCase()}</p>
        <p className="mt-0.5 text-xs text-[#9E8F7A]">
          {tourist.name} · {new Date(order.createdAt).toLocaleDateString("en-GB", { month: "short", day: "numeric", year: "numeric" })}
        </p>
        <p className="mt-0.5 text-xs italic text-[#6B5840]">
          {summary.title} — {summary.extra.toLowerCase()}
        </p>
      </div>
      <span className="text-sm font-semibold text-[#1A1209]">{formatPrice(order.total)}</span>
      <CoopOrderBadge status={order.status} />
      <OrderActions order={order} busy={busy} onUpdate={onUpdate} />
    </div>
  );
}

function OrdersTable({
  orders,
  updatingOrderId,
  onUpdate,
}: {
  orders: Order[];
  updatingOrderId: string | null;
  onUpdate: (id: string, status: "confirmed" | "delivered" | "cancelled") => void;
}) {
  return (
    <div className={panelClass}>
      {orders.map((order) => (
        <OrderRow
          key={order._id}
          order={order}
          busy={updatingOrderId === order._id}
          onUpdate={onUpdate}
        />
      ))}
    </div>
  );
}

export default function CoopDashboard() {
  const { user, refreshAuth } = useAuth();

  const [activeTab, setActiveTab] = useState<"overview" | "products" | "orders" | "reviews" | "settings">("overview");

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

  // Orders
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

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

  // Fetch incoming orders
  useEffect(() => {
    async function load() {
      if (!user?.cooperativeId) {
        setLoadingOrders(false);
        return;
      }
      try {
        setLoadingOrders(true);
        const data = await orderService.getCoopOrders();
        setOrders(data ?? []);
      } catch {
        setOrders([]);
      } finally {
        setLoadingOrders(false);
      }
    }
    load();
  }, [user]);

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

  async function handleOrderStatus(orderId: string, status: "confirmed" | "delivered" | "cancelled") {
    try {
      setUpdatingOrderId(orderId);
      const saved = await orderService.updateStatus(orderId, status);
      setOrders((prev) => prev.map((order) => order._id === orderId ? { ...order, status: saved.status, updatedAt: saved.updatedAt } : order));
      toast.success("Order updated");
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not update order"));
    } finally {
      setUpdatingOrderId(null);
    }
  }

  // Summary stats
  const totalStock = products.reduce((sum, p) => sum + (p.stock ?? 0), 0);
  const activeProducts = products.filter((p) => p.stock > 0 && p.isAvailable !== false).length;
  const lowStockProducts = products.filter((p) => p.stock > 0 && p.stock <= 5).length;
  const pendingOrders = orders.filter((order) => order.status === "pending").length;
  const confirmedOrders = orders.filter((order) => order.status === "confirmed").length;
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

  const staleConfirmedOrders = orders.filter(isStaleConfirmedOrder);
  const firstStaleOrder = staleConfirmedOrders[0];

  function copyStorefrontLink() {
    if (!coopId) return;
    const url = `${window.location.origin}/coops/${coopId}`;
    void navigator.clipboard.writeText(url).then(
      () => toast.success("Storefront link copied!"),
      () => toast.error("Could not copy link"),
    );
  }

  const tabs = [
    { id: "overview" as const, label: "Overview", description: "Dashboard summary", count: null },
    { id: "products" as const, label: "Products", description: "Inventory and listings", count: products.length },
    { id: "orders" as const, label: "Orders", description: "Fulfillment queue", count: orders.length },
    { id: "reviews" as const, label: "Reviews", description: "Customer feedback", count: reviews.length },
    { id: "settings" as const, label: "Settings", description: "Storefront and access", count: null },
  ];
  const coopName = coop?.name ?? user?.name ?? "Cooperative";
  const coopLocation = getCoopLocation(coop);
  const isVerified = Boolean(coop?.verified || coop?.isCertified);

  const navIcons: Record<typeof activeTab, React.ReactNode> = {
    overview: (
      <svg className="h-[15px] w-[15px] shrink-0 opacity-70" viewBox="0 0 15 15" fill="currentColor" aria-hidden="true">
        <path d="M2 2h4v4H2V2zm7 0h4v4H9V2zm-7 7h4v4H2V9zm7 0h4v4H9V9z" />
      </svg>
    ),
    products: (
      <svg className="h-[15px] w-[15px] shrink-0 opacity-70" viewBox="0 0 15 15" fill="currentColor" aria-hidden="true">
        <path d="M7.5 1L1 4.5v6L7.5 14l6.5-3.5v-6L7.5 1zm0 1.8L12 5.5v5l-4.5 2.4L3 10.5v-5L7.5 2.8z" />
      </svg>
    ),
    orders: (
      <svg className="h-[15px] w-[15px] shrink-0 opacity-70" viewBox="0 0 15 15" fill="currentColor" aria-hidden="true">
        <path d="M2 2h11v2H2V2zm0 4h11v2H2V6zm0 4h7v2H2v-2z" />
      </svg>
    ),
    reviews: (
      <svg className="h-[15px] w-[15px] shrink-0 opacity-70" viewBox="0 0 15 15" fill="currentColor" aria-hidden="true">
        <path d="M7.5 1l1.8 3.6L13 5.3l-3 2.9.7 4.1-3.7-1.9-3.7 2 .7-4.1-3-2.9 3.7-.7z" />
      </svg>
    ),
    settings: (
      <svg className="h-[15px] w-[15px] shrink-0 opacity-70" viewBox="0 0 15 15" fill="currentColor" aria-hidden="true">
        <path d="M7.5 5a2.5 2.5 0 100 5 2.5 2.5 0 000-5zm-4.4 1.5L1 7.5l2.1 1 .3 1-1.5 1.7 1.4 1.4 1.7-1.5 1 .3 1 2.1 2-.1-.1-2.3 1-.3 1.7 1.5 1.4-1.4-1.5-1.7.3-1 2.1-1-.1-2-2.3-.1-1-.3 1.5-1.7-1.4-1.4-1.7 1.5-1-.3-1-2.1z" />
      </svg>
    ),
  };

  return (
    <DashboardShell>
      <div className="coop-dash flex min-h-screen flex-col">
        <DashboardTopBar role="coop_owner" />

        <div className="flex flex-1">
          <aside className="coop-sidebar">
            <div className="border-b border-[#2A1E10] px-5 pb-6">
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#6B5840]">Cooperative workspace</p>
              <h2 className="font-display mt-1.5 text-[22px] font-medium leading-tight tracking-[-0.01em] text-[#F5EFE4]">{coopName}</h2>
              <p className="mt-1 text-[11px] text-[#6B5840]">{coopLocation}</p>
              {isVerified && (
                <div className="mt-2">
                  <StatusChip label="Verified cooperative" tone="success" />
                </div>
              )}
            </div>

            <AmazighDivider />

            <nav className="flex flex-1 flex-col gap-0.5 px-3 py-2" aria-label="Workspace">
              <p className="px-2 pb-1 pt-3 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#4A3820]">Workspace</p>
              {tabs.map((tab) => {
                const active = tab.id === activeTab;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13.5px] font-medium transition-colors ${
                      active
                        ? "bg-[#2A1A08] text-[#C8922A] [&_svg]:opacity-100"
                        : "text-[#9E8F7A] hover:bg-[#1E1409] hover:text-[#F5EFE4]"
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    {navIcons[tab.id]}
                    <span className="flex-1">{tab.label}</span>
                    {tab.count !== null && tab.count > 0 && (
                      <span className="ml-auto min-w-[18px] rounded-[10px] bg-[#C8922A] px-1.5 py-0.5 text-center text-[10px] font-bold text-[#1A1209]">
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="flex flex-col gap-2 border-t border-[#2A1E10] px-3 pt-4">
              <button onClick={openNewProduct} className={`${goldButtonClass} w-full`} type="button">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor" aria-hidden="true">
                  <path d="M6.5 1v11M1 6.5h11" />
                </svg>
                Add product
              </button>
              {coopId && (
                <a href={`/coops/${coopId}`} className={ghostSidebarButtonClass}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
                    <path d="M1 6a5 5 0 1010 0A5 5 0 001 6zm4.5-2.5l3 2.5-3 2.5V3.5z" />
                  </svg>
                  View storefront
                </a>
              )}
            </div>
          </aside>

          <main className="max-w-[900px] flex-1 overflow-y-auto px-5 py-8 sm:px-9">
            <DashboardMobileTabs items={tabs} activeItem={activeTab} onSelect={setActiveTab} />

            {activeTab === "overview" && (
              <FadeSection>
                <CoopPageHeader
                  eyebrow="Dashboard"
                  title={user?.name ? getGreeting(user.name) : "Welcome back"}
                />

                {firstStaleOrder && (
                  <div className="mb-5 flex flex-col gap-3 rounded-[10px] border border-[#FCD34D] bg-[#FEF3C7] px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-[13px] font-medium text-[#B45309]">
                      Order #{firstStaleOrder._id.slice(-6).toUpperCase()} has been confirmed for {getDaysSinceConfirmed(firstStaleOrder)} days — ready to ship?
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("orders");
                        void handleOrderStatus(firstStaleOrder._id, "delivered");
                      }}
                      className="whitespace-nowrap text-xs font-semibold text-[#B45309] underline"
                    >
                      Confirm delivery →
                    </button>
                  </div>
                )}

                <section className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <CoopStatCard
                    label="Active listings"
                    value={activeProducts}
                    detail={`${products.length} total product${products.length === 1 ? "" : "s"}`}
                    accent="gold"
                  />
                  <CoopStatCard
                    label="Open orders"
                    value={pendingOrders + confirmedOrders}
                    detail={
                      <>
                        <strong className="font-semibold text-[#1A1209]">{confirmedOrders} confirmed</strong>
                        {" · "}
                        {pendingOrders} pending
                      </>
                    }
                    accent="green"
                  />
                  <CoopStatCard
                    label="Units in stock"
                    value={totalStock}
                    detail={`across ${products.length} product${products.length === 1 ? "" : "s"}`}
                    accent="clay"
                  />
                  <CoopStatCard
                    label="Avg. rating"
                    value={
                      avgRating ? (
                        avgRating.toFixed(1)
                      ) : (
                        <span className="font-display text-[22px] font-light italic text-[#9E8F7A]">not yet rated</span>
                      )
                    }
                    detail={reviews.length ? `${reviews.length} review${reviews.length === 1 ? "" : "s"}` : "Share your storefront to get reviews"}
                    accent="ink"
                  />
                </section>

                <section className="mb-8">
                  <div className="mb-3.5 flex items-baseline justify-between">
                    <h2 className="font-display text-[17px] font-medium tracking-[-0.01em] text-[#1A1209]">Recent orders</h2>
                    <button type="button" onClick={() => setActiveTab("orders")} className="text-xs font-medium text-[#C8922A] hover:underline">
                      View all →
                    </button>
                  </div>
                  {orders.length === 0 ? (
                    <p className="text-sm text-[#9E8F7A]">Incoming purchases will appear here as soon as tourists place orders.</p>
                  ) : (
                    <div className={panelClass}>
                      {orders.slice(0, 4).map((order) => (
                        <OrderRow
                          key={order._id}
                          order={order}
                          busy={updatingOrderId === order._id}
                          onUpdate={handleOrderStatus}
                        />
                      ))}
                    </div>
                  )}
                </section>

                <section>
                  <h2 className="font-display mb-3 text-[17px] font-medium tracking-[-0.01em] text-[#1A1209]">Inventory health</h2>
                  {products.length === 0 ? (
                    <p className="text-sm text-[#9E8F7A]">Add products to monitor stock levels and listing status.</p>
                  ) : lowStockProducts === 0 ? (
                    <div className="flex items-center gap-3 rounded-[10px] border border-[#A7D3BC] bg-[#D4EDE3] px-5 py-3.5 text-[13px] font-medium text-[#2D6A4F]">
                      <svg className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      All listings have healthy stock levels — no action needed.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {products
                        .filter((product) => product.stock <= 5 || product.isAvailable === false)
                        .slice(0, 4)
                        .map((product) => {
                          const status = getProductStatus(product);
                          return (
                            <button
                              key={product._id}
                              type="button"
                              onClick={() => setModalProduct(product)}
                              className="flex w-full items-center justify-between gap-4 rounded-[10px] border border-[#EDE8DF] bg-white px-5 py-3.5 text-left transition hover:bg-[#FDFAF6]"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-[#1A1209]">{product.name}</p>
                                <p className="mt-0.5 text-xs text-[#9E8F7A]">{product.stock ?? 0} units available</p>
                              </div>
                              <StatusChip label={status.label} tone={status.tone} />
                            </button>
                          );
                        })}
                    </div>
                  )}
                </section>
              </FadeSection>
            )}

        {activeTab === "products" && (
          <FadeSection>
            <CoopPageHeader eyebrow="Workspace" title="Product listings" />

            {loadingProducts ? (
              <LoadingRows />
            ) : products.length === 0 ? (
              <DashboardEmptyState
                title="No products listed"
                description="Add your first product with price, stock, materials, origin, and images so shoppers can buy from your cooperative."
                icon={<Icon name="empty" className="h-6 w-6" />}
                action={
                  <button onClick={openNewProduct} className={primaryButtonClass} type="button">
                    <Icon name="plus" />
                    Add product
                  </button>
                }
              />
            ) : (
              <>
              <div className={`${panelClass} mb-8 hidden overflow-hidden md:block`}>
                {/* Table header */}
                <div className="grid grid-cols-[minmax(260px,2fr)_0.8fr_0.8fr_1fr_auto] gap-5 border-b border-[#eadfd5] bg-[#fbf7f2] px-5 py-4 text-xs font-bold uppercase tracking-[0.08em] text-[#8c7b6f]">
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
                    className={`grid grid-cols-[minmax(260px,2fr)_0.8fr_0.8fr_1fr_auto] items-center gap-5 px-5 py-4.5 ${
                      idx < products.length - 1 ? "border-b border-[#f1e8df]" : ""
                    } transition-colors hover:bg-[#faf6f2]`}
                  >
                    {/* Product name + image */}
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-[#f0e8e0] bg-[#faf6f2]">
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
                        <p className="mt-0.5 truncate text-xs font-medium text-[#8c7b6f]">
                          {product.origin || "No origin set"} · Updated {formatDateShort(product.updatedAt)}
                        </p>
                      </div>
                    </div>

                    {/* Category */}
                    <span className="truncate text-sm font-medium text-[#6b5a4e]">{formatCategory(product.category)}</span>

                    {/* Price */}
                    <span className="text-sm font-semibold text-[#1a1008]">{formatPrice(product.price)}</span>

                    {/* Stock */}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusChip label={status.label} tone={status.tone} />
                        <span className="inline-flex h-6 items-center rounded-full border border-[#eadfd5] bg-[#fbf7f2] px-2.5 text-xs font-semibold text-[#6b5a4e]">
                          {product.stock ?? 0} units
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setModalProduct(product)}
                        className="rounded-lg border border-transparent p-2 text-[#8c7b6f] transition-colors hover:border-[#eadfd5] hover:bg-white hover:text-[#1a1008]"
                        aria-label="Edit"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteTarget(product)}
                        className="rounded-lg border border-transparent p-2 text-[#8c7b6f] transition-colors hover:border-red-100 hover:bg-red-50 hover:text-red-500"
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

        {activeTab === "orders" && (
          <FadeSection>
            <CoopPageHeader eyebrow="Fulfillment" title="Incoming orders" />

            {loadingOrders ? (
              <LoadingRows />
            ) : orders.length === 0 ? (
              <DashboardEmptyState
                title="No incoming orders yet"
                description="Orders from tourists will appear here with customer details, item counts, totals, and fulfillment actions."
                action={<button onClick={() => setActiveTab("products")} className={secondaryButtonClass} type="button">Review products</button>}
              />
            ) : (
              <div className="pb-12">
                <OrdersTable orders={orders} updatingOrderId={updatingOrderId} onUpdate={handleOrderStatus} />
              </div>
            )}
          </FadeSection>
        )}

        {activeTab === "reviews" && (
          <FadeSection>
            <CoopPageHeader eyebrow="Reputation" title="Customer reviews" />
            {loadingReviews ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className={`${panelClass} h-24 animate-pulse bg-[#f6f0eb]`} />
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div className={`${panelClass} px-6 py-12 text-center`}>
                <svg className="mx-auto mb-4 h-12 w-12 opacity-25" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                  <path d="M24 4L44 24L24 44L4 24Z" fill="#1A1209" />
                  <path d="M24 12L36 24L24 36L12 24Z" fill="#C8922A" />
                </svg>
                <h3 className="font-display text-lg text-[#1A1209]">No reviews yet</h3>
                <p className="mx-auto mt-1.5 max-w-[280px] text-[13px] text-[#9E8F7A]">
                  Share your storefront with customers to start collecting reviews and build trust with new buyers.
                </p>
                <button type="button" onClick={copyStorefrontLink} className={`${outlineButtonClass} mt-5`}>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor" aria-hidden="true">
                    <path d="M9 1l3 3-7 7-3-1 1-3 6-6zm0 2L4 8" />
                  </svg>
                  Copy storefront link
                </button>
              </div>
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
                    <div className="min-w-35 space-y-1">
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

        {activeTab === "settings" && (
          <FadeSection>
            <CoopPageHeader eyebrow="Configuration" title="Settings" />

            <div className="space-y-5 pb-12">
                <form onSubmit={coopForm.handleSubmit(onCoopSettingsSubmit)} className={panelClass}>
                  <div className="border-b border-[#EDE8DF] px-5 py-4">
                    <h2 className="font-display text-[15px] font-medium text-[#1A1209]">Storefront profile</h2>
                    <p className="mt-0.5 text-xs text-[#9E8F7A]">How your cooperative appears to shoppers and tourists.</p>
                  </div>
                  <div className="space-y-4 p-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Cooperative name" error={coopForm.formState.errors.cooperativeName?.message}>
                        <input {...coopForm.register("cooperativeName")} className={inputClass} placeholder="e.g. Coopérative Tiziri" />
                      </Field>

                      <Field label="City" error={coopForm.formState.errors.cooperativeCity?.message}>
                        <input {...coopForm.register("cooperativeCity")} className={inputClass} placeholder="e.g. Taroudannt" />
                      </Field>
                    </div>

                    <Field label="Description" hint="Tell shoppers what makes your cooperative special — your craft, your region, your story.">
                      <textarea {...coopForm.register("description")} rows={4} className={textareaClass} placeholder="Tell visitors about your cooperative…" />
                    </Field>

                    <Field label="Impact statement" hint="How does your work support your community and artisans?">
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

                  <div className="flex justify-end border-t border-[#EDE8DF] px-5 py-3.5">
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

                <form onSubmit={accountForm.handleSubmit(onAccountSubmit)} className={panelClass}>
                  <div className="border-b border-[#EDE8DF] px-5 py-4">
                    <h2 className="font-display text-[15px] font-medium text-[#1A1209]">Account & security</h2>
                    <p className="mt-0.5 text-xs text-[#9E8F7A]">Keep your login details current and secure.</p>
                  </div>
                  <div className="space-y-4 p-5">
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

                  <div className="flex justify-end border-t border-[#EDE8DF] px-5 py-3.5">
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
          </FadeSection>
        )}
          </main>
        </div>
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

      <footer className="border-t border-[#EDE8DF] bg-[#F5EFE4] px-4 py-5 text-center text-xs text-[#9E8F7A]">
        © {new Date().getFullYear()} The Souk · Cooperative workspace
      </footer>
    </DashboardShell>
  );
}
