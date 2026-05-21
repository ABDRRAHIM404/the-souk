import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import type { Product } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { productService } from "@/services/productService";
import toast from "react-hot-toast";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProductCardProps {
  product: Product;
  /** If provided, the heart renders in the filled state on mount */
  initialWishlisted?: boolean;
  /** Called after a successful wishlist toggle so parents can sync state */
  onWishlistChange?: (productId: string, wishlisted: boolean) => void;
  /** 'grid' (default) | 'list' — list shows a horizontal layout */
  layout?: "grid" | "list";
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(price: number): string {
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    maximumFractionDigits: 0,
  }).format(price);
}

function StarRating({ rating, count }: { rating?: number; count?: number }) {
  if (!rating) return null;
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;

  return (
    <span className="flex items-center gap-1">
      <span className="flex">
        {Array.from({ length: 5 }, (_, i) => {
          const filled = i < full;
          const isHalf = !filled && i === full && half;
          return (
            <svg
              key={i}
              viewBox="0 0 16 16"
              className="w-3.5 h-3.5"
              fill={filled ? "#E9C46A" : isHalf ? "url(#half)" : "none"}
              stroke="#E9C46A"
              strokeWidth="1.5"
            >
              {isHalf && (
                <defs>
                  <linearGradient id="half">
                    <stop offset="50%" stopColor="#E9C46A" />
                    <stop offset="50%" stopColor="transparent" />
                  </linearGradient>
                </defs>
              )}
              <polygon points="8,1 10.2,5.6 15.4,6.4 11.7,10 12.6,15.2 8,12.8 3.4,15.2 4.3,10 0.6,6.4 5.8,5.6" />
            </svg>
          );
        })}
      </span>
      {count !== undefined && (
        <span className="text-xs" style={{ color: "#9a8a7a" }}>
          ({count})
        </span>
      )}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Heart / Wishlist Button
// ---------------------------------------------------------------------------

interface HeartButtonProps {
  productId: string;
  initialWishlisted: boolean;
  onWishlistChange?: (productId: string, wishlisted: boolean) => void;
}

function HeartButton({
  productId,
  initialWishlisted,
  onWishlistChange,
}: HeartButtonProps) {
  const { user } = useAuth();
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [loading, setLoading] = useState(false);

  const handleToggle = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault(); // don't navigate to product page
      e.stopPropagation();

      if (!user) {
        toast.error("Sign in to save items to your wishlist");
        return;
      }
      if (user.role !== "tourist") {
        // Cooperatives don't have wishlists
        return;
      }
      if (loading) return;

      // Optimistic update
      const next = !wishlisted;
      setWishlisted(next);
      setLoading(true);

      try {
        if (next) {
          await productService.addToWishlist(productId);
          toast.success("Added to wishlist");
        } else {
          await productService.removeFromWishlist(productId);
          toast.success("Removed from wishlist");
        }
        onWishlistChange?.(productId, next);
      } catch {
        // Roll back on failure
        setWishlisted(!next);
        toast.error("Couldn't update wishlist — please try again");
      } finally {
        setLoading(false);
      }
    },
    [user, loading, wishlisted, productId, onWishlistChange]
  );

  // Don't render heart for coop owners or unauthenticated (render greyed out
  // for unauthenticated so layout is consistent — clicking prompts sign-in)
  if (user?.role === "coop_owner") return null;

  return (
    <button
      onClick={handleToggle}
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={wishlisted}
      disabled={loading}
      style={{
        position: "absolute",
        top: "12px",
        right: "12px",
        zIndex: 10,
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        border: "none",
        cursor: loading ? "wait" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(255,252,248,0.92)",
        backdropFilter: "blur(6px)",
        boxShadow: "0 2px 10px rgba(0,0,0,0.12)",
        transition: "transform 0.15s ease, background 0.15s ease",
        transform: loading ? "scale(0.9)" : "scale(1)",
      }}
      onMouseEnter={(e) => {
        if (!loading) (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.12)";
      }}
      onMouseLeave={(e) => {
        if (!loading) (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
      }}
    >
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill={wishlisted ? "#E76F51" : "none"}
        stroke={wishlisted ? "#E76F51" : "#9a8a7a"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          transition: "fill 0.2s ease, stroke 0.2s ease",
          transform: wishlisted ? "scale(1.1)" : "scale(1)",
        }}
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Fair-Trade Badge
// ---------------------------------------------------------------------------

function FairTradeBadge() {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        fontSize: "10px",
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: "#2A9D8F",
        background: "rgba(42,157,143,0.10)",
        border: "1px solid rgba(42,157,143,0.25)",
        borderRadius: "50px",
        padding: "2px 8px",
      }}
    >
      <svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="#2A9D8F" strokeWidth="2">
        <path d="M8 1l1.8 4.6L14.8 6l-3.4 3.3.8 4.7L8 11.6l-4.2 2.4.8-4.7L1.2 6l4.9-.4z" />
      </svg>
      Fair Trade
    </span>
  );
}

