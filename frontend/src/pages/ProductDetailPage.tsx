import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FadeSection from "@/components/FadeSection";
import { productService } from "@/services/productService";
import { coopService } from "@/services/coopService";
import type { Product, Cooperative, Review } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { useWishlist } from "@/hooks/useWishlist";
import { useCart } from "@/hooks/useCart";
import api from "@/services/api";
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

function formatPrice(price: number) {
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    maximumFractionDigits: 0,
  }).format(price);
}

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <span className="pd-stars" aria-label={`${rating} out of 5 stars`}>
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

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="pd-star-picker" role="radiogroup" aria-label="Choose a rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className={star <= (hovered || value) ? "pd-star-active" : ""}
          aria-label={`${star} star${star === 1 ? "" : "s"}`}
          aria-checked={value === star}
          role="radio"
        >
          <svg viewBox="0 0 20 20" width="30" height="30" aria-hidden="true">
            <path d="m10 1.8 2.4 5 5.5.8-4 3.9.9 5.5-4.8-2.6L5.2 17l.9-5.5-4-3.9 5.5-.8L10 1.8Z" />
          </svg>
        </button>
      ))}
    </div>
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

function ProductFallback() {
  return (
    <div className="pd-image-fallback" aria-hidden="true">
      <svg viewBox="0 0 240 220" width="100%" height="100%" preserveAspectRatio="none">
        <rect width="240" height="220" fill="#f6efe7" />
        {Array.from({ length: 5 }).map((_, row) =>
          Array.from({ length: 5 }).map((__, col) => {
            const cx = 28 + col * 46;
            const cy = 34 + row * 40;
            return (
              <path
                key={`${row}-${col}`}
                d={`M${cx} ${cy - 14} L${cx + 14} ${cy} L${cx} ${cy + 14} L${cx - 14} ${cy} Z`}
                fill="none"
                stroke={row % 2 ? "#2A9D8F" : "#E76F51"}
                strokeWidth="1.4"
                opacity="0.26"
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
    <span className="pd-trust-badge">
      <VerifiedIcon />
      {children}
    </span>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const reviewer = typeof review.reviewer === "object" ? review.reviewer : null;

  return (
    <article className="pd-review-card">
      <div className="pd-review-head">
        <div className="pd-avatar">{reviewer ? reviewer.name.charAt(0).toUpperCase() : "?"}</div>
        <div className="pd-review-person">
          <strong>{reviewer?.name ?? "Anonymous"}</strong>
          <span>
            {new Date(review.createdAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
        <div className="pd-review-rating">
          <StarRating rating={review.rating} size={14} />
          <span>{review.rating}/5</span>
        </div>
      </div>
      <p>{review.comment}</p>
      {review.photo && <img src={mediaUrl(review.photo)} alt="Review attachment" loading="lazy" />}
    </article>
  );
}

function RelatedCard({ product }: { product: Product }) {
  const image = product.images?.[0];
  return (
    <Link to={`/products/${product._id}`} className="pd-related-card">
      <div className="pd-related-media">
        {image ? <img src={mediaUrl(image)} alt={product.name} loading="lazy" /> : <ProductFallback />}
        {product.fairTradeCertified && <span>Fair trade</span>}
      </div>
      <div className="pd-related-body">
        <p>{formatCategory(product.category)}{product.origin ? ` / ${product.origin}` : ""}</p>
        <h3>{product.name}</h3>
        <strong>{formatPrice(product.price)}</strong>
      </div>
    </Link>
  );
}

function ProductLoadingState() {
  return (
    <div className="pd-page">
      <Navbar />
      <main className="pd-container pd-loading">
        <div className="pd-skeleton pd-skeleton-media" />
        <div className="pd-skeleton-stack">
          <span />
          <strong />
          <p />
          <em />
          <div />
        </div>
      </main>
      <style>{pageStyles}</style>
    </div>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { wishlistSet } = useWishlist();
  const { addItem } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [coop, setCoop] = useState<Cooperative | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [related, setRelated] = useState<Product[]>([]);
  const [activeImage, setActiveImage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [wishlistOverride, setWishlistOverride] = useState<boolean | null>(null);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const wishlisted = wishlistOverride ?? (id ? wishlistSet.has(id) : false);

  const toggleWishlist = async () => {
    if (!user) {
      toast.error("Log in to save to wishlist");
      return;
    }
    if (user.role !== "tourist") return;
    if (!id || wishlistLoading) return;

    const next = !wishlisted;
    setWishlistOverride(next);
    setWishlistLoading(true);
    try {
      if (next) {
        await productService.addToWishlist(id);
        toast.success("Added to wishlist");
      } else {
        await productService.removeFromWishlist(id);
        toast.success("Removed from wishlist");
      }
    } catch {
      setWishlistOverride(!next);
      toast.error("Could not update wishlist. Please try again");
    } finally {
      setWishlistLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();

    const run = async () => {
      setIsLoading(true);
      try {
        const p = await productService.getById(id);
        if (controller.signal.aborted) return;
        setProduct(p);
        setActiveImage(0);

        const cooperativeId = typeof p.cooperative === "object" ? p.cooperative._id : p.cooperative;
        const c = await coopService.getById(cooperativeId);
        if (controller.signal.aborted) return;
        setCoop(c);

        const { data: revData } = await api.get<{ data: Review[] }>(`/products/${id}/reviews`);
        if (controller.signal.aborted) return;
        setReviews(revData.data);

        const relRes = await productService.getAll({ limit: 4 });
        if (controller.signal.aborted) return;
        setRelated(relRes.data.filter((item) => item._id !== id).slice(0, 3));
      } catch {
        if (!controller.signal.aborted) toast.error("Failed to load product");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    run();
    return () => controller.abort();
  }, [id]);

  const submitReview = async () => {
    if (!id) return;
    if (rating === 0) {
      toast.error("Please select a star rating");
      return;
    }
    if (comment.trim().length < 10) {
      toast.error("Comment must be at least 10 characters");
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/products/${id}/reviews`, { rating, comment });
      toast.success("Review posted");
      setRating(0);
      setComment("");
      const { data: revData } = await api.get<{ data: Review[] }>(`/products/${id}/reviews`);
      setReviews(revData.data);
    } catch {
      toast.error("Failed to post review. You may have already reviewed this product.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) return <ProductLoadingState />;

  if (!product) {
    return (
      <div className="pd-page">
        <Navbar />
        <main className="pd-not-found">
          <ProductFallback />
          <h1>Product not found</h1>
          <p>This product may have been removed or is no longer available.</p>
          <Link to="/marketplace" className="pd-primary-link">Back to marketplace</Link>
        </main>
        <style>{pageStyles}</style>
      </div>
    );
  }

  const images = product.images?.length ? product.images : [];
  const activeImageUrl = images[activeImage];
  const outOfStock = product.stock !== undefined && product.stock === 0;
  const avgRating = reviews.length > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
  const coopName = typeof product.cooperative === "object" ? product.cooperative.name : coop?.name ?? "Cooperative";
  const coopId = typeof product.cooperative === "object" ? product.cooperative._id : product.cooperative;
  const coopLocation = coop?.location ? `${coop.location.city}, ${coop.location.region}` : [coop?.city, coop?.region].filter(Boolean).join(", ");
  const productIsFairTrade = Boolean(product.fairTradeCertified || product.isFairTrade);

  const contactSubject = encodeURIComponent(`Inquiry about ${product.name} - The Souk`);
  const contactBody = encodeURIComponent(
    `Hello,\n\nI found your product "${product.name}" on The Souk marketplace and I would like to know more.\n\nThank you.`
  );

  const handleAddToCart = () => {
    if (!user) {
      toast.error("Sign in to add items to your cart");
      return;
    }
    if (user.role === "coop_owner") return;
    if (outOfStock) return;

    addItem({
      productId: product._id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.images?.[0],
      cooperativeId: coopId,
      cooperativeName: coopName,
    });
    toast.success("Added to cart");
  };

  const stockText = product.stock > 5
    ? `${product.stock} in stock`
    : product.stock > 0
    ? `Only ${product.stock} left`
    : "Currently out of stock";

  const reviewDistribution = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((review) => review.rating === star).length;
    return {
      star,
      count,
      pct: reviews.length ? (count / reviews.length) * 100 : 0,
    };
  });

  return (
    <div className="pd-page">
      <Navbar />

      <main className="pd-container">
        <nav className="pd-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/marketplace">Marketplace</Link>
          <span>/</span>
          <Link to={`/marketplace?category=${product.category}`}>{formatCategory(product.category)}</Link>
          <span>/</span>
          <strong>{product.name}</strong>
        </nav>

        <section className="pd-hero">
          <FadeSection>
            <div className="pd-gallery">
              <div className="pd-main-image">
                {activeImageUrl ? <img src={mediaUrl(activeImageUrl)} alt={product.name} /> : <ProductFallback />}
                <div className="pd-image-badges">
                  {productIsFairTrade && <TrustBadge>Fair trade</TrustBadge>}
                  {outOfStock && <span className="pd-stock-overlay">Out of stock</span>}
                </div>
              </div>

              <div className="pd-thumbnails" aria-label="Product images">
                {images.length > 0 ? (
                  images.map((image, index) => (
                    <button
                      key={image + index}
                      type="button"
                      onClick={() => setActiveImage(index)}
                      className={index === activeImage ? "pd-thumb pd-thumb-active" : "pd-thumb"}
                      aria-label={`View product image ${index + 1}`}
                    >
                      <img src={mediaUrl(image)} alt="" />
                    </button>
                  ))
                ) : (
                  <button type="button" className="pd-thumb pd-thumb-active" aria-label="Product image placeholder">
                    <ProductFallback />
                  </button>
                )}
              </div>
            </div>
          </FadeSection>

          <FadeSection delay={120}>
            <aside className="pd-purchase-panel">
              <p className="pd-eyebrow">{formatCategory(product.category)}{product.origin ? ` / ${product.origin}` : ""}</p>
              <h1>{product.name}</h1>

              {reviews.length > 0 && (
                <a href="#reviews" className="pd-rating-link">
                  <StarRating rating={avgRating} size={16} />
                  <strong>{avgRating.toFixed(1)}</strong>
                  <span>{reviews.length} review{reviews.length === 1 ? "" : "s"}</span>
                </a>
              )}

              <div className="pd-price-row">
                <strong>{formatPrice(product.price)}</strong>
                <span>Fixed fair-trade price</span>
              </div>

              <div className={outOfStock ? "pd-stock pd-stock-out" : "pd-stock"}>
                <span />
                {stockText}
              </div>

              {user?.role !== "coop_owner" && (
                <button className="pd-primary-cta" type="button" onClick={handleAddToCart} disabled={outOfStock}>
                  {outOfStock ? "Out of stock" : "Add to cart"}
                </button>
              )}

              <a className="pd-secondary-cta" href={`mailto:?subject=${contactSubject}&body=${contactBody}`}>
                Contact cooperative
              </a>

              {(!user || user.role === "tourist") && (
                <button
                  className={wishlisted ? "pd-wishlist pd-wishlist-active" : "pd-wishlist"}
                  type="button"
                  onClick={toggleWishlist}
                  disabled={wishlistLoading}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill={wishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  {wishlisted ? "Saved to wishlist" : "Save to wishlist"}
                </button>
              )}

              <div className="pd-trust-grid">
                {coop && <TrustBadge>Verified cooperative</TrustBadge>}
                {productIsFairTrade && <TrustBadge>Fair trade</TrustBadge>}
                <TrustBadge>Handmade</TrustBadge>
                <TrustBadge>Local production</TrustBadge>
                <TrustBadge>Secure checkout</TrustBadge>
                <TrustBadge>Cash on delivery</TrustBadge>
              </div>

              <Link to={`/coops/${coopId}`} className="pd-coop-card">
                <div className="pd-coop-avatar">
                  {coop?.coverImage ? <img src={mediaUrl(coop.coverImage)} alt={coopName} /> : coopName.charAt(0)}
                </div>
                <div>
                  <span>Made by</span>
                  <strong>{coopName}</strong>
                  {coopLocation && <small>{coopLocation}</small>}
                </div>
                <em>View profile</em>
              </Link>
            </aside>
          </FadeSection>
        </section>

        <section className="pd-story-grid">
          <FadeSection>
            <article className="pd-story-card">
              <p className="pd-eyebrow">Product story</p>
              <h2>Why this product belongs in the journey</h2>
              <p>{product.description}</p>
              {product.materials && product.materials.length > 0 && (
                <div className="pd-materials">
                  <strong>Materials</strong>
                  <span>{product.materials.join(", ")}</span>
                </div>
              )}
            </article>
          </FadeSection>

          <FadeSection delay={100}>
            <article className="pd-impact-card">
              <p className="pd-eyebrow">Cooperative impact</p>
              <h2>88% stays with the cooperative</h2>
              <p>
                Your purchase supports {coopName}. The Souk uses transparent pricing with a
                12% platform fee and no haggling.
              </p>
              {coop?.impactStatement && <blockquote>{coop.impactStatement}</blockquote>}
            </article>
          </FadeSection>
        </section>

        <section id="reviews" className="pd-reviews-section">
          <FadeSection>
            <div className="pd-section-top">
              <div>
                <p className="pd-eyebrow">Traveler reviews</p>
                <h2>What buyers say</h2>
              </div>
              {reviews.length > 0 && <span>{reviews.length} review{reviews.length === 1 ? "" : "s"}</span>}
            </div>

            {reviews.length > 0 && (
              <div className="pd-rating-summary">
                <div>
                  <strong>{avgRating.toFixed(1)}</strong>
                  <StarRating rating={avgRating} size={18} />
                  <span>{reviews.length} review{reviews.length === 1 ? "" : "s"}</span>
                </div>
                <div className="pd-rating-bars">
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

            <div className="pd-reviews-grid">
              <div className="pd-review-list">
                {reviews.length === 0 ? (
                  <div className="pd-empty-card">
                    <h3>No reviews yet</h3>
                    <p>Be the first traveler to share what this product was like to receive, use, or gift.</p>
                  </div>
                ) : (
                  reviews.map((review) => <ReviewCard key={review._id} review={review} />)
                )}
              </div>

              <aside className="pd-review-form-card">
                <h3>Share your experience</h3>
                {!user ? (
                  <div className="pd-review-gate">
                    <p>You must be logged in as a tourist to leave a review.</p>
                    <Link to="/login" className="pd-primary-link">Log in</Link>
                  </div>
                ) : user.role !== "tourist" ? (
                  <div className="pd-review-gate">
                    <p>Only tourists can leave product reviews.</p>
                  </div>
                ) : (
                  <>
                    <label>Your rating</label>
                    <StarPicker value={rating} onChange={setRating} />
                    {rating > 0 && <span className="pd-rating-label">{["", "Poor", "Fair", "Good", "Very good", "Excellent"][rating]}</span>}

                    <label>Your experience</label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share product quality, packaging, and your experience with the cooperative..."
                      rows={5}
                    />
                    <small>{comment.length} / 10 characters minimum</small>

                    <button type="button" onClick={submitReview} disabled={submitting}>
                      {submitting ? "Posting review..." : "Post review"}
                    </button>
                  </>
                )}
              </aside>
            </div>
          </FadeSection>
        </section>

        {related.length > 0 && (
          <section className="pd-related-section">
            <FadeSection delay={100}>
              <div className="pd-section-top">
                <div>
                  <p className="pd-eyebrow">Keep exploring</p>
                  <h2>More from The Souk</h2>
                </div>
                <Link to="/marketplace">Browse all products</Link>
              </div>
              <div className="pd-related-grid">
                {related.map((item) => <RelatedCard key={item._id} product={item} />)}
              </div>
            </FadeSection>
          </section>
        )}
      </main>

      {user?.role !== "coop_owner" && (
        <div className="pd-mobile-cta">
          <div>
            <span>{formatPrice(product.price)}</span>
            <small>{outOfStock ? "Out of stock" : stockText}</small>
          </div>
          <button type="button" onClick={handleAddToCart} disabled={outOfStock}>
            {outOfStock ? "Out" : "Add to cart"}
          </button>
        </div>
      )}

      <Footer />
      <style>{pageStyles}</style>
    </div>
  );
}

const pageStyles = `
  .pd-page {
    min-height: 100vh;
    background: #FFFCF8;
    color: #6b5a4e;
  }

  .pd-container {
    width: min(1180px, calc(100% - 48px));
    margin: 0 auto;
    padding: 100px 0 86px;
  }

  .pd-breadcrumb {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 28px;
    color: #9a8a7a;
    font-size: 13px;
    line-height: 1.4;
    overflow-x: auto;
    white-space: nowrap;
  }

  .pd-breadcrumb a {
    color: #9a8a7a;
    text-decoration: none;
  }

  .pd-breadcrumb strong {
    color: #1a1008;
    font-weight: 700;
  }

  .pd-hero {
    display: grid;
    grid-template-columns: minmax(0, 1.08fr) minmax(380px, 0.92fr);
    gap: 42px;
    align-items: start;
  }

  .pd-gallery {
    position: sticky;
    top: 92px;
  }

  .pd-main-image,
  .pd-purchase-panel,
  .pd-story-card,
  .pd-impact-card,
  .pd-rating-summary,
  .pd-review-card,
  .pd-review-form-card,
  .pd-empty-card,
  .pd-related-card,
  .pd-not-found,
  .pd-skeleton-media,
  .pd-skeleton-stack {
    border: 1px solid rgba(26,16,8,0.1);
    border-radius: 16px;
    background: #fff;
    box-shadow: 0 18px 48px rgba(26,16,8,0.08);
  }

  .pd-main-image {
    position: relative;
    overflow: hidden;
    aspect-ratio: 4 / 3;
  }

  .pd-main-image img,
  .pd-related-media img,
  .pd-coop-avatar img,
  .pd-review-card img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
  }

  .pd-image-fallback {
    width: 100%;
    height: 100%;
    min-height: inherit;
    display: flex;
    background: #f6efe7;
  }

  .pd-image-badges {
    position: absolute;
    left: 14px;
    bottom: 14px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .pd-trust-badge,
  .pd-stock-overlay {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 28px;
    border-radius: 999px;
    padding: 0 10px;
    background: rgba(255,255,255,0.92);
    color: #20786f;
    font-size: 11px;
    font-weight: 800;
    line-height: 1;
    box-shadow: 0 8px 22px rgba(26,16,8,0.14);
  }

  .pd-stock-overlay {
    background: rgba(26,16,8,0.78);
    color: #fff;
  }

  .pd-thumbnails {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 10px;
    margin-top: 12px;
  }

  .pd-thumb {
    aspect-ratio: 1;
    overflow: hidden;
    border: 1px solid rgba(26,16,8,0.1);
    border-radius: 12px;
    padding: 0;
    background: #f6efe7;
    cursor: pointer;
  }

  .pd-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .pd-thumb-active {
    border-color: #E76F51;
    box-shadow: 0 0 0 3px rgba(231,111,81,0.16);
  }

  .pd-purchase-panel {
    padding: 26px;
  }

  .pd-eyebrow {
    margin: 0 0 10px;
    color: #8e6b25;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.12em;
    line-height: 1.3;
    text-transform: uppercase;
  }

  .pd-purchase-panel h1,
  .pd-story-card h2,
  .pd-impact-card h2,
  .pd-section-top h2,
  .pd-not-found h1 {
    margin: 0;
    color: #1a1008;
    font-family: "Playfair Display", serif;
    font-weight: 800;
    letter-spacing: -0.035em;
    line-height: 1.05;
  }

  .pd-purchase-panel h1 {
    font-size: clamp(34px, 4.8vw, 52px);
  }

  .pd-rating-link {
    display: flex;
    align-items: center;
    gap: 8px;
    width: fit-content;
    margin-top: 16px;
    color: #6b5a4e;
    font-size: 14px;
    text-decoration: none;
  }

  .pd-rating-link strong {
    color: #1a1008;
  }

  .pd-stars {
    display: inline-flex;
    gap: 2px;
    line-height: 1;
  }

  .pd-price-row {
    display: grid;
    gap: 4px;
    margin-top: 22px;
    padding: 18px 0 20px;
    border-top: 1px solid rgba(26,16,8,0.08);
    border-bottom: 1px solid rgba(26,16,8,0.08);
  }

  .pd-price-row strong {
    color: #E76F51;
    font-family: "Playfair Display", serif;
    font-size: 42px;
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1;
  }

  .pd-price-row span,
  .pd-stock,
  .pd-coop-card small,
  .pd-coop-card span {
    color: #8c7b6f;
    font-size: 13px;
    line-height: 1.45;
  }

  .pd-stock {
    display: flex;
    align-items: center;
    gap: 9px;
    margin: 18px 0;
    font-weight: 800;
  }

  .pd-stock span {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: #2A9D8F;
  }

  .pd-stock-out span {
    background: #d94f3d;
  }

  .pd-primary-cta,
  .pd-secondary-cta,
  .pd-wishlist,
  .pd-primary-link,
  .pd-review-form-card button,
  .pd-mobile-cta button {
    min-height: 48px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 0;
    border-radius: 12px;
    padding: 0 20px;
    font-size: 14px;
    font-weight: 800;
    text-decoration: none;
    cursor: pointer;
    transition: transform 0.18s ease, background 0.18s ease, color 0.18s ease;
  }

  .pd-primary-cta,
  .pd-primary-link,
  .pd-review-form-card button,
  .pd-mobile-cta button {
    width: 100%;
    background: #E76F51;
    color: #fff;
    box-shadow: 0 14px 32px rgba(231,111,81,0.26);
  }

  .pd-primary-cta:disabled,
  .pd-review-form-card button:disabled,
  .pd-mobile-cta button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .pd-secondary-cta,
  .pd-wishlist {
    width: 100%;
    margin-top: 10px;
    border: 1px solid rgba(26,16,8,0.1);
    background: #fff;
    color: #1a1008;
  }

  .pd-wishlist {
    gap: 8px;
    color: #6b5a4e;
  }

  .pd-wishlist-active {
    border-color: rgba(231,111,81,0.22);
    background: rgba(231,111,81,0.08);
    color: #E76F51;
  }

  .pd-trust-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 20px;
    padding-top: 18px;
    border-top: 1px solid rgba(26,16,8,0.08);
  }

  .pd-trust-grid .pd-trust-badge {
    background: rgba(42,157,143,0.08);
    box-shadow: none;
  }

  .pd-coop-card {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 13px;
    margin-top: 20px;
    padding: 14px;
    border: 1px solid rgba(26,16,8,0.1);
    border-radius: 14px;
    color: inherit;
    text-decoration: none;
    background: #FFFCF8;
  }

  .pd-coop-avatar {
    width: 52px;
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border-radius: 14px;
    background: #1a1008;
    color: #fff;
    font-family: "Playfair Display", serif;
    font-size: 24px;
    font-weight: 800;
  }

  .pd-coop-card strong {
    display: block;
    color: #1a1008;
    font-size: 15px;
  }

  .pd-coop-card em {
    color: #E76F51;
    font-size: 12px;
    font-style: normal;
    font-weight: 800;
    white-space: nowrap;
  }

  .pd-story-grid {
    display: grid;
    grid-template-columns: 1.2fr 0.8fr;
    gap: 22px;
    margin-top: 34px;
  }

  .pd-story-card,
  .pd-impact-card {
    padding: 28px;
    box-shadow: none;
  }

  .pd-story-card h2,
  .pd-impact-card h2,
  .pd-section-top h2 {
    font-size: clamp(28px, 3.4vw, 40px);
  }

  .pd-story-card p,
  .pd-impact-card p,
  .pd-impact-card blockquote,
  .pd-empty-card p,
  .pd-review-gate p,
  .pd-not-found p {
    margin: 14px 0 0;
    color: #6b5a4e;
    font-size: 15px;
    line-height: 1.75;
  }

  .pd-impact-card {
    background: #1a1008;
  }

  .pd-impact-card .pd-eyebrow {
    color: #E9C46A;
  }

  .pd-impact-card h2 {
    color: #fff;
  }

  .pd-impact-card p,
  .pd-impact-card blockquote {
    color: rgba(255,255,255,0.74);
  }

  .pd-impact-card blockquote {
    margin-top: 20px;
    padding-left: 16px;
    border-left: 3px solid #E9C46A;
    font-style: italic;
  }

  .pd-materials {
    display: grid;
    gap: 4px;
    margin-top: 22px;
    padding-top: 18px;
    border-top: 1px solid rgba(26,16,8,0.08);
  }

  .pd-materials strong {
    color: #1a1008;
    font-size: 13px;
  }

  .pd-materials span {
    color: #8c7b6f;
    font-size: 14px;
  }

  .pd-reviews-section,
  .pd-related-section {
    margin-top: 82px;
  }

  .pd-section-top {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 18px;
    margin-bottom: 24px;
  }

  .pd-section-top > span,
  .pd-section-top > a {
    color: #E76F51;
    font-size: 13px;
    font-weight: 800;
    text-decoration: none;
  }

  .pd-rating-summary {
    display: grid;
    grid-template-columns: 180px 1fr;
    gap: 24px;
    align-items: center;
    margin-bottom: 24px;
    padding: 22px;
    box-shadow: none;
  }

  .pd-rating-summary > div:first-child {
    display: grid;
    gap: 6px;
    justify-items: center;
    text-align: center;
    border-right: 1px solid rgba(26,16,8,0.08);
    padding-right: 24px;
  }

  .pd-rating-summary strong {
    color: #E76F51;
    font-family: "Playfair Display", serif;
    font-size: 50px;
    line-height: 1;
  }

  .pd-rating-summary span,
  .pd-rating-bars span,
  .pd-rating-bars em {
    color: #8c7b6f;
    font-size: 12px;
    font-style: normal;
    font-weight: 700;
  }

  .pd-rating-bars {
    display: grid;
    gap: 7px;
  }

  .pd-rating-bars > div {
    display: grid;
    grid-template-columns: 18px 1fr 24px;
    gap: 9px;
    align-items: center;
  }

  .pd-rating-bars div div {
    height: 7px;
    overflow: hidden;
    border-radius: 999px;
    background: #f0e8e0;
  }

  .pd-rating-bars i {
    display: block;
    height: 100%;
    border-radius: 999px;
    background: #E9C46A;
  }

  .pd-reviews-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 380px;
    gap: 28px;
    align-items: start;
  }

  .pd-review-list {
    display: grid;
    gap: 14px;
  }

  .pd-review-card {
    padding: 22px;
    box-shadow: none;
  }

  .pd-review-head {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 12px;
    align-items: center;
    margin-bottom: 14px;
  }

  .pd-avatar {
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

  .pd-review-person strong,
  .pd-review-person span,
  .pd-review-rating span {
    display: block;
  }

  .pd-review-person strong {
    color: #1a1008;
    font-size: 14px;
  }

  .pd-review-person span,
  .pd-review-rating span {
    color: #9a8a7a;
    font-size: 12px;
  }

  .pd-review-rating {
    display: grid;
    justify-items: end;
    gap: 3px;
  }

  .pd-review-card p {
    margin: 0;
    color: #6b5a4e;
    font-size: 15px;
    line-height: 1.7;
  }

  .pd-review-card img {
    max-height: 220px;
    margin-top: 14px;
    border-radius: 12px;
  }

  .pd-review-form-card,
  .pd-empty-card {
    padding: 24px;
    box-shadow: none;
  }

  .pd-review-form-card {
    position: sticky;
    top: 92px;
    display: grid;
    gap: 14px;
  }

  .pd-review-form-card h3,
  .pd-empty-card h3 {
    margin: 0;
    color: #1a1008;
    font-family: "Playfair Display", serif;
    font-size: 24px;
    letter-spacing: -0.03em;
  }

  .pd-review-form-card label {
    color: #1a1008;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .pd-star-picker {
    display: flex;
    gap: 4px;
  }

  .pd-star-picker button {
    width: 34px;
    height: 34px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 0;
    background: transparent;
    color: #f0e8e0;
    cursor: pointer;
    padding: 0;
  }

  .pd-star-picker button svg {
    fill: currentColor;
  }

  .pd-star-picker .pd-star-active {
    color: #E9C46A;
  }

  .pd-rating-label,
  .pd-review-form-card small {
    color: #9a8a7a;
    font-size: 12px;
  }

  .pd-review-form-card textarea {
    width: 100%;
    min-height: 130px;
    resize: vertical;
    border: 1px solid rgba(26,16,8,0.1);
    border-radius: 12px;
    padding: 13px 14px;
    background: #fff;
    color: #1a1008;
    font-family: system-ui, sans-serif;
    font-size: 14px;
    line-height: 1.6;
    outline: none;
  }

  .pd-review-gate .pd-primary-link {
    width: fit-content;
    margin-top: 16px;
  }

  .pd-related-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 22px;
  }

  .pd-related-card {
    display: block;
    overflow: hidden;
    color: inherit;
    text-decoration: none;
    transition: transform 0.18s ease, box-shadow 0.18s ease;
  }

  .pd-related-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 24px 60px rgba(26,16,8,0.12);
  }

  .pd-related-media {
    position: relative;
    aspect-ratio: 4 / 3;
    background: #f6efe7;
  }

  .pd-related-media span {
    position: absolute;
    left: 12px;
    bottom: 12px;
    border-radius: 999px;
    padding: 6px 9px;
    background: rgba(255,255,255,0.92);
    color: #20786f;
    font-size: 11px;
    font-weight: 800;
  }

  .pd-related-body {
    padding: 17px 18px 18px;
  }

  .pd-related-body p {
    margin: 0 0 7px;
    color: #2A9D8F;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .pd-related-body h3 {
    min-height: 43px;
    margin: 0 0 12px;
    color: #1a1008;
    font-family: "Playfair Display", serif;
    font-size: 18px;
    line-height: 1.2;
    letter-spacing: -0.025em;
  }

  .pd-related-body strong {
    color: #E76F51;
    font-family: "Playfair Display", serif;
    font-size: 21px;
  }

  .pd-mobile-cta {
    display: none;
  }

  .pd-not-found {
    width: min(520px, calc(100% - 32px));
    min-height: 70vh;
    margin: 0 auto;
    padding: 120px 28px 48px;
    text-align: center;
    box-shadow: none;
  }

  .pd-not-found .pd-image-fallback {
    width: 90px;
    height: 90px;
    min-height: 0;
    margin: 0 auto 18px;
    border-radius: 18px;
    overflow: hidden;
  }

  .pd-not-found h1 {
    font-size: 34px;
  }

  .pd-not-found .pd-primary-link {
    width: fit-content;
    margin-top: 22px;
  }

  .pd-loading {
    display: grid;
    grid-template-columns: minmax(0, 1.08fr) minmax(380px, 0.92fr);
    gap: 42px;
  }

  .pd-skeleton-media {
    aspect-ratio: 4 / 3;
    background: linear-gradient(90deg, #f0e8e0, #faf6f2, #f0e8e0);
    background-size: 240% 100%;
    animation: pdPulse 1.35s ease-in-out infinite;
  }

  .pd-skeleton-stack {
    display: grid;
    align-content: start;
    gap: 16px;
    padding: 28px;
    box-shadow: none;
  }

  .pd-skeleton-stack span,
  .pd-skeleton-stack strong,
  .pd-skeleton-stack p,
  .pd-skeleton-stack em,
  .pd-skeleton-stack div {
    display: block;
    height: 14px;
    border-radius: 999px;
    background: linear-gradient(90deg, #f0e8e0, #faf6f2, #f0e8e0);
    background-size: 240% 100%;
    animation: pdPulse 1.35s ease-in-out infinite;
  }

  .pd-skeleton-stack span { width: 34%; }
  .pd-skeleton-stack strong { width: 82%; height: 42px; }
  .pd-skeleton-stack p { width: 62%; }
  .pd-skeleton-stack em { width: 40%; height: 48px; }
  .pd-skeleton-stack div { width: 100%; height: 54px; }

  @keyframes pdPulse {
    0% { background-position: 100% 0; }
    100% { background-position: -100% 0; }
  }

  @media (max-width: 980px) {
    .pd-container {
      width: min(100% - 32px, 760px);
      padding-top: 92px;
    }

    .pd-hero,
    .pd-story-grid,
    .pd-reviews-grid,
    .pd-loading {
      grid-template-columns: 1fr;
    }

    .pd-gallery,
    .pd-review-form-card {
      position: static;
    }

    .pd-related-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 620px) {
    .pd-container {
      width: min(100% - 28px, 520px);
      padding-top: 88px;
      padding-bottom: 104px;
    }

    .pd-breadcrumb {
      margin-bottom: 18px;
    }

    .pd-hero {
      gap: 24px;
    }

    .pd-purchase-panel,
    .pd-story-card,
    .pd-impact-card,
    .pd-review-form-card,
    .pd-empty-card,
    .pd-rating-summary {
      padding: 20px;
    }

    .pd-purchase-panel h1 {
      font-size: 34px;
    }

    .pd-price-row strong {
      font-size: 36px;
    }

    .pd-thumbnails {
      display: flex;
      overflow-x: auto;
      padding-bottom: 4px;
    }

    .pd-thumb {
      width: 68px;
      flex: 0 0 68px;
    }

    .pd-coop-card {
      grid-template-columns: auto minmax(0, 1fr);
    }

    .pd-coop-card em {
      grid-column: 2;
    }

    .pd-section-top,
    .pd-rating-summary {
      align-items: start;
      grid-template-columns: 1fr;
      flex-direction: column;
    }

    .pd-rating-summary > div:first-child {
      justify-items: start;
      text-align: left;
      border-right: 0;
      border-bottom: 1px solid rgba(26,16,8,0.08);
      padding-right: 0;
      padding-bottom: 18px;
    }

    .pd-review-head {
      grid-template-columns: auto 1fr;
    }

    .pd-review-rating {
      grid-column: 1 / -1;
      justify-items: start;
    }

    .pd-related-grid {
      grid-template-columns: 1fr;
    }

    .pd-mobile-cta {
      position: fixed;
      left: 12px;
      right: 12px;
      bottom: 12px;
      z-index: 80;
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 12px;
      align-items: center;
      padding: 12px;
      border: 1px solid rgba(26,16,8,0.12);
      border-radius: 16px;
      background: rgba(255,252,248,0.94);
      box-shadow: 0 18px 48px rgba(26,16,8,0.18);
      backdrop-filter: blur(14px);
    }

    .pd-mobile-cta span,
    .pd-mobile-cta small {
      display: block;
    }

    .pd-mobile-cta span {
      color: #E76F51;
      font-family: "Playfair Display", serif;
      font-size: 21px;
      font-weight: 800;
      line-height: 1;
    }

    .pd-mobile-cta small {
      margin-top: 3px;
      color: #7b6a5e;
      font-size: 11px;
      font-weight: 800;
    }

    .pd-mobile-cta button {
      width: auto;
      min-height: 44px;
      white-space: nowrap;
    }
  }
`;
