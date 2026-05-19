import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FadeSection from "@/components/FadeSection";
import { productService } from "@/services/productService";
import { coopService } from "@/services/coopService";
import type { Product, Cooperative, Review } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import api from "@/services/api";
import toast from "react-hot-toast";

// ── Styles ─────────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: "#1a1008",
  marginBottom: 10,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const sectionHeadingStyle: React.CSSProperties = {
  fontFamily: '"Playfair Display", serif',
  fontSize: 28,
  fontWeight: 700,
  color: "#1a1008",
  marginBottom: 24,
  letterSpacing: "-0.03em",
};

// ── Star Rating (display) ──────────────────────────────────────────────────

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          style={{ color: s <= rating ? "#E9C46A" : "#f0e8e0", fontSize: size, lineHeight: 1 }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

// ── Star Picker (interactive) ──────────────────────────────────────────────

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          onClick={() => onChange(s)}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          style={{
            fontSize: 32,
            cursor: "pointer",
            color: s <= (hovered || value) ? "#E9C46A" : "#f0e8e0",
            transition: "color 0.15s ease",
            userSelect: "none",
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

// ── Review Card ────────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: Review }) {
  const reviewer = typeof review.reviewer === "object" ? review.reviewer : null;

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        border: "1px solid #f0e8e0",
        padding: "24px 28px",
        marginBottom: 16,
        transition: "box-shadow 0.2s ease",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #E76F51, #E9C46A)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 18,
            flexShrink: 0,
          }}
        >
          {reviewer ? reviewer.name.charAt(0).toUpperCase() : "?"}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, color: "#1a1008", fontSize: 15, marginBottom: 2 }}>
            {reviewer?.name ?? "Anonymous"}
          </div>
          <div style={{ fontSize: 12, color: "#9a8a7a" }}>
            {new Date(review.createdAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          <StarRating rating={review.rating} size={15} />
          <span style={{ fontSize: 12, color: "#9a8a7a" }}>{review.rating}/5</span>
        </div>
      </div>

      {/* Comment */}
      <p
        style={{
          color: "#6b5a4e",
          lineHeight: 1.75,
          fontSize: 15,
          fontStyle: "italic",
          borderLeft: "3px solid #f0e8e0",
          paddingLeft: 14,
          margin: 0,
        }}
      >
        {review.comment}
      </p>

      {/* Photo */}
      {review.photo && (
        <img
          src={`http://localhost:5000${review.photo}`}
          alt="Purchase photo"
          style={{
            marginTop: 14,
            width: "100%",
            maxHeight: 220,
            objectFit: "cover",
            borderRadius: 12,
            border: "1px solid #f0e8e0",
          }}
        />
      )}
    </div>
  );
}

// ── Related Product Card ───────────────────────────────────────────────────

