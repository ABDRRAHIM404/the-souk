import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import type { Cooperative, Product, Review } from "@/types";
import { coopService } from "@/services/coopService";
import { productService } from "@/services/productService";
import { useAuth } from "@/hooks/useAuth";
import { useWishlist } from "@/hooks/useWishlist";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FadeSection from "@/components/FadeSection";
import ProductCard from "@/components/ProductCard";
import toast from "react-hot-toast";
import { mediaUrl } from "@/utils/media";

const categoryLabels: Record<string, string> = {
  argan: "Argan oil",
  carpets: "Carpets",
  saffron: "Saffron",
  pottery: "Pottery",
  food: "Food and spices",
  leather: "Leather",
  other: "Craft",
};

function formatCategory(category?: string) {
  if (!category) return "Craft";
  return categoryLabels[category] ?? category;
}

function yearsActive(foundedYear?: number) {
  if (!foundedYear) return null;
  return Math.max(new Date().getFullYear() - foundedYear, 0);
}

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <span className="coop-stars" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg key={star} viewBox="0 0 20 20" width={size} height={size} aria-hidden="true">
          <path
            d="m10 1.8 2.4 5 5.5.8-4 3.9.9 5.5-4.8-2.6L5.2 17l.9-5.5-4-3.9 5.5-.8L10 1.8Z"
            fill={star <= Math.round(rating) ? "#E9C46A" : "#f0e8e0"}
          />
        </svg>
      ))}
    </span>
  );
}

function VerifiedIcon() {
  return (
    <svg viewBox="0 0 18 18" width="15" height="15" fill="none" aria-hidden="true">
      <path
        d="M7.1 2.2a2.4 2.4 0 0 1 3.8 0l.3.4c.3.4.8.6 1.3.6h.5a2.4 2.4 0 0 1 2.4 2.4v.5c0 .5.2 1 .6 1.3l.4.3a2.4 2.4 0 0 1 0 3.8l-.4.3c-.4.3-.6.8-.6 1.3v.5a2.4 2.4 0 0 1-2.4 2.4h-.5c-.5 0-1 .2-1.3.6l-.3.4a2.4 2.4 0 0 1-3.8 0l-.3-.4c-.3-.4-.8-.6-1.3-.6H5a2.4 2.4 0 0 1-2.4-2.4v-.5c0-.5-.2-1-.6-1.3l-.4-.3a2.4 2.4 0 0 1 0-3.8l.4-.3c.4-.3.6-.8.6-1.3v-.5A2.4 2.4 0 0 1 5 3.2h.5c.5 0 1-.2 1.3-.6l.3-.4Z"
        fill="#2A9D8F"
      />
      <path d="m6.2 9.1 1.8 1.8 3.9-4" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ImageFallback() {
  return (
    <div className="coop-image-fallback" aria-hidden="true">
      <svg viewBox="0 0 320 220" width="100%" height="100%" preserveAspectRatio="none">
        <rect width="320" height="220" fill="#f6efe7" />
        {Array.from({ length: 6 }).map((_, row) =>
          Array.from({ length: 7 }).map((__, col) => {
            const cx = 28 + col * 46;
            const cy = 28 + row * 36;
            return (
              <path
                key={`${row}-${col}`}
                d={`M${cx} ${cy - 13} L${cx + 13} ${cy} L${cx} ${cy + 13} L${cx - 13} ${cy} Z`}
                fill="none"
                stroke={row % 2 ? "#2A9D8F" : "#E76F51"}
                strokeWidth="1.35"
                opacity="0.25"
              />
            );
          })
        )}
      </svg>
    </div>
  );
}

function TrustBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="coop-trust-badge">
      <VerifiedIcon />
      {children}
    </span>
  );
}

