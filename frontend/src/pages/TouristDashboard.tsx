import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import type { Order, Product } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { productService } from "@/services/productService";
import { orderService } from "@/services/orderService";
import api from "@/services/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FadeSection from "@/components/FadeSection";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

function formatPrice(price: unknown): string {
  if (typeof price === "number") {
    return `MAD ${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (price && typeof price === "object" && "amount" in price) {
    const p = price as { amount: number; currency: string };
    return `${p.currency} ${p.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return String(price ?? "");
}

function formatCategory(category?: string): string {
  if (!category) return "Product";
  return category.charAt(0).toUpperCase() + category.slice(1);
}

interface Review {
  _id: string;
  product: {
    _id: string;
    name: string;
    images?: string[];
    price: number;
    category: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
}

const settingsSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  country: z.string().optional(),
  currentPassword: z.string().optional(),
  newPassword: z
    .string()
    .optional()
    .refine((v) => !v || v.length >= 8, { message: "Password must be at least 8 characters" }),
  confirmPassword: z.string().optional(),
}).refine(
  (d) => !d.newPassword || d.newPassword === d.confirmPassword,
  { message: "Passwords don't match", path: ["confirmPassword"] }
);

type SettingsForm = z.infer<typeof settingsSchema>;

const panelClass = "rounded-xl border border-[#eadfd5] bg-white shadow-[0_1px_2px_rgba(26,16,8,0.04)]";
const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-[#1a1008] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#332216] disabled:opacity-60";
const secondaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-[#e8ddd3] bg-white px-4 py-2.5 text-sm font-semibold text-[#5f5046] transition-colors hover:bg-[#faf6f2]";
const inputClass =
  "w-full rounded-lg border border-[#e8ddd3] bg-white px-3.5 py-2.5 text-sm text-[#1a1008] placeholder:text-[#b7a99d] transition-all focus:border-[#2A9D8F] focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/20";

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
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

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-[#1a1008]">{label}</label>
      {hint && <p className="mb-1.5 text-xs text-[#9a8a7a]">{hint}</p>}
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
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
    <div className={`${panelClass} flex min-h-62.5 flex-col items-center justify-center px-6 py-10 text-center`}>
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-[#eadfd5] bg-[#faf6f2] text-[#7b6a5e]">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 7h16M6 7v12h12V7M9 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h3 className="text-base font-bold text-[#1a1008]">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-[#7b6a5e]">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function LoadingCards({ variant }: { variant: "grid" | "list" }) {
  if (variant === "list") {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={`${panelClass} flex gap-4 p-4`}>
            <div className="h-16 w-16 shrink-0 animate-pulse rounded-lg bg-[#f2ebe4]" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 animate-pulse rounded bg-[#f2ebe4]" />
              <div className="h-3 w-1/4 animate-pulse rounded bg-[#f6f0eb]" />
              <div className="h-3 w-full animate-pulse rounded bg-[#f6f0eb]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={`${panelClass} overflow-hidden`}>
          <div className="aspect-[4/3] animate-pulse bg-[#f2ebe4]" />
          <div className="space-y-2 p-4">
            <div className="h-3 w-1/2 animate-pulse rounded bg-[#f2ebe4]" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-[#f2ebe4]" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-[#f6f0eb]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function WishlistCard({ product, onRemove }: { product: Product; onRemove: (id: string) => void }) {
  return (
    <article className={`${panelClass} group overflow-hidden transition-colors hover:border-[#e1d5ca]`}>
      <Link to={`/products/${product._id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-[#faf6f2]">
          {product.images?.[0] ? (
            <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[#b7a99d]">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
                <path d="M7 16l3-3 2 2 4-5 2 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
        </div>
      </Link>
      <div className="p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="truncate text-xs font-bold uppercase tracking-[0.08em] text-[#8c7b6f]">{formatCategory(product.category)}</p>
          {(product.fairTradeCertified || product.isFairTrade) && <StatusChip label="Fair trade" tone="success" />}
        </div>
        <Link to={`/products/${product._id}`}>
          <h3 className="line-clamp-2 text-sm font-bold leading-snug text-[#1a1008] transition-colors hover:text-[#E76F51]">
            {product.name}
          </h3>
        </Link>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-sm font-bold text-[#1a1008]">{formatPrice(product.price)}</span>
          <button
            onClick={() => onRemove(product._id)}
            className="rounded-lg p-2 text-[#8c7b6f] transition-colors hover:bg-red-50 hover:text-red-500"
            aria-label="Remove from wishlist"
            type="button"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
    </article>
  );
}

function MyReviewCard({ review }: { review: Review }) {
  return (
    <article className={`${panelClass} flex gap-4 p-4`}>
      <Link to={`/products/${review.product._id}`} className="shrink-0">
        <div className="h-16 w-16 overflow-hidden rounded-lg border border-[#f0e8e0] bg-[#faf6f2]">
          {review.product.images?.[0] ? (
            <img src={review.product.images[0]} alt={review.product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[#b7a99d]">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
          )}
        </div>
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <Link to={`/products/${review.product._id}`}>
              <h4 className="truncate text-sm font-semibold text-[#1a1008] transition-colors hover:text-[#E76F51]">{review.product.name}</h4>
            </Link>
            <p className="mt-1 text-xs font-medium text-[#8c7b6f]">{formatCategory(review.product.category)}</p>
          </div>
          <div className="shrink-0 sm:text-right">
            <StarRating rating={review.rating} size={12} />
            <p className="mt-1 text-xs text-[#9a8a7a]">
              {new Date(review.createdAt).toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" })}
            </p>
          </div>
        </div>
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#6b5a4e]">{review.comment}</p>
      </div>
    </article>
  );
}

function getOrderTone(status: Order["status"]): "success" | "warning" | "danger" | "neutral" {
  if (status === "delivered") return "success";
  if (status === "cancelled") return "danger";
  if (status === "confirmed") return "neutral";
  return "warning";
}

function OrderCard({ order }: { order: Order }) {
  const firstItem = order.items[0];
  const firstProduct = typeof firstItem?.product === "object" ? firstItem.product : null;
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const coopName = typeof order.cooperative === "object" ? order.cooperative.name : "Cooperative";

  return (
    <article className={`${panelClass} p-4`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#f0e8e0] bg-[#faf6f2] text-[#b7a99d]">
            {firstProduct?.images?.[0] ? (
              <img src={firstProduct.images[0]} alt={firstProduct.name} className="h-full w-full object-cover" />
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 7h12l-1 13H7L6 7zM9 7a3 3 0 016 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-[#1a1008]">Order #{order._id.slice(-6).toUpperCase()}</h3>
              <StatusChip label={order.status.charAt(0).toUpperCase() + order.status.slice(1)} tone={getOrderTone(order.status)} />
            </div>
            <p className="mt-1 truncate text-sm text-[#6b5a4e]">
              {firstProduct?.name ?? "Marketplace order"} {itemCount > 1 ? `and ${itemCount - 1} more item${itemCount - 1 === 1 ? "" : "s"}` : ""}
            </p>
            <p className="mt-1 text-xs text-[#8c7b6f]">
              {coopName} · {new Date(order.createdAt).toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" })}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm sm:min-w-[240px]">
          <div className="rounded-lg bg-[#fbf7f2] px-3 py-2">
            <p className="text-xs text-[#8c7b6f]">Items</p>
            <p className="font-semibold text-[#1a1008]">{itemCount}</p>
          </div>
          <div className="rounded-lg bg-[#fbf7f2] px-3 py-2">
            <p className="text-xs text-[#8c7b6f]">Total</p>
            <p className="font-semibold text-[#1a1008]">{formatPrice(order.total)}</p>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function TouristDashboard() {
  const { user, refreshAuth } = useAuth();
  const [activeTab, setActiveTab] = useState<"wishlist" | "orders" | "reviews" | "settings">("wishlist");

  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [loadingWishlist, setLoadingWishlist] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      country: user?.country ?? "",
    },
  });

  useEffect(() => {
    if (user) {
      reset({ name: user.name, email: user.email, country: user.country ?? "" });
    }
  }, [user, reset]);

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        setLoadingWishlist(true);
        const ids: string[] = user?.wishlist ?? [];
        if (ids.length === 0) {
          setWishlist([]);
          return;
        }
        const results = await Promise.allSettled(ids.map((id) => productService.getById(id)));
        const products = results
          .filter((r): r is PromiseFulfilledResult<Product> => r.status === "fulfilled")
          .map((r) => r.value);
        setWishlist(products);
      } finally {
        setLoadingWishlist(false);
      }
    }
    load();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        setLoadingOrders(true);
        const data = await orderService.getMyOrders();
        setOrders(data ?? []);
      } catch {
        setOrders([]);
      } finally {
        setLoadingOrders(false);
      }
    }
    load();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        setLoadingReviews(true);
        const { data } = await api.get<Review[]>("/users/me/reviews");
        setMyReviews(data ?? []);
      } catch {
        setMyReviews([]);
      } finally {
        setLoadingReviews(false);
      }
    }
    load();
  }, [user]);

  async function handleRemoveFromWishlist(productId: string) {
    setWishlist((prev) => prev.filter((p) => p._id !== productId));
    try {
      await api.delete(`/users/wishlist/${productId}`);
      toast.success("Removed from wishlist");
    } catch {
      toast.error("Could not remove from wishlist");
      await refreshAuth();
    }
  }

  async function onSettingsSubmit(data: SettingsForm) {
    try {
      await api.patch("/auth/me", {
        name: data.name,
        email: data.email,
        country: data.country,
        ...(data.currentPassword && data.newPassword
          ? { currentPassword: data.currentPassword, newPassword: data.newPassword }
          : {}),
      });
      await refreshAuth();
      toast.success("Profile updated!");
    } catch {
      toast.error("Could not update profile");
    }
  }

  const deliveredOrders = orders.filter((order) => order.status === "delivered").length;
  const pendingOrders = orders.filter((order) => order.status === "pending" || order.status === "confirmed").length;
  const latestOrderDate = orders[0]?.createdAt
    ? new Date(orders[0].createdAt).toLocaleDateString("en-GB", { month: "short", day: "numeric" })
    : "New";

  const tabs = [
    { id: "wishlist" as const, label: "Wishlist", description: "Saved products", count: wishlist.length },
    { id: "orders" as const, label: "Orders", description: "Purchases and status", count: orders.length },
    { id: "reviews" as const, label: "Reviews", description: "Your feedback", count: myReviews.length },
    { id: "settings" as const, label: "Settings", description: "Profile and security", count: null },
  ];

  return (
    <div className="min-h-screen bg-[#FFFCF8]" style={{ paddingTop: 68 }}>
      <Navbar />

      <div className="border-b border-[#eadfd5] bg-[#fbf7f2]">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#1a1008] text-lg font-bold text-white">
                {user?.name?.charAt(0).toUpperCase() ?? "T"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8c7b6f]">Tourist dashboard</p>
                <h1 className="mt-1 truncate text-2xl font-bold text-[#1a1008] md:text-3xl">{user?.name ?? "Traveller"}</h1>
                <p className="mt-1 text-sm leading-6 text-[#7b6a5e]">
                  {user?.country ? `${user.country} · Personal shopping account` : "Personal shopping account"}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link to="/marketplace" className={primaryButtonClass}>Explore marketplace</Link>
                  <button type="button" onClick={() => setActiveTab("settings")} className={secondaryButtonClass}>Edit profile</button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[520px]">
              {[
                { label: "Saved", value: wishlist.length },
                { label: "Orders", value: orders.length },
                { label: "In progress", value: pendingOrders },
                { label: deliveredOrders > 0 ? "Delivered" : "Latest order", value: deliveredOrders > 0 ? deliveredOrders : latestOrderDate },
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
        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start">
          <aside className="sticky top-[88px] hidden lg:block">
            <div className={`${panelClass} overflow-hidden p-1`}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-3 text-left transition-colors ${
                    activeTab === tab.id
                      ? "bg-[#1a1008] text-white"
                      : "text-[#7b6a5e] hover:bg-[#faf6f2] hover:text-[#1a1008]"
                  }`}
                  type="button"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{tab.label}</span>
                    <span className={`block truncate text-xs ${activeTab === tab.id ? "text-white/70" : "text-[#9a8a7a]"}`}>{tab.description}</span>
                  </span>
                  {tab.count !== null && tab.count > 0 && (
                    <span className={`rounded-full px-2 py-0.5 text-xs ${activeTab === tab.id ? "bg-white/15 text-white" : "bg-[#f0e8e0] text-[#6b5a4e]"}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </aside>

          <div className="min-w-0 lg:col-start-2">
            <div className="sticky top-[68px] z-20 mb-6 overflow-x-auto rounded-xl border border-[#eadfd5] bg-[#FFFCF8]/95 p-1 backdrop-blur lg:hidden">
              <div className="grid min-w-[620px] grid-cols-4 gap-1 sm:min-w-0">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex min-h-12 items-center justify-between gap-3 rounded-lg px-3 text-left transition-colors sm:px-4 ${
                      activeTab === tab.id
                        ? "bg-[#1a1008] text-white"
                        : "text-[#7b6a5e] hover:bg-[#faf6f2] hover:text-[#1a1008]"
                    }`}
                    type="button"
                  >
                    <span>
                      <span className="block text-sm font-semibold">{tab.label}</span>
                      <span className={`hidden text-xs md:block ${activeTab === tab.id ? "text-white/70" : "text-[#9a8a7a]"}`}>{tab.description}</span>
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

        {activeTab === "wishlist" && (
          <FadeSection>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8c7b6f]">Saved products</p>
                <h2 className="mt-1 text-xl font-bold text-[#1a1008]">Wishlist</h2>
                <p className="mt-1 text-sm text-[#7b6a5e]">Keep track of products you may want to buy later.</p>
              </div>
              <Link to="/marketplace" className={secondaryButtonClass}>Browse products</Link>
            </div>

            {loadingWishlist ? (
              <LoadingCards variant="grid" />
            ) : wishlist.length === 0 ? (
              <EmptyState
                title="Your wishlist is empty"
                description="Save products from the marketplace to compare them later and return when you are ready to order."
                action={<Link to="/marketplace" className={primaryButtonClass}>Explore marketplace</Link>}
              />
            ) : (
              <div className="grid gap-4 pb-12 sm:grid-cols-2 lg:grid-cols-3">
                {wishlist.map((product) => (
                  <WishlistCard key={product._id} product={product} onRemove={handleRemoveFromWishlist} />
                ))}
              </div>
            )}
          </FadeSection>
        )}

        {activeTab === "orders" && (
          <FadeSection>
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8c7b6f]">Purchases</p>
              <h2 className="mt-1 text-xl font-bold text-[#1a1008]">Orders</h2>
              <p className="mt-1 text-sm text-[#7b6a5e]">Review recent purchases, delivery status, and order totals.</p>
            </div>

            {loadingOrders ? (
              <LoadingCards variant="list" />
            ) : orders.length === 0 ? (
              <EmptyState
                title="No orders yet"
                description="When you place an order, status updates and purchase details will appear here."
                action={<Link to="/marketplace" className={primaryButtonClass}>Start shopping</Link>}
              />
            ) : (
              <div className="space-y-3 pb-12">
                {orders.map((order) => (
                  <OrderCard key={order._id} order={order} />
                ))}
              </div>
            )}
          </FadeSection>
        )}

        {activeTab === "reviews" && (
          <FadeSection>
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8c7b6f]">Feedback</p>
              <h2 className="mt-1 text-xl font-bold text-[#1a1008]">Your reviews</h2>
              <p className="mt-1 text-sm text-[#7b6a5e]">A record of the experiences you have shared with cooperatives.</p>
            </div>

            {loadingReviews ? (
              <LoadingCards variant="list" />
            ) : myReviews.length === 0 ? (
              <EmptyState
                title="No reviews yet"
                description="After you discover a product, share a review to help other travellers buy with confidence."
                action={<Link to="/marketplace" className={primaryButtonClass}>Browse products</Link>}
              />
            ) : (
              <div className="space-y-3 pb-12">
                {myReviews.map((review) => (
                  <MyReviewCard key={review._id} review={review} />
                ))}
              </div>
            )}
          </FadeSection>
        )}

        {activeTab === "settings" && (
          <FadeSection>
            <div className="grid gap-6 pb-12 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
              <div>
                <div className="mb-4">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8c7b6f]">Profile</p>
                  <h2 className="mt-1 text-xl font-bold text-[#1a1008]">Personal details</h2>
                  <p className="mt-1 text-sm text-[#7b6a5e]">Keep your account information accurate for checkout and support.</p>
                </div>
                <form onSubmit={handleSubmit(onSettingsSubmit)} className={`${panelClass} overflow-hidden`}>
                  <div className="space-y-4 p-5 sm:p-6">
                    <Field label="Full name" error={errors.name?.message}>
                      <input {...register("name")} className={inputClass} placeholder="Your name" />
                    </Field>
                    <Field label="Email address" error={errors.email?.message}>
                      <input {...register("email")} type="email" className={inputClass} placeholder="you@example.com" />
                    </Field>
                    <Field label="Country" error={errors.country?.message}>
                      <input {...register("country")} className={inputClass} placeholder="Where are you from?" />
                    </Field>
                  </div>
                  <div className="flex justify-end border-t border-[#eadfd5] bg-[#fbf7f2] px-5 py-3 sm:px-6">
                    <button type="submit" disabled={isSubmitting} className={primaryButtonClass}>
                      {isSubmitting ? (
                        <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Saving...</>
                      ) : "Save profile"}
                    </button>
                  </div>
                </form>
              </div>

              <div>
                <div className="mb-4">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8c7b6f]">Security</p>
                  <h2 className="mt-1 text-xl font-bold text-[#1a1008]">Password</h2>
                  <p className="mt-1 text-sm text-[#7b6a5e]">Leave password fields blank to keep your current password.</p>
                </div>
                <form onSubmit={handleSubmit(onSettingsSubmit)} className={`${panelClass} overflow-hidden`}>
                  <div className="space-y-4 p-5 sm:p-6">
                    <Field label="Current password" error={errors.currentPassword?.message}>
                      <input {...register("currentPassword")} type="password" className={inputClass} placeholder="••••••••" autoComplete="current-password" />
                    </Field>
                    <Field label="New password" error={errors.newPassword?.message}>
                      <input {...register("newPassword")} type="password" className={inputClass} placeholder="••••••••" autoComplete="new-password" />
                    </Field>
                    <Field label="Confirm new password" error={errors.confirmPassword?.message}>
                      <input {...register("confirmPassword")} type="password" className={inputClass} placeholder="••••••••" autoComplete="new-password" />
                    </Field>
                  </div>
                  <div className="flex justify-end border-t border-[#eadfd5] bg-[#fbf7f2] px-5 py-3 sm:px-6">
                    <button type="submit" disabled={isSubmitting} className={primaryButtonClass}>
                      {isSubmitting ? (
                        <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Saving...</>
                      ) : "Update password"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </FadeSection>
        )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