function RelatedCard({ product }: { product: Product }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link to={`/products/${product._id}`} style={{ textDecoration: "none" }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: "#fff",
          borderRadius: 20,
          border: "1px solid #f0e8e0",
          overflow: "hidden",
          boxShadow: hovered ? "0 12px 40px rgba(0,0,0,0.13)" : "0 4px 24px rgba(0,0,0,0.06)",
          transform: hovered ? "translateY(-4px)" : "translateY(0)",
          transition: "all 0.25s ease",
          cursor: "pointer",
        }}
      >
        <div
          style={{
            height: 180,
            background: product.images[0]
              ? `url(http://localhost:5000${product.images[0]}) center/cover no-repeat`
              : "linear-gradient(135deg, #f0e8e0, #E9C46A22)",
          }}
        />
        <div style={{ padding: "16px 20px 20px" }}>
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#9a8a7a", marginBottom: 6 }}>
            {product.category} · {product.origin}
          </p>
          <h4
            style={{
              fontFamily: '"Playfair Display", serif',
              fontSize: 17,
              fontWeight: 700,
              color: "#1a1008",
              marginBottom: 10,
              lineHeight: 1.3,
            }}
          >
            {product.name}
          </h4>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: '"Playfair Display", serif', fontWeight: 800, fontSize: 20, color: "#E76F51" }}>
              {product.price} MAD
            </span>
            {product.fairTradeCertified && (
              <span style={{ fontSize: 11, color: "#2A9D8F", fontWeight: 600, background: "rgba(42,157,143,0.1)", padding: "3px 10px", borderRadius: 50 }}>
                Fair Trade
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [coop, setCoop] = useState<Cooperative | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [related, setRelated] = useState<Product[]>([]);
  const [activeImage, setActiveImage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Review form
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Wishlist
  const [wishlisted, setWishlisted] = useState(false);

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

        const coopId = typeof p.cooperative === "object" ? p.cooperative._id : p.cooperative;
        const c = await coopService.getById(coopId);
        if (controller.signal.aborted) return;
        setCoop(c);

        const { data: revData } = await api.get<{ data: Review[] }>(`/products/${id}/reviews`);
        if (controller.signal.aborted) return;
        setReviews(revData.data);

        const relRes = await productService.getAll({ limit: 4 });
        if (controller.signal.aborted) return;
        setRelated(relRes.data.filter((r) => r._id !== id).slice(0, 3));
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
    if (rating === 0) { toast.error("Please select a star rating"); return; }
    if (comment.trim().length < 10) { toast.error("Comment must be at least 10 characters"); return; }
    setSubmitting(true);
    try {
      await api.post(`/products/${id}/reviews`, { rating, comment });
      toast.success("Review posted!");
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

  const toggleWishlist = async () => {
    if (!user) { toast.error("Log in to save to wishlist"); return; }
    setWishlisted((w) => !w);
    toast.success(wishlisted ? "Removed from wishlist" : "Added to wishlist");
  };

  // ── Loading state ──────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#FFFCF8",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                border: "4px solid #E76F51",
                borderTopColor: "transparent",
                animation: "spin 0.8s linear infinite",
                margin: "0 auto 16px",
              }}
            />
            <p style={{ color: "#9a8a7a", fontSize: 14 }}>Loading product…</p>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </>
    );
  }

  // ── Not found state ────────────────────────────────────────────────────

  if (!product) {
    return (
      <>
        <Navbar />
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 16,
            background: "#FFFCF8",
          }}
        >
          <div style={{ fontSize: 56 }}>🏺</div>
          <h2
            style={{
              fontFamily: '"Playfair Display", serif',
              fontSize: 32,
              color: "#1a1008",
              letterSpacing: "-0.04em",
            }}
          >
            Product not found
          </h2>
          <p style={{ color: "#9a8a7a", fontSize: 15 }}>
            This product may have been removed or is no longer available.
          </p>
          <Link to="/marketplace" className="btn btn-primary">
            Back to Marketplace
          </Link>
        </div>
      </>
    );
  }

  // ── Derived values ─────────────────────────────────────────────────────

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

  const coopName =
    typeof product.cooperative === "object"
      ? product.cooperative.name
      : coop?.name ?? "Cooperative";

  const coopId =
    typeof product.cooperative === "object"
      ? product.cooperative._id
      : product.cooperative;

  const contactSubject = encodeURIComponent(`Inquiry about ${product.name} — The Souk`);
  const contactBody = encodeURIComponent(
    `Hello,\n\nI found your product "${product.name}" on The Souk marketplace and I would like to know more.\n\nThank you.`
  );

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div style={{ background: "#FFFCF8", minHeight: "100vh" }}>
      <Navbar />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 24px 80px" }}>

        {/* Breadcrumb */}
        <nav style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 40, fontSize: 13, color: "#9a8a7a" }}>
          <Link to="/" style={{ color: "#9a8a7a", textDecoration: "none" }}>Home</Link>
          <span>{"›"}</span>
          <Link to="/marketplace" style={{ color: "#9a8a7a", textDecoration: "none" }}>Marketplace</Link>
          <span>{"›"}</span>
          <Link
            to={`/marketplace?category=${product.category}`}
            style={{ color: "#9a8a7a", textDecoration: "none", textTransform: "capitalize" }}
          >
            {product.category}
          </Link>
          <span>{"›"}</span>
          <span style={{ color: "#1a1008", fontWeight: 500 }}>{product.name}</span>
        </nav>

        {/* ── Main 2-col grid ── */}
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, marginBottom: 96 }}
          className="product-detail-grid"
        >

          {/* Left: Image Gallery */}
          <FadeSection>
            <div>
              {/* Main image */}
              <div
                style={{
                  borderRadius: 24,
                  overflow: "hidden",
                  background: product.images[activeImage]
                    ? `url(http://localhost:5000${product.images[activeImage]}) center/cover no-repeat`
                    : "linear-gradient(135deg, #f0e8e0 0%, #E9C46A22 100%)",
                  height: 480,
                  marginBottom: 14,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                  position: "relative",
                }}
              >
                {/* Badges on image */}
                <div style={{ position: "absolute", top: 16, left: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                  {product.fairTradeCertified && (
                    <span style={{ background: "rgba(42,157,143,0.92)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 50, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      ✓ Fair Trade
                    </span>
                  )}
                  {!product.isAvailable && (
                    <span style={{ background: "rgba(0,0,0,0.7)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 50 }}>
                      Out of stock
                    </span>
                  )}
                </div>

                {/* Wishlist button */}
                <button
                  onClick={toggleWishlist}
                  style={{
                    position: "absolute",
                    top: 16,
                    right: 16,
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: wishlisted ? "#E76F51" : "rgba(255,255,255,0.9)",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 18,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                    transition: "all 0.2s ease",
                  }}
                >
                  {wishlisted ? "❤️" : "🤍"}
                </button>
              </div>

              {/* Thumbnails */}
              {product.images.length > 1 && (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {product.images.map((img, i) => (
                    <div
                      key={i}
                      onClick={() => setActiveImage(i)}
                      style={{
                        width: 76,
                        height: 76,
                        borderRadius: 14,
                        border: `2px solid ${i === activeImage ? "#E76F51" : "#f0e8e0"}`,
                        background: `url(http://localhost:5000${img}) center/cover no-repeat`,
                        cursor: "pointer",
                        flexShrink: 0,
                        transition: "border-color 0.2s ease",
                        boxShadow: i === activeImage ? "0 0 0 3px rgba(231,111,81,0.15)" : "none",
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Origin tag */}
              <div
                style={{
                  marginTop: 20,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "rgba(233,196,106,0.15)",
                  border: "1px solid rgba(233,196,106,0.3)",
                  borderRadius: 50,
                  padding: "8px 16px",
                  fontSize: 13,
                  color: "#a07c00",
                  fontWeight: 600,
                }}
              >
                📍 {product.origin}
              </div>
            </div>
          </FadeSection>

          {/* Right: Product Info */}
          <FadeSection delay={120}>
            <div style={{ paddingTop: 8 }}>

              {/* Category label */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    color: "#E76F51",
                    background: "rgba(231,111,81,0.08)",
                    padding: "4px 12px",
                    borderRadius: 50,
                  }}
                >
                  {product.category}
                </span>
              </div>

              {/* Product name */}
              <h1
                style={{
                  fontFamily: '"Playfair Display", serif',
                  fontSize: "clamp(30px, 4vw, 44px)",
                  fontWeight: 800,
                  color: "#1a1008",
                  letterSpacing: "-0.04em",
                  lineHeight: 1.15,
                  marginBottom: 18,
                }}
              >
                {product.name}
              </h1>

              {/* Rating summary */}
              {reviews.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24, paddingBottom: 24, borderBottom: "1px solid #f0e8e0" }}>
                  <StarRating rating={Math.round(avgRating)} size={20} />
                  <span style={{ fontSize: 15, fontWeight: 600, color: "#1a1008" }}>
                    {avgRating.toFixed(1)}
                  </span>
                  <span style={{ fontSize: 14, color: "#9a8a7a" }}>
                    ({reviews.length} review{reviews.length !== 1 ? "s" : ""})
                  </span>
                </div>
              )}

              {/* Price block */}
              <div
                style={{
                  background: "linear-gradient(135deg, rgba(231,111,81,0.06), rgba(233,196,106,0.04))",
                  border: "1px solid rgba(231,111,81,0.18)",
                  borderRadius: 20,
                  padding: "24px 28px",
                  marginBottom: 24,
                }}
              >
                <div
                  style={{
                    fontFamily: '"Playfair Display", serif',
                    fontWeight: 800,
                    fontSize: 48,
                    color: "#E76F51",
                    lineHeight: 1,
                    marginBottom: 8,
                  }}
                >
                  {product.price} MAD
                </div>
                <p style={{ fontSize: 13, color: "#9a8a7a", fontStyle: "italic", margin: 0 }}>
                  Fixed fair-trade price. No haggling, ever.
                </p>
              </div>

              {/* Fair trade badge */}
              {product.fairTradeCertified && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    background: "rgba(42,157,143,0.08)",
                    border: "1px solid rgba(42,157,143,0.2)",
                    color: "#2A9D8F",
                    borderRadius: 50,
                    padding: "9px 18px",
                    fontSize: 13,
                    fontWeight: 700,
                    marginBottom: 20,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  ✓ Fair Trade Certified
                </div>
              )}

              {/* Impact statement */}
              <div
                style={{
                  background: "rgba(233,196,106,0.1)",
                  border: "1px solid rgba(233,196,106,0.25)",
                  borderRadius: 14,
                  padding: "16px 20px",
                  marginBottom: 28,
                  fontSize: 14,
                  color: "#6b5a4e",
                  lineHeight: 1.7,
                }}
              >
                {"💛 "}
                <strong style={{ color: "#1a1008" }}>88% of this purchase</strong>
                {" goes directly to "}
                <strong style={{ color: "#1a1008" }}>{coopName}</strong>
                {". Transparent 12% platform fee."}
              </div>

              {/* Description */}
              <p style={{ color: "#6b5a4e", lineHeight: 1.85, fontSize: 15, marginBottom: 28 }}>
                {product.description}
              </p>

              {/* Stock indicator */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32, padding: "12px 16px", background: "#fff", borderRadius: 12, border: "1px solid #f0e8e0" }}>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: product.stock > 5 ? "#2A9D8F" : product.stock > 0 ? "#E9C46A" : "#e74c3c",
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 14, color: "#6b5a4e", fontWeight: 500 }}>
                  {product.stock > 5
                    ? `${product.stock} in stock`
                    : product.stock > 0
                    ? `Only ${product.stock} left — order soon`
                    : "Currently out of stock"}
                </span>
              </div>

              {/* CTA: Contact cooperative */}
              <a
                href={`mailto:?subject=${contactSubject}&body=${contactBody}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  background: "#E76F51",
                  color: "#fff",
                  borderRadius: 50,
                  padding: "16px 32px",
                  fontWeight: 700,
                  fontSize: 16,
                  textDecoration: "none",
                  marginBottom: 12,
                  boxSizing: "border-box",
                  transition: "background 0.2s ease",
                }}
              >
                ✉ Contact Cooperative
              </a>

              {/* Coop info card */}
              <Link
                to={`/coops/${coopId}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  background: "#fff",
                  border: "1px solid #f0e8e0",
                  borderRadius: 18,
                  padding: "18px 22px",
                  textDecoration: "none",
                  marginTop: 16,
                  transition: "box-shadow 0.2s ease",
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    background: coop?.coverImage
                      ? `url(http://localhost:5000${coop.coverImage}) center/cover no-repeat`
                      : "linear-gradient(135deg, #E76F51, #E9C46A)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                    flexShrink: 0,
                  }}
                >
                  {!coop?.coverImage && "🏺"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: "#1a1008", fontSize: 15, marginBottom: 3 }}>
                    {coopName}
                  </div>
                  {coop && (
                    <div style={{ fontSize: 13, color: "#9a8a7a" }}>
                      {"📍 "}{coop.location.city}, {coop.location.region}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 13, color: "#E76F51", fontWeight: 600 }}>
                  View profile {"→"}
                </div>
              </Link>

            </div>
          </FadeSection>
        </div>

        {/* ── Reviews section ── */}
        <FadeSection>
          <div style={{ marginBottom: 80 }}>
            <h2 style={sectionHeadingStyle}>
              Traveller Reviews
              {reviews.length > 0 && (
                <span style={{ fontSize: 16, fontWeight: 400, color: "#9a8a7a", marginLeft: 12 }}>
                  ({reviews.length})
                </span>
              )}
            </h2>

            {/* Rating overview */}
            {reviews.length > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                  background: "#fff",
                  borderRadius: 16,
                  border: "1px solid #f0e8e0",
                  padding: "20px 28px",
                  marginBottom: 28,
                }}
              >
                <div style={{ textAlign: "center", flexShrink: 0 }}>
                  <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 52, fontWeight: 800, color: "#E76F51", lineHeight: 1 }}>
                    {avgRating.toFixed(1)}
                  </div>
                  <StarRating rating={Math.round(avgRating)} size={18} />
                  <div style={{ fontSize: 12, color: "#9a8a7a", marginTop: 4 }}>
                    {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                  </div>
                </div>
                <div style={{ flex: 1, borderLeft: "1px solid #f0e8e0", paddingLeft: 20 }}>
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = reviews.filter((r) => r.rating === star).length;
                    const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                    return (
                      <div key={star} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: "#9a8a7a", width: 16, textAlign: "right" }}>{star}</span>
                        <span style={{ color: "#E9C46A", fontSize: 12 }}>★</span>
                        <div style={{ flex: 1, height: 6, background: "#f0e8e0", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: "#E9C46A", borderRadius: 3, transition: "width 0.5s ease" }} />
                        </div>
                        <span style={{ fontSize: 12, color: "#9a8a7a", width: 20 }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }}
              className="reviews-grid"
            >
              {/* Review list */}
              <div>
                {reviews.length === 0 ? (
                  <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #f0e8e0", padding: "48px 32px", textAlign: "center" }}>
                    <div style={{ fontSize: 40, marginBottom: 14 }}>✍️</div>
                    <h4 style={{ fontFamily: '"Playfair Display", serif', fontSize: 20, color: "#1a1008", marginBottom: 8 }}>
                      No reviews yet
                    </h4>
                    <p style={{ color: "#9a8a7a", fontSize: 14 }}>
                      Be the first to share your experience with this product.
                    </p>
                  </div>
                ) : (
                  reviews.map((r) => <ReviewCard key={r._id} review={r} />)
                )}
              </div>

              {/* Write a review */}
              <div>
                <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: 22, fontWeight: 700, color: "#1a1008", marginBottom: 20 }}>
                  Share Your Experience
                </h3>

                {!user ? (
                  <div
                    style={{
                      background: "#fff",
                      borderRadius: 20,
                      border: "1px solid #f0e8e0",
                      padding: "40px 32px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: 36, marginBottom: 14 }}>🔒</div>
                    <h4 style={{ fontFamily: '"Playfair Display", serif', fontSize: 18, color: "#1a1008", marginBottom: 8 }}>
                      Login to review
                    </h4>
                    <p style={{ color: "#9a8a7a", fontSize: 14, marginBottom: 20 }}>
                      You must be logged in as a tourist to leave a review.
                    </p>
                    <Link to="/login" className="btn btn-primary">Log in</Link>
                  </div>
                ) : user.role !== "tourist" ? (
                  <div
                    style={{
                      background: "#fff",
                      borderRadius: 20,
                      border: "1px solid #f0e8e0",
                      padding: "40px 32px",
                      textAlign: "center",
                      color: "#9a8a7a",
                    }}
                  >
                    <div style={{ fontSize: 36, marginBottom: 14 }}>🤝</div>
                    <p>Only tourists can leave product reviews.</p>
                  </div>
                ) : (
                  <div
                    style={{
                      background: "#fff",
                      borderRadius: 20,
                      border: "1px solid #f0e8e0",
                      boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
                      padding: "32px 28px",
                    }}
                  >
                    {/* Star picker */}
                    <div style={{ marginBottom: 24 }}>
                      <label style={labelStyle}>Your rating</label>
                      <StarPicker value={rating} onChange={setRating} />
                      {rating > 0 && (
                        <p style={{ fontSize: 13, color: "#9a8a7a", marginTop: 8 }}>
                          {["", "Poor", "Fair", "Good", "Very good", "Excellent"][rating]}
                        </p>
                      )}
                    </div>

                    {/* Comment */}
                    <div style={{ marginBottom: 24 }}>
                      <label style={labelStyle}>Your experience</label>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Share your experience with this product — quality, packaging, communication with the cooperative…"
                        rows={5}
                        style={{
                          width: "100%",
                          borderRadius: 12,
                          border: "1px solid #f0e8e0",
                          padding: "12px 16px",
                          fontSize: 15,
                          color: "#1a1008",
                          background: "#fff",
                          outline: "none",
                          resize: "vertical",
                          fontFamily: "system-ui, sans-serif",
                          boxSizing: "border-box",
                          lineHeight: 1.6,
                        }}
                      />
                      <p style={{ fontSize: 12, color: "#9a8a7a", marginTop: 6 }}>
                        {comment.length} / 10 characters minimum
                      </p>
                    </div>

                    <button
                      onClick={submitReview}
                      disabled={submitting}
                      style={{
                        width: "100%",
                        background: submitting ? "#c9896e" : "#E76F51",
                        color: "#fff",
                        border: "none",
                        borderRadius: 50,
                        padding: "14px 28px",
                        fontSize: 15,
                        fontWeight: 700,
                        cursor: submitting ? "not-allowed" : "pointer",
                        transition: "background 0.2s ease",
                      }}
                    >
                      {submitting ? "Posting review…" : "Post Review"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </FadeSection>

        {/* ── Related products ── */}
        {related.length > 0 && (
          <FadeSection delay={100}>
            <div>
              <h2 style={sectionHeadingStyle}>More from The Souk</h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                  gap: 24,
                }}
              >
                {related.map((p) => (
                  <RelatedCard key={p._id} product={p} />
                ))}
              </div>
              <div style={{ textAlign: "center", marginTop: 40 }}>
                <Link to="/marketplace" className="btn btn-outline">
                  Browse all products
                </Link>
              </div>
            </div>
          </FadeSection>
        )}

      </div>

      <style>{`
        @media (max-width: 900px) {
          .product-detail-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          .reviews-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <Footer />
    </div>
  );
}