// ---------------------------------------------------------------------------
// Add to Cart Button
// ---------------------------------------------------------------------------

function AddToCartButton({ product }: { product: Product }) {
  const { user } = useAuth();
  const { addItem } = useCart();

  // Don't show for coop owners
  if (user?.role === "coop_owner") return null;

  const outOfStock = product.stock !== undefined && product.stock === 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error("Sign in to add items to your cart");
      return;
    }
    if (outOfStock) return;

    addItem({
      productId: product._id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: Array.isArray(product.images) ? product.images[0] : undefined,
      cooperativeId:
        typeof product.cooperative === "string"
          ? product.cooperative
          : (product.cooperative as { _id: string })._id,
      cooperativeName:
        typeof product.cooperative === "string"
          ? ""
          : (product.cooperative as { name: string }).name,
    });
    toast.success("Added to cart");
  };

  return (
    <button
      onClick={handleAddToCart}
      disabled={outOfStock}
      style={{
        width: "100%",
        marginTop: "12px",
        padding: "9px 0",
        borderRadius: "50px",
        border: "none",
        cursor: outOfStock ? "not-allowed" : "pointer",
        background: outOfStock ? "#f0e8e0" : "#1a1008",
        color: outOfStock ? "#9a8a7a" : "#fff",
        fontSize: "12px",
        fontWeight: 700,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        transition: "background 0.2s ease",
      }}
      onMouseEnter={(e) => {
        if (!outOfStock)
          (e.currentTarget as HTMLButtonElement).style.background = "#E76F51";
      }}
      onMouseLeave={(e) => {
        if (!outOfStock)
          (e.currentTarget as HTMLButtonElement).style.background = "#1a1008";
      }}
    >
      {outOfStock ? "Out of Stock" : "Add to Cart"}
    </button>
  );
}