function TrustMetric({
  label,
  value,
  tone = "light",
}: {
  label: string;
  value: string | number;
  tone?: "light" | "dark";
}) {
  return (
    <div className={tone === "dark" ? "coop-trust-metric coop-trust-metric-dark" : "coop-trust-metric"}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const reviewer = typeof review.reviewer === "object" ? review.reviewer : null;
  return (
    <article className="coop-review-card">
      <div className="coop-review-head">
        <div className="coop-avatar-sm">{reviewer ? reviewer.name.charAt(0).toUpperCase() : "?"}</div>
        <div>
          <strong>{reviewer?.name ?? "Anonymous"}</strong>
          <span>
            {new Date(review.createdAt).toLocaleDateString("en-GB", {
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
        <StarRating rating={review.rating} size={14} />
      </div>
      <p>{review.comment}</p>
    </article>
  );
}

function ProductSkeleton() {
  return (
    <div className="coop-product-skeleton" aria-hidden="true">
      <div />
      <span />
      <strong />
      <p />
    </div>
  );
}

function CoopLoadingState() {
  return (
    <div className="coop-page">
      <Navbar />
      <main className="coop-container coop-loading">
        <div className="coop-skeleton-cover" />
        <div className="coop-skeleton-panel">
          <span />
          <strong />
          <p />
          <em />
        </div>
      </main>
      <style>{pageStyles}</style>
      <Footer />
    </div>
  );
}

export default function CoopProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { wishlistSet } = useWishlist();

  const [coop, setCoop] = useState<Cooperative | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingCoop, setLoadingCoop] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"products" | "about" | "reviews">("products");
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();

    async function load() {
      try {
        setLoadingCoop(true);
        setError(null);
        const data = await coopService.getById(id!);
        if (controller.signal.aborted) return;
        setCoop(data);
        setIsFollowing(Boolean(user && data.followers?.includes(user._id)));
      } catch {
        if (!controller.signal.aborted) setError("Could not load cooperative profile.");
      } finally {
        if (!controller.signal.aborted) setLoadingCoop(false);
      }
    }

    load();
    return () => controller.abort();
  }, [id, user]);

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();

    async function load() {
      try {
        setLoadingProducts(true);
        const res = await productService.getAll({ cooperative: id, limit: 12 });
        if (!controller.signal.aborted) setProducts(res.data);
      } catch {
        // Products tab has an intentional empty state.
      } finally {
        if (!controller.signal.aborted) setLoadingProducts(false);
      }
    }

    load();
    return () => controller.abort();
  }, [id]);

  const handleFollow = async () => {
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
                ? Math.max((prev.followersCount ?? 1) - 1, 0)
                : (prev.followersCount ?? 0) + 1,
            }
          : prev
      );
      toast.success(isFollowing ? "Unfollowed cooperative" : "Following cooperative");
    } catch {
      toast.error("Could not update follow status");
    } finally {
      setFollowLoading(false);
    }
  };

  useEffect(() => {
    if (galleryIndex === null) return;
    const photos = coop?.photos ?? [];

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setGalleryIndex(null);
      if (e.key === "ArrowRight") setGalleryIndex((index) => (index !== null ? Math.min(index + 1, photos.length - 1) : null));
      if (e.key === "ArrowLeft") setGalleryIndex((index) => (index !== null ? Math.max(index - 1, 0) : null));
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [galleryIndex, coop?.photos]);

  if (loadingCoop) return <CoopLoadingState />;

  if (error || !coop) {
    return (
      <div className="coop-page">
        <Navbar />
        <main className="coop-not-found">
          <ImageFallback />
          <h1>Cooperative not found</h1>
          <p>{error ?? "This cooperative does not exist or has been removed."}</p>
          <Link to="/marketplace" className="coop-primary-link">Browse marketplace</Link>
        </main>
        <style>{pageStyles}</style>
        <Footer />
      </div>
    );
  }

  const photos = coop.photos ?? [];
  const reviews = coop.reviews ?? [];
  const avgRating = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : null;
  const activeYears = yearsActive(coop.foundedYear);
  const locationText = coop.location
    ? `${coop.location.city}, ${coop.location.region}`
    : [coop.city, coop.region].filter(Boolean).join(", ");
  const certified = Boolean(coop.verified || coop.isCertified);
  const productCount = products.length || coop.productCount || 0;

  const reviewDistribution = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((review) => Math.round(review.rating) === star).length;
    return {
      star,
      count,
      pct: reviews.length ? (count / reviews.length) * 100 : 0,
    };
  });

  return (
    <div className="coop-page">
      <Navbar />

      <main>
        <section className="coop-hero">
          <div className="coop-cover">
            {coop.coverImage ? (
              <img src={mediaUrl(coop.coverImage)} alt={`${coop.name} cooperative`} />
            ) : (
              <ImageFallback />
            )}
            <div className="coop-cover-overlay" />
          </div>

          <div className="coop-container coop-identity-wrap">
            <div className="coop-identity-card">
              <div className="coop-logo">
                {coop.logo ? <img src={mediaUrl(coop.logo)} alt={coop.name} /> : coop.name.charAt(0)}
              </div>

              <div className="coop-identity-main">
                <p className="coop-eyebrow">Verified artisan storefront</p>
                <div className="coop-title-row">
                  <h1>{coop.name}</h1>
                  {certified && <TrustBadge>Verified cooperative</TrustBadge>}
                </div>
                <div className="coop-meta-row">
                  {locationText && <span>{locationText}</span>}
                  <span>{formatCategory(coop.category)}</span>
                  {avgRating !== null && (
                    <a href="#reviews">
                      <StarRating rating={avgRating} size={15} />
                      <strong>{avgRating.toFixed(1)}</strong>
                      <span>{reviews.length} reviews</span>
                    </a>
                  )}
                </div>
              </div>

              {user?.role === "tourist" && (
                <button className={isFollowing ? "coop-follow coop-following" : "coop-follow"} onClick={handleFollow} disabled={followLoading}>
                  {followLoading ? "Updating..." : isFollowing ? "Following" : "Follow cooperative"}
                </button>
              )}
            </div>

            <div className="coop-trust-strip">
              <TrustMetric label="Products" value={productCount} />
              <TrustMetric label="Followers" value={coop.followersCount ?? 0} />
              <TrustMetric label="Artisans" value={coop.artisanCount ?? "Local"} />
              <TrustMetric label="Years active" value={activeYears ?? (coop.foundedYear ?? "Established")} />
              <TrustMetric label="Region" value={coop.location?.city ?? coop.city ?? "Morocco"} tone="dark" />
            </div>
          </div>
        </section>

        <section className="coop-container coop-content">
          <div className="coop-tabs" role="tablist" aria-label="Cooperative profile sections">
            {(["products", "about", "reviews"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={activeTab === tab ? "coop-tab coop-tab-active" : "coop-tab"}
                role="tab"
                aria-selected={activeTab === tab}
              >
                {tab}
                {tab === "products" && productCount > 0 && <span>{productCount}</span>}
                {tab === "reviews" && reviews.length > 0 && <span>{reviews.length}</span>}
              </button>
            ))}
          </div>

          {activeTab === "products" && (
            <FadeSection>
              <div className="coop-section-top">
                <div>
                  <p className="coop-eyebrow">Cooperative products</p>
                  <h2>Made by {coop.name}</h2>
                </div>
                <p>Every item connects back to this cooperative storefront and its regional craft practice.</p>
              </div>

              {loadingProducts ? (
                <div className="coop-products-grid">
                  {Array.from({ length: 8 }).map((_, index) => <ProductSkeleton key={index} />)}
                </div>
              ) : products.length === 0 ? (
                <div className="coop-empty-card">
                  <h3>No products listed yet</h3>
                  <p>This cooperative has not published products on The Souk yet. Their profile remains available for story, trust, and future inventory.</p>
                </div>
              ) : (
                <div className="coop-products-grid">
                  {products.map((product) => (
                    <ProductCard
                      key={product._id}
                      product={product}
                      initialWishlisted={wishlistSet.has(product._id)}
                    />
                  ))}
                </div>
              )}
            </FadeSection>
          )}

          {activeTab === "about" && (
            <FadeSection>
              <div className="coop-story-grid">
                <article className="coop-story-card">
                  <p className="coop-eyebrow">Our story</p>
                  <h2>Craft, place, and cooperative work</h2>
                  {coop.description ? (
                    <p>{coop.description}</p>
                  ) : (
                    <p>This cooperative has not added a full story yet, but its storefront is ready to present products, origin, and impact as inventory grows.</p>
                  )}

                  <div className="coop-story-metrics">
                    {certified && <TrustBadge>Verified Cooperative</TrustBadge>}
                    <TrustBadge>Fair Trade</TrustBadge>
                    {locationText && <TrustBadge>{locationText}</TrustBadge>}
                    {coop.artisanCount && <TrustBadge>{coop.artisanCount} artisans</TrustBadge>}
                  </div>
                </article>

                <article className="coop-impact-card">
                  <p className="coop-eyebrow">Impact</p>
                  <h2>Human-scale commerce with cultural value</h2>
                  {coop.impactStatement ? (
                    <blockquote>{coop.impactStatement}</blockquote>
                  ) : (
                    <p>The Souk highlights cooperative commerce that keeps product value closer to the people and places behind each craft.</p>
                  )}
                  {coop.artisanCount && <span>Supporting {coop.artisanCount} artisan{coop.artisanCount === 1 ? "" : "s"}</span>}
                </article>
              </div>

              <div className="coop-gallery-section">
                <div className="coop-section-top">
                  <div>
                    <p className="coop-eyebrow">Gallery</p>
                    <h2>Inside the cooperative</h2>
                  </div>
                  <p>Photos help travelers understand place, process, and authenticity before they buy.</p>
                </div>

                {photos.length === 0 ? (
                  <div className="coop-empty-card">
                    <h3>No gallery photos yet</h3>
                    <p>Gallery images will appear here once the cooperative adds visual documentation.</p>
                  </div>
                ) : (
                  <div className="coop-gallery-grid">
                    {photos.slice(0, 8).map((photo, index) => (
                      <button
                        key={`${photo}-${index}`}
                        type="button"
                        onClick={() => setGalleryIndex(index)}
                        className={index === 0 ? "coop-gallery-item coop-gallery-featured" : "coop-gallery-item"}
                        aria-label={`Open gallery image ${index + 1}`}
                      >
                        <img src={mediaUrl(photo)} alt={`${coop.name} gallery ${index + 1}`} loading="lazy" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </FadeSection>
          )}

          {activeTab === "reviews" && (
            <FadeSection>
              <section id="reviews" className="coop-reviews-section">
                <div className="coop-section-top">
                  <div>
                    <p className="coop-eyebrow">Traveler reviews</p>
                    <h2>Trust from the community</h2>
                  </div>
                  {reviews.length > 0 && <p>{reviews.length} review{reviews.length === 1 ? "" : "s"} from visitors and buyers.</p>}
                </div>

                {reviews.length === 0 ? (
                  <div className="coop-empty-card">
                    <h3>No reviews yet</h3>
                    <p>Reviews from travelers and customers will appear here once people share their experience.</p>
                  </div>
                ) : (
                  <>
                    {avgRating !== null && (
                      <div className="coop-rating-summary">
                        <div>
                          <strong>{avgRating.toFixed(1)}</strong>
                          <StarRating rating={avgRating} size={18} />
                          <span>{reviews.length} review{reviews.length === 1 ? "" : "s"}</span>
                        </div>
                        <div className="coop-rating-bars">
                          {reviewDistribution.map((item) => (
                            <div key={item.star}>
                              <span>{item.star}</span>
                              <div><i style={{ width: `${item.pct}%` }} /></div>
                              <em>{item.count}</em>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="coop-reviews-grid">
                      {reviews.map((review) => (
                        <ReviewCard key={review._id} review={review} />
                      ))}
                    </div>
                  </>
                )}
              </section>
            </FadeSection>
          )}
        </section>
      </main>

      {galleryIndex !== null && photos.length > 0 && (
        <div className="coop-lightbox" onClick={() => setGalleryIndex(null)} role="dialog" aria-modal="true" aria-label="Cooperative photo gallery">
          <button className="coop-lightbox-close" type="button" onClick={() => setGalleryIndex(null)} aria-label="Close gallery">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          {galleryIndex > 0 && (
            <button
              className="coop-lightbox-prev"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setGalleryIndex((index) => Math.max((index ?? 1) - 1, 0));
              }}
              aria-label="Previous image"
            >
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" aria-hidden="true">
                <path d="m15 18-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          )}

          <img
            src={mediaUrl(photos[galleryIndex])}
            alt={`${coop.name} gallery ${galleryIndex + 1}`}
            onClick={(e) => e.stopPropagation()}
          />

          {galleryIndex < photos.length - 1 && (
            <button
              className="coop-lightbox-next"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setGalleryIndex((index) => Math.min((index ?? 0) + 1, photos.length - 1));
              }}
              aria-label="Next image"
            >
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" aria-hidden="true">
                <path d="m9 18 6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          )}

          <div className="coop-lightbox-count">{galleryIndex + 1} / {photos.length}</div>
        </div>
      )}

      <Footer />
      <style>{pageStyles}</style>
    </div>
  );
}

const pageStyles = `
  .coop-page {
    min-height: 100vh;
    background: #FFFCF8;
    color: #6b5a4e;
  }

  .coop-container {
    width: min(1180px, calc(100% - 48px));
    margin: 0 auto;
  }

  .coop-hero {
    position: relative;
    padding-bottom: 34px;
  }

  .coop-cover {
    position: relative;
    height: 420px;
    overflow: hidden;
    background: #f6efe7;
  }

  .coop-cover img,
  .coop-logo img,
  .coop-gallery-item img,
  .coop-lightbox img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
  }

  .coop-cover-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(26,16,8,0.1), rgba(26,16,8,0.64));
  }

  .coop-image-fallback {
    width: 100%;
    height: 100%;
    min-height: inherit;
    display: flex;
    background: #f6efe7;
  }

  .coop-identity-wrap {
    position: relative;
    z-index: 2;
    margin-top: -96px;
  }

  .coop-identity-card,
  .coop-trust-strip,
  .coop-story-card,
  .coop-impact-card,
  .coop-empty-card,
  .coop-rating-summary,
  .coop-review-card,
  .coop-product-skeleton,
  .coop-not-found,
  .coop-skeleton-cover,
  .coop-skeleton-panel {
    border: 1px solid rgba(26,16,8,0.1);
    border-radius: 16px;
    background: #fff;
    box-shadow: 0 18px 48px rgba(26,16,8,0.08);
  }

  .coop-identity-card {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 20px;
    align-items: center;
    padding: 22px;
  }

  .coop-logo {
    width: 112px;
    height: 112px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border: 4px solid #fff;
    border-radius: 22px;
    background: #1a1008;
    color: #fff;
    font-family: "Playfair Display", serif;
    font-size: 50px;
    font-weight: 800;
    box-shadow: 0 16px 38px rgba(26,16,8,0.18);
  }

  .coop-eyebrow {
    margin: 0 0 10px;
    color: #8e6b25;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.12em;
    line-height: 1.3;
    text-transform: uppercase;
  }

  .coop-title-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
  }

  .coop-title-row h1,
  .coop-section-top h2,
  .coop-story-card h2,
  .coop-impact-card h2,
  .coop-empty-card h3,
  .coop-review-card strong,
  .coop-not-found h1 {
    margin: 0;
    color: #1a1008;
    font-family: "Playfair Display", serif;
    font-weight: 800;
    letter-spacing: -0.035em;
    line-height: 1.05;
  }

  .coop-title-row h1 {
    font-size: clamp(36px, 5vw, 58px);
  }

  .coop-meta-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 9px;
    margin-top: 12px;
  }

  .coop-meta-row > span,
  .coop-meta-row a {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 30px;
    border-radius: 999px;
    padding: 0 10px;
    background: #FFFCF8;
    color: #6b5a4e;
    font-size: 12px;
    font-weight: 800;
    text-decoration: none;
  }

  .coop-meta-row a strong {
    color: #1a1008;
  }

  .coop-stars {
    display: inline-flex;
    gap: 2px;
    line-height: 1;
  }

  .coop-trust-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 30px;
    border-radius: 999px;
    padding: 0 11px;
    background: rgba(42,157,143,0.08);
    color: #20786f;
    font-size: 11px;
    font-weight: 800;
    line-height: 1;
  }

  .coop-follow,
  .coop-primary-link {
    min-height: 46px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 0;
    border-radius: 12px;
    padding: 0 18px;
    background: #E76F51;
    color: #fff;
    box-shadow: 0 14px 32px rgba(231,111,81,0.26);
    font-size: 14px;
    font-weight: 800;
    text-decoration: none;
    cursor: pointer;
    white-space: nowrap;
  }

  .coop-following {
    border: 1px solid rgba(26,16,8,0.1);
    background: #fff;
    color: #1a1008;
    box-shadow: none;
  }

  .coop-follow:disabled {
    opacity: 0.65;
    cursor: wait;
  }

  .coop-trust-strip {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 1px;
    overflow: hidden;
    margin-top: 14px;
    background: rgba(26,16,8,0.1);
  }

  .coop-trust-metric {
    display: grid;
    gap: 4px;
    padding: 18px;
    background: #fff;
  }

  .coop-trust-metric-dark {
    background: #1a1008;
  }

  .coop-trust-metric strong {
    color: #1a1008;
    font-family: "Playfair Display", serif;
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1;
  }

  .coop-trust-metric span {
    color: #8c7b6f;
    font-size: 12px;
    font-weight: 800;
    line-height: 1.35;
  }

  .coop-trust-metric-dark strong,
  .coop-trust-metric-dark span {
    color: #fff;
  }

  .coop-trust-metric-dark span {
    opacity: 0.68;
  }

  .coop-content {
    padding: 22px 0 86px;
  }

  .coop-tabs {
    position: sticky;
    top: 74px;
    z-index: 20;
    display: flex;
    gap: 6px;
    overflow-x: auto;
    margin-bottom: 34px;
    padding: 8px;
    border: 1px solid rgba(26,16,8,0.1);
    border-radius: 16px;
    background: rgba(255,252,248,0.92);
    backdrop-filter: blur(14px);
    box-shadow: 0 14px 36px rgba(26,16,8,0.08);
  }

  .coop-tab {
    min-height: 42px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border: 0;
    border-radius: 12px;
    padding: 0 18px;
    background: transparent;
    color: #7b6a5e;
    font-size: 14px;
    font-weight: 800;
    text-transform: capitalize;
    cursor: pointer;
    white-space: nowrap;
  }

  .coop-tab-active {
    background: #1a1008;
    color: #fff;
  }

  .coop-tab span {
    min-width: 22px;
    height: 22px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    background: rgba(255,255,255,0.18);
    font-size: 11px;
  }

  .coop-section-top {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(240px, 420px);
    gap: 24px;
    align-items: end;
    margin-bottom: 24px;
  }

  .coop-section-top h2,
  .coop-story-card h2,
  .coop-impact-card h2 {
    font-size: clamp(30px, 4vw, 46px);
  }

  .coop-section-top p:not(.coop-eyebrow),
  .coop-story-card p,
  .coop-impact-card p,
  .coop-impact-card blockquote,
  .coop-empty-card p,
  .coop-review-card p,
  .coop-not-found p {
    margin: 0;
    color: #6b5a4e;
    font-size: 15px;
    line-height: 1.75;
  }

  .coop-products-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 22px;
  }

  .coop-products-grid > a {
    background: #fff !important;
    border-color: rgba(26,16,8,0.1) !important;
  }

  .coop-product-skeleton {
    overflow: hidden;
    min-height: 330px;
    box-shadow: none;
  }

  .coop-product-skeleton div {
    aspect-ratio: 4 / 3;
  }

  .coop-product-skeleton div,
  .coop-product-skeleton span,
  .coop-product-skeleton strong,
  .coop-product-skeleton p,
  .coop-skeleton-cover,
  .coop-skeleton-panel span,
  .coop-skeleton-panel strong,
  .coop-skeleton-panel p,
  .coop-skeleton-panel em {
    display: block;
    background: linear-gradient(90deg, #f0e8e0, #faf6f2, #f0e8e0);
    background-size: 240% 100%;
    animation: coopPulse 1.35s ease-in-out infinite;
  }

  .coop-product-skeleton span,
  .coop-product-skeleton strong,
  .coop-product-skeleton p {
    height: 12px;
    border-radius: 999px;
    margin: 14px 16px 0;
  }

  .coop-product-skeleton span { width: 44%; }
  .coop-product-skeleton strong { width: 72%; height: 18px; }
  .coop-product-skeleton p { width: 34%; height: 20px; }

  .coop-story-grid {
    display: grid;
    grid-template-columns: 1.1fr 0.9fr;
    gap: 22px;
  }

  .coop-story-card,
  .coop-impact-card,
  .coop-empty-card,
  .coop-rating-summary,
  .coop-review-card {
    padding: 28px;
    box-shadow: none;
  }

  .coop-story-card p,
  .coop-impact-card p,
  .coop-impact-card blockquote {
    margin-top: 16px;
  }

  .coop-story-metrics {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 22px;
    padding-top: 18px;
    border-top: 1px solid rgba(26,16,8,0.08);
  }

  .coop-impact-card {
    background: #1a1008;
  }

  .coop-impact-card .coop-eyebrow {
    color: #E9C46A;
  }

  .coop-impact-card h2 {
    color: #fff;
  }

  .coop-impact-card p,
  .coop-impact-card blockquote {
    color: rgba(255,255,255,0.74);
  }

  .coop-impact-card blockquote {
    padding-left: 16px;
    border-left: 3px solid #E9C46A;
    font-style: italic;
  }

  .coop-impact-card span {
    display: inline-flex;
    margin-top: 22px;
    border-radius: 999px;
    padding: 8px 12px;
    background: rgba(255,255,255,0.1);
    color: #fff;
    font-size: 12px;
    font-weight: 800;
  }

  .coop-gallery-section {
    margin-top: 54px;
  }

  .coop-gallery-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    grid-auto-rows: 180px;
    gap: 12px;
  }

  .coop-gallery-item {
    overflow: hidden;
    border: 0;
    border-radius: 14px;
    padding: 0;
    background: #f6efe7;
    cursor: pointer;
  }

  .coop-gallery-featured {
    grid-column: span 2;
    grid-row: span 2;
  }

  .coop-reviews-section {
    scroll-margin-top: 120px;
  }

  .coop-rating-summary {
    display: grid;
    grid-template-columns: 180px 1fr;
    gap: 24px;
    align-items: center;
    margin-bottom: 24px;
  }

  .coop-rating-summary > div:first-child {
    display: grid;
    gap: 6px;
    justify-items: center;
    text-align: center;
    border-right: 1px solid rgba(26,16,8,0.08);
    padding-right: 24px;
  }

  .coop-rating-summary strong {
    color: #E76F51;
    font-family: "Playfair Display", serif;
    font-size: 50px;
    line-height: 1;
  }

  .coop-rating-summary span,
  .coop-rating-bars span,
  .coop-rating-bars em {
    color: #8c7b6f;
    font-size: 12px;
    font-style: normal;
    font-weight: 700;
  }

  .coop-rating-bars {
    display: grid;
    gap: 7px;
  }

  .coop-rating-bars > div {
    display: grid;
    grid-template-columns: 18px 1fr 24px;
    gap: 9px;
    align-items: center;
  }

  .coop-rating-bars div div {
    height: 7px;
    overflow: hidden;
    border-radius: 999px;
    background: #f0e8e0;
  }

  .coop-rating-bars i {
    display: block;
    height: 100%;
    border-radius: 999px;
    background: #E9C46A;
  }

  .coop-reviews-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .coop-review-head {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 12px;
    align-items: center;
    margin-bottom: 14px;
  }

  .coop-avatar-sm {
    width: 42px;
    height: 42px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: #1a1008;
    color: #fff;
    font-weight: 800;
  }

  .coop-review-head strong {
    display: block;
    font-family: system-ui, sans-serif;
    font-size: 14px;
    letter-spacing: 0;
  }

  .coop-review-head span {
    color: #9a8a7a;
    font-size: 12px;
  }

  .coop-empty-card h3 {
    font-size: 26px;
    margin-bottom: 8px;
  }

  .coop-lightbox {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: rgba(0,0,0,0.84);
    backdrop-filter: blur(10px);
  }

  .coop-lightbox img {
    width: auto;
    height: auto;
    max-width: min(92vw, 1180px);
    max-height: 84vh;
    border-radius: 16px;
  }

  .coop-lightbox button {
    position: absolute;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 0;
    border-radius: 999px;
    background: rgba(255,255,255,0.1);
    color: #fff;
    cursor: pointer;
  }

  .coop-lightbox-close {
    top: 20px;
    right: 20px;
    width: 44px;
    height: 44px;
  }

  .coop-lightbox-prev,
  .coop-lightbox-next {
    top: 50%;
    width: 48px;
    height: 48px;
    transform: translateY(-50%);
  }

  .coop-lightbox-prev {
    left: 20px;
  }

  .coop-lightbox-next {
    right: 20px;
  }

  .coop-lightbox-count {
    position: absolute;
    left: 50%;
    bottom: 22px;
    transform: translateX(-50%);
    color: rgba(255,255,255,0.66);
    font-size: 13px;
    font-weight: 800;
  }

  .coop-not-found {
    width: min(520px, calc(100% - 32px));
    margin: 110px auto 70px;
    padding: 42px 28px;
    text-align: center;
    box-shadow: none;
  }

  .coop-not-found .coop-image-fallback {
    width: 90px;
    height: 90px;
    min-height: 0;
    margin: 0 auto 18px;
    border-radius: 18px;
    overflow: hidden;
  }

  .coop-not-found h1 {
    font-size: 34px;
  }

  .coop-not-found .coop-primary-link {
    margin-top: 22px;
  }

  .coop-loading {
    padding: 100px 0 70px;
  }

  .coop-skeleton-cover {
    height: 360px;
    border-radius: 18px;
  }

  .coop-skeleton-panel {
    display: grid;
    gap: 16px;
    margin-top: -74px;
    padding: 28px;
  }

  .coop-skeleton-panel span,
  .coop-skeleton-panel strong,
  .coop-skeleton-panel p,
  .coop-skeleton-panel em {
    height: 14px;
    border-radius: 999px;
  }

  .coop-skeleton-panel span { width: 28%; }
  .coop-skeleton-panel strong { width: 68%; height: 44px; }
  .coop-skeleton-panel p { width: 48%; }
  .coop-skeleton-panel em { width: 100%; height: 64px; }

  @keyframes coopPulse {
    0% { background-position: 100% 0; }
    100% { background-position: -100% 0; }
  }

  @media (max-width: 980px) {
    .coop-container {
      width: min(100% - 32px, 760px);
    }

    .coop-identity-card,
    .coop-section-top,
    .coop-story-grid,
    .coop-rating-summary {
      grid-template-columns: 1fr;
    }

    .coop-trust-strip {
      grid-template-columns: repeat(2, 1fr);
    }

    .coop-products-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .coop-gallery-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      grid-auto-rows: 170px;
    }

    .coop-reviews-grid {
      grid-template-columns: 1fr;
    }

    .coop-rating-summary > div:first-child {
      justify-items: start;
      text-align: left;
      border-right: 0;
      border-bottom: 1px solid rgba(26,16,8,0.08);
      padding-right: 0;
      padding-bottom: 18px;
    }
  }

  @media (max-width: 620px) {
    .coop-container {
      width: min(100% - 28px, 520px);
    }

    .coop-cover {
      height: 330px;
    }

    .coop-identity-wrap {
      margin-top: -78px;
    }

    .coop-identity-card {
      padding: 18px;
    }

    .coop-logo {
      width: 88px;
      height: 88px;
      border-radius: 18px;
      font-size: 40px;
    }

    .coop-title-row h1 {
      font-size: 34px;
    }

    .coop-follow {
      width: 100%;
    }

    .coop-trust-strip,
    .coop-products-grid,
    .coop-gallery-grid {
      grid-template-columns: 1fr;
    }

    .coop-trust-metric,
    .coop-story-card,
    .coop-impact-card,
    .coop-empty-card,
    .coop-rating-summary,
    .coop-review-card {
      padding: 20px;
    }

    .coop-tabs {
      top: 68px;
      margin-bottom: 26px;
    }

    .coop-tab {
      flex: 1 0 auto;
      justify-content: center;
      padding: 0 14px;
    }

    .coop-content {
      padding-bottom: 64px;
    }

    .coop-section-top h2,
    .coop-story-card h2,
    .coop-impact-card h2 {
      font-size: 30px;
    }

    .coop-gallery-featured {
      grid-column: auto;
      grid-row: auto;
    }

    .coop-gallery-grid {
      grid-auto-rows: auto;
    }

    .coop-gallery-item {
      aspect-ratio: 4 / 3;
    }

    .coop-review-head {
      grid-template-columns: auto 1fr;
    }

    .coop-review-head .coop-stars {
      grid-column: 1 / -1;
    }

    .coop-lightbox {
      padding: 14px;
    }

    .coop-lightbox-prev,
    .coop-lightbox-next {
      bottom: 18px;
      top: auto;
      transform: none;
    }

    .coop-lightbox-prev {
      left: 18px;
    }

    .coop-lightbox-next {
      right: 18px;
    }
  }
`;
