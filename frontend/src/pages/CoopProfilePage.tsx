import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import type { Cooperative, Product } from "@/types";
import { coopService } from "@/services/coopService";
import { productService } from "@/services/productService";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FadeSection from "@/components/FadeSection";
import toast from "react-hot-toast";

// ─── Star Rating ──────────────────────────────────────────────────────────────
function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
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

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      to={`/marketplace/${product._id}`}
      className="group block bg-white rounded-[20px] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_40px_rgba(231,111,81,0.15)] transition-all duration-300 hover:-translate-y-1"
    >
      <div className="relative aspect-square overflow-hidden bg-[#faf6f2]">
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="opacity-20">
              <rect x="3" y="3" width="18" height="18" rx="3" stroke="#6b5a4e" strokeWidth="1.5" />
              <circle cx="8.5" cy="8.5" r="1.5" fill="#6b5a4e" />
              <path d="M21 15l-5-5L5 21" stroke="#6b5a4e" strokeWidth="1.5" />
            </svg>
          </div>
        )}
        {product.isFairTrade && (
          <div className="absolute top-3 left-3 bg-[#2A9D8F] text-white text-[10px] font-bold px-2 py-1 rounded-full tracking-wide uppercase">
            Fair Trade
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="text-xs text-[#9a8a7a] uppercase tracking-widest mb-1">{product.category}</p>
        <h3 className="font-['Playfair_Display'] font-bold text-[#1a1008] text-base leading-snug mb-2 group-hover:text-[#E76F51] transition-colors line-clamp-2">
          {product.name}
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-[#E76F51] font-bold text-lg">
            {product.price.currency} {product.price.amount.toFixed(2)}
          </span>
          {product.rating && (
            <div className="flex items-center gap-1">
              <StarRating rating={product.rating} size={12} />
              <span className="text-xs text-[#9a8a7a]">({product.reviewCount ?? 0})</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Review Card ──────────────────────────────────────────────────────────────
function ReviewCard({
  author,
  rating,
  comment,
  date,
}: {
  author: string;
  rating: number;
  comment: string;
  date: string;
}) {
  return (
    <div className="bg-white rounded-[20px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E76F51] to-[#E9C46A] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {author.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-[#1a1008] text-sm">{author}</p>
            <p className="text-xs text-[#9a8a7a]">{new Date(date).toLocaleDateString("en-GB", { year: "numeric", month: "long" })}</p>
          </div>
        </div>
        <StarRating rating={rating} size={14} />
      </div>
      <p className="text-[#6b5a4e] text-sm leading-relaxed">{comment}</p>
    </div>
  );
}

// ─── Stat Pill ────────────────────────────────────────────────────────────────
function StatPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-3 bg-white/70 backdrop-blur-sm rounded-2xl px-5 py-3 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <div className="text-[#E76F51]">{icon}</div>
      <div>
        <p className="text-lg font-['Playfair_Display'] font-bold text-[#1a1008] leading-none">{value}</p>
        <p className="text-xs text-[#9a8a7a] mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CoopProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [coop, setCoop] = useState<Cooperative | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingCoop, setLoadingCoop] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"products" | "about" | "reviews">("products");
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);

  // Fetch cooperative
  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    async function load() {
      try {
        setLoadingCoop(true);
        setError(null);
        const data = await coopService.getById(id!);
        setCoop(data);
        if (user && data.followers?.includes(user._id)) {
          setIsFollowing(true);
        }
      } catch {
        setError("Could not load cooperative profile.");
      } finally {
        setLoadingCoop(false);
      }
    }
    load();
    return () => controller.abort();
  }, [id, user]);

  // Fetch products
  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        setLoadingProducts(true);
        const res = await productService.getAll({ cooperative: id, limit: 12 });
        setProducts(res.data);
      } catch {
        // silently fail — products section will show empty state
      } finally {
        setLoadingProducts(false);
      }
    }
    load();
  }, [id]);

  const handleFollow = useCallback(async () => {
    if (!user) {
      toast.error("Please sign in to follow cooperatives");
      return;
    }
    if (!id) return;
    try {
      setFollowLoading(true);
      await coopService.follow(id);
      setIsFollowing((prev) => !prev);
      setCoop((prev) =>
        prev
          ? {
              ...prev,
              followersCount: isFollowing
                ? (prev.followersCount ?? 1) - 1
                : (prev.followersCount ?? 0) + 1,
            }
          : prev
      );
      toast.success(isFollowing ? "Unfollowed cooperative" : "Following cooperative!");
    } catch {
      toast.error("Could not update follow status");
    } finally {
      setFollowLoading(false);
    }
  }, [id, user, isFollowing]);

  // Keyboard nav for gallery lightbox
  useEffect(() => {
    if (galleryIndex === null) return;
    const photos = coop?.photos ?? [];
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setGalleryIndex(null);
      if (e.key === "ArrowRight") setGalleryIndex((i) => (i !== null ? Math.min(i + 1, photos.length - 1) : null));
      if (e.key === "ArrowLeft") setGalleryIndex((i) => (i !== null ? Math.max(i - 1, 0) : null));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [galleryIndex, coop?.photos]);

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (loadingCoop) {
    return (
      <div className="min-h-screen bg-[#FFFCF8]">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-[#f0e8e0] border-t-[#E76F51] animate-spin" />
            <p className="text-[#9a8a7a] text-sm">Loading cooperative…</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ─── Error ─────────────────────────────────────────────────────────────────
  if (error || !coop) {
    return (
      <div className="min-h-screen bg-[#FFFCF8]">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-5xl mb-4">🏺</p>
            <h2 className="font-['Playfair_Display'] font-bold text-2xl text-[#1a1008] mb-2">
              Cooperative not found
            </h2>
            <p className="text-[#9a8a7a] mb-6">{error ?? "This cooperative doesn't exist or has been removed."}</p>
            <Link
              to="/marketplace"
              className="inline-block bg-[#E76F51] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#d46043] transition-colors"
            >
              Browse Marketplace
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const photos = coop.photos ?? [];
  const reviews = coop.reviews ?? [];
  const avgRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : null;

  return (
    <div className="min-h-screen bg-[#FFFCF8]">
      <Navbar />

      {/* ── Cover Image ──────────────────────────────────────────────────────── */}
      <div className="relative h-72 md:h-96 overflow-hidden">
        {coop.coverImage ? (
          <img
            src={coop.coverImage}
            alt={`${coop.name} cover`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#E76F51]/20 via-[#E9C46A]/10 to-[#2A9D8F]/20 flex items-center justify-center">
            {/* Decorative Amazigh-inspired pattern */}
            <svg viewBox="0 0 600 300" className="absolute inset-0 w-full h-full opacity-10" preserveAspectRatio="xMidYMid slice">
              {Array.from({ length: 8 }).map((_, i) =>
                Array.from({ length: 4 }).map((_, j) => (
                  <polygon
                    key={`${i}-${j}`}
                    points={`${i * 80},${j * 80} ${i * 80 + 40},${j * 80 - 20} ${i * 80 + 80},${j * 80} ${i * 80 + 40},${j * 80 + 20}`}
                    fill="none"
                    stroke="#E76F51"
                    strokeWidth="1"
                  />
                ))
              )}
            </svg>
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1008]/60 via-transparent to-transparent" />
      </div>

      {/* ── Profile Header ───────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="relative -mt-16 md:-mt-20 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end gap-5">
            {/* Avatar */}
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-[20px] border-4 border-white shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden bg-gradient-to-br from-[#E76F51] to-[#E9C46A] flex items-center justify-center flex-shrink-0">
              {coop.logo ? (
                <img src={coop.logo} alt={coop.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl md:text-5xl font-['Playfair_Display'] font-bold text-white">
                  {coop.name.charAt(0)}
                </span>
              )}
            </div>

            {/* Name + meta */}
            <div className="flex-1 pb-1">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="font-['Playfair_Display'] font-bold text-2xl md:text-3xl text-[#1a1008] leading-tight">
                    {coop.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    {coop.city && (
                      <span className="flex items-center gap-1 text-sm text-[#9a8a7a]">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#9a8a7a"/></svg>
                        {coop.city}, Morocco
                      </span>
                    )}
                    {coop.category && (
                      <span className="bg-[#E9C46A]/20 text-[#8a6a1a] text-xs font-semibold px-3 py-1 rounded-full capitalize">
                        {coop.category}
                      </span>
                    )}
                    {coop.isCertified && (
                      <span className="bg-[#2A9D8F]/10 text-[#2A9D8F] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" stroke="#2A9D8F" strokeWidth="2"/></svg>
                        Certified
                      </span>
                    )}
                  </div>
                  {avgRating !== null && (
                    <div className="flex items-center gap-2 mt-2">
                      <StarRating rating={avgRating} size={16} />
                      <span className="text-sm font-semibold text-[#1a1008]">{avgRating.toFixed(1)}</span>
                      <span className="text-sm text-[#9a8a7a]">({reviews.length} review{reviews.length !== 1 ? "s" : ""})</span>
                    </div>
                  )}
                </div>

                {/* Follow button */}
                {user?.role === "tourist" && (
                  <button
                    onClick={handleFollow}
                    disabled={followLoading}
                    className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition-all duration-200 flex-shrink-0 ${
                      isFollowing
                        ? "bg-[#f0e8e0] text-[#6b5a4e] hover:bg-[#e8ddd5]"
                        : "bg-[#E76F51] text-white hover:bg-[#d46043] shadow-[0_4px_16px_rgba(231,111,81,0.3)]"
                    } disabled:opacity-60`}
                  >
                    {followLoading ? (
                      <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill={isFollowing ? "none" : "currentColor"}>
                        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    )}
                    {isFollowing ? "Following" : "Follow"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap gap-3 mt-6">
            <StatPill
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" stroke="currentColor" strokeWidth="2"/></svg>}
              label="Products"
              value={products.length || coop.productCount ?? 0}
            />
            <StatPill
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2"/></svg>}
              label="Followers"
              value={coop.followersCount ?? 0}
            />
            {coop.foundedYear && (
              <StatPill
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2"/></svg>}
                label="Est."
                value={coop.foundedYear}
              />
            )}
            {coop.artisanCount && (
              <StatPill
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" stroke="currentColor" strokeWidth="2"/></svg>}
                label="Artisans"
                value={coop.artisanCount}
              />
            )}
          </div>
        </div>

        {/* ── Tabs ───────────────────────────────────────────────────────────── */}
        <div className="border-b border-[#f0e8e0] mb-8">
          <div className="flex gap-0">
            {(["products", "about", "reviews"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-semibold capitalize transition-all border-b-2 -mb-px ${
                  activeTab === tab
                    ? "border-[#E76F51] text-[#E76F51]"
                    : "border-transparent text-[#9a8a7a] hover:text-[#6b5a4e]"
                }`}
              >
                {tab}
                {tab === "products" && products.length > 0 && (
                  <span className="ml-2 bg-[#f0e8e0] text-[#6b5a4e] text-xs px-2 py-0.5 rounded-full">
                    {products.length}
                  </span>
                )}
                {tab === "reviews" && reviews.length > 0 && (
                  <span className="ml-2 bg-[#f0e8e0] text-[#6b5a4e] text-xs px-2 py-0.5 rounded-full">
                    {reviews.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab: Products ──────────────────────────────────────────────────── */}
        {activeTab === "products" && (
          <FadeSection>
            {loadingProducts ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mb-16">
                {Array.from({ length: 8 }).map((_, i) => (
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
            ) : products.length === 0 ? (
              <div className="text-center py-20 mb-16">
                <p className="text-5xl mb-4">🧺</p>
                <h3 className="font-['Playfair_Display'] font-bold text-xl text-[#1a1008] mb-2">No products yet</h3>
                <p className="text-[#9a8a7a]">This cooperative hasn't listed any products.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mb-16">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            )}
          </FadeSection>
        )}

        {/* ── Tab: About ─────────────────────────────────────────────────────── */}
        {activeTab === "about" && (
          <FadeSection>
            <div className="grid md:grid-cols-2 gap-8 mb-16">
              {/* Description */}
              <div>
                <h2 className="font-['Playfair_Display'] font-bold text-2xl text-[#1a1008] mb-4">
                  Our Story
                </h2>
                {coop.description ? (
                  <p className="text-[#6b5a4e] leading-relaxed whitespace-pre-line">{coop.description}</p>
                ) : (
                  <p className="text-[#9a8a7a] italic">No description provided.</p>
                )}

                {/* Impact */}
                {(coop.impactStatement || coop.artisanCount) && (
                  <div className="mt-6 bg-gradient-to-br from-[#2A9D8F]/5 to-[#E9C46A]/10 rounded-[20px] p-6 border border-[#2A9D8F]/10">
                    <h3 className="font-['Playfair_Display'] font-bold text-lg text-[#1a1008] mb-2 flex items-center gap-2">
                      <span>🌿</span> Fair Trade Impact
                    </h3>
                    {coop.impactStatement && (
                      <p className="text-[#6b5a4e] text-sm leading-relaxed">{coop.impactStatement}</p>
                    )}
                    {coop.artisanCount && (
                      <p className="text-sm text-[#2A9D8F] font-semibold mt-2">
                        Supporting {coop.artisanCount} artisan{coop.artisanCount !== 1 ? "s" : ""} in {coop.city ?? "Morocco"}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Photo gallery */}
              <div>
                <h2 className="font-['Playfair_Display'] font-bold text-2xl text-[#1a1008] mb-4">
                  Gallery
                </h2>
                {photos.length === 0 ? (
                  <div className="rounded-[20px] bg-[#faf6f2] border-2 border-dashed border-[#f0e8e0] aspect-video flex items-center justify-center">
                    <p className="text-[#9a8a7a] text-sm">No gallery photos yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {photos.slice(0, 6).map((photo, i) => (
                      <button
                        key={i}
                        onClick={() => setGalleryIndex(i)}
                        className="aspect-square rounded-[12px] overflow-hidden hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-[#E76F51] focus:ring-offset-2"
                      >
                        <img src={photo} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </FadeSection>
        )}

        {/* ── Tab: Reviews ───────────────────────────────────────────────────── */}
        {activeTab === "reviews" && (
          <FadeSection>
            {reviews.length === 0 ? (
              <div className="text-center py-20 mb-16">
                <p className="text-5xl mb-4">💬</p>
                <h3 className="font-['Playfair_Display'] font-bold text-xl text-[#1a1008] mb-2">No reviews yet</h3>
                <p className="text-[#9a8a7a]">Be the first to leave a review after visiting or purchasing.</p>
              </div>
            ) : (
              <div>
                {/* Rating summary */}
                {avgRating !== null && (
                  <div className="flex items-center gap-6 mb-8 bg-white rounded-[20px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] w-fit">
                    <div className="text-center">
                      <p className="text-5xl font-['Playfair_Display'] font-bold text-[#1a1008]">
                        {avgRating.toFixed(1)}
                      </p>
                      <StarRating rating={avgRating} size={20} />
                      <p className="text-xs text-[#9a8a7a] mt-1">{reviews.length} reviews</p>
                    </div>
                    <div className="space-y-1 min-w-[160px]">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = reviews.filter((r) => Math.round(r.rating) === star).length;
                        const pct = reviews.length ? (count / reviews.length) * 100 : 0;
                        return (
                          <div key={star} className="flex items-center gap-2">
                            <span className="text-xs text-[#9a8a7a] w-3">{star}</span>
                            <div className="flex-1 h-1.5 bg-[#f0e8e0] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#E9C46A] rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-[#9a8a7a] w-4">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4 mb-16">
                  {reviews.map((review, i) => (
                    <ReviewCard
                      key={i}
                      author={review.userName ?? "Anonymous"}
                      rating={review.rating}
                      comment={review.comment}
                      date={review.createdAt ?? new Date().toISOString()}
                    />
                  ))}
                </div>
              </div>
            )}
          </FadeSection>
        )}
      </div>

      {/* ── Lightbox ─────────────────────────────────────────────────────────── */}
      {galleryIndex !== null && photos.length > 0 && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setGalleryIndex(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
            onClick={() => setGalleryIndex(null)}
            aria-label="Close"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
          {galleryIndex > 0 && (
            <button
              className="absolute left-4 text-white/70 hover:text-white transition-colors"
              onClick={(e) => { e.stopPropagation(); setGalleryIndex((i) => Math.max((i ?? 1) - 1, 0)); }}
              aria-label="Previous"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>
          )}
          <img
            src={photos[galleryIndex]}
            alt={`Gallery ${galleryIndex + 1}`}
            className="max-h-[85vh] max-w-[90vw] rounded-[16px] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {galleryIndex < photos.length - 1 && (
            <button
              className="absolute right-4 text-white/70 hover:text-white transition-colors"
              onClick={(e) => { e.stopPropagation(); setGalleryIndex((i) => Math.min((i ?? 0) + 1, photos.length - 1)); }}
              aria-label="Next"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>
          )}
          <div className="absolute bottom-4 text-white/50 text-sm">
            {galleryIndex + 1} / {photos.length}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