function ProductCardGrid({
  product,
  initialWishlisted,
  onWishlistChange,
  className = "",
}: Omit<ProductCardProps, "layout">) {
  const imageUrl = Array.isArray(product.images)
    ? product.images[0]
    : (product as Product & { image?: string }).image;

  return (
    <Link
      to={`/products/${product._id}`}
      className={className}
      style={{
        display: "block",
        textDecoration: "none",
        borderRadius: "20px",
        background: "#FFFCF8",
        border: "1px solid #f0e8e0",
        boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
        overflow: "hidden",
        position: "relative",
        transition: "transform 0.22s ease, box-shadow 0.22s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-4px)";
        (e.currentTarget as HTMLAnchorElement).style.boxShadow =
          "0 12px 36px rgba(0,0,0,0.11)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLAnchorElement).style.boxShadow =
          "0 4px 24px rgba(0,0,0,0.06)";
      }}
    >
      {/* Image */}
      <div style={{ position: "relative", aspectRatio: "4/3", overflow: "hidden", background: "#f5ede6" }}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            loading="lazy"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transition: "transform 0.4s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLImageElement).style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLImageElement).style.transform = "scale(1)";
            }}
          />
        ) : (
          // Placeholder — Amazigh diamond motif
          <svg
            viewBox="0 0 200 150"
            width="100%"
            height="100%"
            style={{ display: "block" }}
          >
            <rect width="200" height="150" fill="#f5ede6" />
            {[40, 100, 160].map((cx, i) =>
              [40, 100].map((cy, j) => (
                <polygon
                  key={`${i}-${j}`}
                  points={`${cx},${cy - 18} ${cx + 14},${cy} ${cx},${cy + 18} ${cx - 14},${cy}`}
                  fill="none"
                  stroke="#E76F51"
                  strokeWidth="1.5"
                  opacity="0.35"
                />
              ))
            )}
          </svg>
        )}

        {/* Heart */}
        <HeartButton
          productId={product._id}
          initialWishlisted={initialWishlisted ?? false}
          onWishlistChange={onWishlistChange}
        />

        {/* Fair-trade overlay badge */}
        {(product.fairTradeCertified || product.isFairTrade) && (
          <div style={{ position: "absolute", bottom: "10px", left: "10px" }}>
            <FairTradeBadge />
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "16px 18px 18px" }}>
        {/* Cooperative name */}
        {product.cooperative && (
          <p
            style={{
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              color: "#2A9D8F",
              marginBottom: "4px",
            }}
          >
            {typeof product.cooperative === "string"
              ? product.cooperative
              : (product.cooperative as { name: string }).name}
          </p>
        )}

        {/* Product name */}
        <h3
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "16px",
            fontWeight: 700,
            color: "#1a1008",
            lineHeight: 1.3,
            marginBottom: "8px",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {product.name}
        </h3>

        {/* Rating */}
        {product.rating !== undefined && (
          <div style={{ marginBottom: "10px" }}>
            <StarRating rating={product.rating} count={product.reviewCount} />
          </div>
        )}

        {/* Price row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
          <span
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "18px",
              fontWeight: 800,
              color: "#E76F51",
              letterSpacing: "-0.02em",
            }}
          >
            {formatPrice(product.price)}
          </span>

          {/* Stock indicator */}
          {product.stock !== undefined && product.stock <= 5 && product.stock > 0 && (
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "#c85a2a",
                background: "rgba(231,111,81,0.10)",
                borderRadius: "50px",
                padding: "2px 8px",
              }}
            >
              Only {product.stock} left
            </span>
          )}
          {product.stock === 0 && (
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "#9a8a7a",
                background: "#f0e8e0",
                borderRadius: "50px",
                padding: "2px 8px",
              }}
            >
              Out of stock
            </span>
          )}
        </div>

        <AddToCartButton product={product} />
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// ProductCard — List Layout
// ---------------------------------------------------------------------------

function ProductCardList({
  product,
  initialWishlisted,
  onWishlistChange,
  className = "",
}: Omit<ProductCardProps, "layout">) {
  const imageUrl = Array.isArray(product.images) ? product.images[0] : undefined;

  return (
    <Link
      to={`/products/${product._id}`}
      className={className}
      style={{
        display: "flex",
        gap: "16px",
        textDecoration: "none",
        borderRadius: "16px",
        background: "#FFFCF8",
        border: "1px solid #f0e8e0",
        boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
        overflow: "hidden",
        position: "relative",
        transition: "box-shadow 0.2s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 6px 24px rgba(0,0,0,0.10)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.05)";
      }}
    >
      {/* Thumbnail */}
      <div
        style={{
          position: "relative",
          flexShrink: 0,
          width: "120px",
          background: "#f5ede6",
          overflow: "hidden",
        }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <svg viewBox="0 0 120 120" width="120" height="120">
            <rect width="120" height="120" fill="#f5ede6" />
            <polygon
              points="60,20 80,60 60,100 40,60"
              fill="none"
              stroke="#E76F51"
              strokeWidth="1.5"
              opacity="0.35"
            />
          </svg>
        )}
        <HeartButton
          productId={product._id}
          initialWishlisted={initialWishlisted ?? false}
          onWishlistChange={onWishlistChange}
        />
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: "14px 16px 14px 0", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          {product.cooperative && (
            <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#2A9D8F", marginBottom: "2px" }}>
              {typeof product.cooperative === "string"
                ? product.cooperative
                : (product.cooperative as { name: string }).name}
            </p>
          )}
          <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "15px", fontWeight: 700, color: "#1a1008", marginBottom: "6px" }}>
            {product.name}
          </h3>
          <StarRating rating={product.rating} count={product.reviewCount} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px" }}>
          <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "17px", fontWeight: 800, color: "#E76F51" }}>
            {formatPrice(product.price)}
          </span>
          {(product.fairTradeCertified || product.isFairTrade) && <FairTradeBadge />}
        </div>
        <AddToCartButton product={product} />
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Public export
// ---------------------------------------------------------------------------

export default function ProductCard({
  layout = "grid",
  ...props
}: ProductCardProps) {
  if (layout === "list") return <ProductCardList {...props} />;
  return <ProductCardGrid {...props} />;
}