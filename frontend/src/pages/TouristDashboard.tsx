import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import type { Product } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { productService } from "@/services/productService";
import api from "@/services/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FadeSection from "@/components/FadeSection";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// ─── Price helper — handles both `number` and `{ amount, currency }` shapes ──
function formatPrice(price: unknown): string {
  if (typeof price === "number") return `MAD ${price.toFixed(2)}`;
  if (price && typeof price === "object" && "amount" in price) {
    const p = price as { amount: number; currency: string };
    return `${p.currency} ${p.amount.toFixed(2)}`;
  }
  return String(price ?? "");
}

// ─── Types ────────────────────────────────────────────────────────────────────
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

// ─── Zod schema for account settings ─────────────────────────────────────────
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

// ─── Wishlist Product Card ────────────────────────────────────────────────────
function WishlistCard({ product, onRemove }: { product: Product; onRemove: (id: string) => void }) {
  return (
    <div className="group bg-white rounded-[20px] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_32px_rgba(231,111,81,0.12)] transition-all duration-300">
      <Link to={`/marketplace/${product._id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-[#faf6f2]">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="opacity-20">
                <rect x="3" y="3" width="18" height="18" rx="3" stroke="#6b5a4e" strokeWidth="1.5" />
                <circle cx="8.5" cy="8.5" r="1.5" fill="#6b5a4e" />
                <path d="M21 15l-5-5L5 21" stroke="#6b5a4e" strokeWidth="1.5" />
              </svg>
            </div>
          )}
        </div>
      </Link>
      <div className="p-4">
        <p className="text-xs text-[#9a8a7a] uppercase tracking-widest mb-1">{product.category}</p>
        <Link to={`/marketplace/${product._id}`}>
          <h3 className="font-['Playfair_Display'] font-bold text-[#1a1008] text-sm leading-snug mb-2 hover:text-[#E76F51] transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center justify-between">
          <span className="text-[#E76F51] font-bold">
            {formatPrice(product.price)}
          </span>
          <button
            onClick={() => onRemove(product._id)}
            className="text-[#9a8a7a] hover:text-red-400 transition-colors"
            aria-label="Remove from wishlist"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Review Card ──────────────────────────────────────────────────────────────
function MyReviewCard({ review }: { review: Review }) {
  return (
    <div className="bg-white rounded-[20px] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.06)] flex gap-4">
      <Link to={`/marketplace/${review.product._id}`} className="shrink-0">
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#faf6f2]">
          {review.product.images?.[0] ? (
            <img src={review.product.images[0]} alt={review.product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="opacity-20">
                <rect x="3" y="3" width="18" height="18" rx="3" stroke="#6b5a4e" strokeWidth="1.5" />
              </svg>
            </div>
          )}
        </div>
      </Link>
      <div className="flex-1 min-w-0">
        <Link to={`/marketplace/${review.product._id}`}>
          <h4 className="font-semibold text-[#1a1008] text-sm hover:text-[#E76F51] transition-colors truncate">
            {review.product.name}
          </h4>
        </Link>
        <div className="flex items-center gap-2 mt-1 mb-2">
          <StarRating rating={review.rating} size={12} />
          <span className="text-xs text-[#9a8a7a]">
            {new Date(review.createdAt).toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" })}
          </span>
        </div>
        <p className="text-[#6b5a4e] text-sm line-clamp-2">{review.comment}</p>
      </div>
    </div>
  );
}

// ─── Input Field ──────────────────────────────────────────────────────────────
function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-[#1a1008] mb-1.5">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

const inputClass =
  "w-full px-4 py-3 rounded-xl border border-[#f0e8e0] bg-white text-[#1a1008] text-sm placeholder:text-[#c4b8ae] focus:outline-none focus:ring-2 focus:ring-[#E76F51]/30 focus:border-[#E76F51] transition-all";

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TouristDashboard() {
  const { user, refreshAuth } = useAuth();
  const [activeTab, setActiveTab] = useState<"wishlist" | "reviews" | "settings">("wishlist");

  // Wishlist
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [loadingWishlist, setLoadingWishlist] = useState(true);

  // Reviews
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  // Settings form
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

  // Sync form when user loads
  useEffect(() => {
    if (user) {
      reset({ name: user.name, email: user.email, country: user.country ?? "" });
    }
  }, [user, reset]);

  // Fetch wishlist
  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        setLoadingWishlist(true);
        // The backend exposes wishlist product IDs on the user object,
        // so we fetch each. If your backend has a dedicated endpoint, swap this out.
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
      } catch {
        // silent
      } finally {
        setLoadingWishlist(false);
      }
    }
    load();
  }, [user]);

  // Fetch my reviews
  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        setLoadingReviews(true);
        const { data } = await api.get<Review[]>("/users/me/reviews");
        setMyReviews(data ?? []);
      } catch {
        // silent
      } finally {
        setLoadingReviews(false);
      }
    }
    load();
  }, [user]);

  async function handleRemoveFromWishlist(productId: string) {
    setWishlist((prev) => prev.filter((p) => p._id !== productId)); // optimistic
    try {
      await api.delete(`/users/wishlist/${productId}`);
      toast.success("Removed from wishlist");
    } catch {
      toast.error("Could not remove from wishlist");
      await refreshAuth(); // rollback — re-sync user + wishlist from server
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

  const tabs = [
    {
      id: "wishlist" as const,
      label: "Wishlist",
      count: wishlist.length,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
    },
    {
      id: "reviews" as const,
      label: "My Reviews",
      count: myReviews.length,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
    },
    {
      id: "settings" as const,
      label: "Settings",
      count: null,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" stroke="currentColor" strokeWidth="2"/>
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#FFFCF8]">
      <Navbar />

      {/* Header */}
      <div className="bg-linear-to-br from-[#E76F51]/8 via-[#FFFCF8] to-[#2A9D8F]/5 border-b border-[#f0e8e0]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-linear-to-br from-[#E76F51] to-[#E9C46A] flex items-center justify-center text-white font-['Playfair_Display'] font-bold text-2xl shrink-0">
              {user?.name?.charAt(0).toUpperCase() ?? "?"}
            </div>
            <div>
              <h1 className="font-['Playfair_Display'] font-bold text-2xl md:text-3xl text-[#1a1008]">
                {user?.name ?? "Traveller"}
              </h1>
              <p className="text-[#9a8a7a] text-sm mt-0.5">
                {user?.country ? `📍 ${user.country}` : "Tourist account"}
              </p>
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
                    ? "border-[#E76F51] text-[#E76F51]"
                    : "border-transparent text-[#9a8a7a] hover:text-[#6b5a4e]"
                }`}
              >
                {tab.icon}
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

        {/* ── Wishlist Tab ─────────────────────────────────────────────────── */}
        {activeTab === "wishlist" && (
          <FadeSection>
            {loadingWishlist ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-[20px] overflow-hidden animate-pulse">
                    <div className="aspect-square bg-[#f0e8e0]" />
                    <div className="p-4 space-y-2">
                      <div className="h-3 bg-[#f0e8e0] rounded w-1/2" />
                      <div className="h-4 bg-[#f0e8e0] rounded w-3/4" />
                      <div className="h-4 bg-[#f0e8e0] rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : wishlist.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#f0e8e0] flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-[#E76F51]">
                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="font-['Playfair_Display'] font-bold text-xl text-[#1a1008] mb-2">
                  Your wishlist is empty
                </h3>
                <p className="text-[#9a8a7a] mb-6">Save products you love to find them later.</p>
                <Link
                  to="/marketplace"
                  className="inline-block bg-[#E76F51] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#d46043] transition-colors"
                >
                  Explore the Marketplace
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 pb-12">
                {wishlist.map((product) => (
                  <WishlistCard key={product._id} product={product} onRemove={handleRemoveFromWishlist} />
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
                  <div key={i} className="bg-white rounded-[20px] p-5 animate-pulse flex gap-4">
                    <div className="w-16 h-16 rounded-xl bg-[#f0e8e0] shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-[#f0e8e0] rounded w-1/3" />
                      <div className="h-3 bg-[#f0e8e0] rounded w-1/4" />
                      <div className="h-3 bg-[#f0e8e0] rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : myReviews.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#f0e8e0] flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 20 20" fill="none" className="text-[#E76F51]">
                    <polygon points="10,2 12.4,7.8 18.5,8.2 14,12.2 15.6,18.1 10,15 4.4,18.1 6,12.2 1.5,8.2 7.6,7.8" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="font-['Playfair_Display'] font-bold text-xl text-[#1a1008] mb-2">
                  No reviews yet
                </h3>
                <p className="text-[#9a8a7a] mb-6">Share your experience with the products you've discovered.</p>
                <Link
                  to="/marketplace"
                  className="inline-block bg-[#E76F51] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#d46043] transition-colors"
                >
                  Browse Products
                </Link>
              </div>
            ) : (
              <div className="space-y-4 pb-12">
                {myReviews.map((review) => (
                  <MyReviewCard key={review._id} review={review} />
                ))}
              </div>
            )}
          </FadeSection>
        )}

        {/* ── Settings Tab ─────────────────────────────────────────────────── */}
        {activeTab === "settings" && (
          <FadeSection>
            <div className="max-w-xl pb-12">
              <h2 className="font-['Playfair_Display'] font-bold text-2xl text-[#1a1008] mb-6">
                Account Settings
              </h2>

              <form onSubmit={handleSubmit(onSettingsSubmit)} className="space-y-5">
                {/* Profile section */}
                <div className="bg-white rounded-[20px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] space-y-4">
                  <h3 className="font-semibold text-[#1a1008] text-base mb-1">Profile</h3>

                  <Field label="Full name" error={errors.name?.message}>
                    <input
                      {...register("name")}
                      className={inputClass}
                      placeholder="Your name"
                    />
                  </Field>

                  <Field label="Email address" error={errors.email?.message}>
                    <input
                      {...register("email")}
                      type="email"
                      className={inputClass}
                      placeholder="you@example.com"
                    />
                  </Field>

                  <Field label="Country" error={errors.country?.message}>
                    <input
                      {...register("country")}
                      className={inputClass}
                      placeholder="Where are you from?"
                    />
                  </Field>
                </div>

                {/* Password section */}
                <div className="bg-white rounded-[20px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] space-y-4">
                  <h3 className="font-semibold text-[#1a1008] text-base mb-1">Change Password</h3>
                  <p className="text-xs text-[#9a8a7a] -mt-2">Leave blank to keep your current password.</p>

                  <Field label="Current password" error={errors.currentPassword?.message}>
                    <input
                      {...register("currentPassword")}
                      type="password"
                      className={inputClass}
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                  </Field>

                  <Field label="New password" error={errors.newPassword?.message}>
                    <input
                      {...register("newPassword")}
                      type="password"
                      className={inputClass}
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                  </Field>

                  <Field label="Confirm new password" error={errors.confirmPassword?.message}>
                    <input
                      {...register("confirmPassword")}
                      type="password"
                      className={inputClass}
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                  </Field>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#E76F51] text-white py-3.5 rounded-full font-semibold text-sm hover:bg-[#d46043] transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(231,111,81,0.3)]"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Saving…
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </form>
            </div>
          </FadeSection>
        )}
      </div>

      <Footer />
    </div>
  );
}