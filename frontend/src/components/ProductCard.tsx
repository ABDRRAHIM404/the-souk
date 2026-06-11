import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import type { Product } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { productService } from "@/services/productService";
import toast from "react-hot-toast";

interface ProductCardProps {
  product: Product;
  initialWishlisted?: boolean;
  onWishlistChange?: (productId: string, wishlisted: boolean) => void;
  layout?: "grid" | "list";
  className?: string;
}

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

  return (
    <span className="flex items-center gap-1">
      <span className="flex gap-0.5" aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => (
          <svg key={i} viewBox="0 0 16 16" className="h-3.5 w-3.5" fill={i < full ? "#E9C46A" : "none"} stroke="#E9C46A" strokeWidth="1.5">
            <polygon points="8,1 10.2,5.6 15.4,6.4 11.7,10 12.6,15.2 8,12.8 3.4,15.2 4.3,10 0.6,6.4 5.8,5.6" />
          </svg>
        ))}
      </span>
      {count !== undefined && <span className="text-xs text-[#9a8a7a]">({count})</span>}
    </span>
  );
}

function ProductPlaceholder() {
  return (
    <svg viewBox="0 0 200 150" width="100%" height="100%" className="block" aria-hidden="true">
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
  );
}

function HeartButton({
  productId,
  initialWishlisted,
  onWishlistChange,
}: {
  productId: string;
  initialWishlisted: boolean;
  onWishlistChange?: (productId: string, wishlisted: boolean) => void;
}) {
  const { user } = useAuth();
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [loading, setLoading] = useState(false);

  const handleToggle = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!user) {
        toast.error("Sign in to save items to your wishlist");
        return;
      }
      if (user.role !== "tourist" || loading) return;

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
        setWishlisted(!next);
        toast.error("Couldn't update wishlist — please try again");
      } finally {
        setLoading(false);
      }
    },
    [user, loading, wishlisted, productId, onWishlistChange]
  );

  if (user?.role === "coop_owner") return null;

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="product-card-wishlist"
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={wishlisted}
      disabled={loading}
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
        aria-hidden="true"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}

function FairTradeBadge() {
  return (
    <span className="ds-badge ds-badge-success">
      <svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M8 1l1.8 4.6L14.8 6l-3.4 3.3.8 4.7L8 11.6l-4.2 2.4.8-4.7L1.2 6l4.9-.4z" />
      </svg>
      Fair Trade
    </span>
  );
}

function AddToCartButton({ product }: { product: Product }) {
  const { user } = useAuth();
  const { addItem } = useCart();

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
      type="button"
      onClick={handleAddToCart}
      disabled={outOfStock}
      className={`ds-btn mt-3 w-full text-xs font-bold uppercase tracking-wide ${
        outOfStock ? "cursor-not-allowed bg-[#f0e8e0] text-[#9a8a7a]" : "ds-btn-primary hover:!bg-[#E76F51]"
      }`}
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
  const coopName =
    product.cooperative && typeof product.cooperative !== "string"
      ? (product.cooperative as { name: string }).name
      : null;

  return (
    <Link to={`/products/${product._id}`} className={`product-card ${className}`}>
      <div className="product-card-media">
        {imageUrl ? (
          <img src={imageUrl} alt={product.name} loading="lazy" />
        ) : (
          <ProductPlaceholder />
        )}
        <HeartButton
          productId={product._id}
          initialWishlisted={initialWishlisted ?? false}
          onWishlistChange={onWishlistChange}
        />
        {(product.fairTradeCertified || product.isFairTrade) && (
          <div className="absolute bottom-2.5 left-2.5">
            <FairTradeBadge />
          </div>
        )}
      </div>

      <div className="product-card-body">
        {coopName && <p className="product-card-co-op">{coopName}</p>}
        <h3 className="product-card-title">{product.name}</h3>

        {product.rating !== undefined && (
          <div className="mb-2.5">
            <StarRating rating={product.rating} count={product.reviewCount} />
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <span className="product-card-price">{formatPrice(product.price)}</span>
          {product.stock !== undefined && product.stock <= 5 && product.stock > 0 && (
            <span className="ds-badge ds-badge-warning">Only {product.stock} left</span>
          )}
          {product.stock === 0 && <span className="ds-badge ds-badge-neutral">Out of stock</span>}
        </div>

        <AddToCartButton product={product} />
      </div>
    </Link>
  );
}

function ProductCardList({
  product,
  initialWishlisted,
  onWishlistChange,
  className = "",
}: Omit<ProductCardProps, "layout">) {
  const imageUrl = Array.isArray(product.images) ? product.images[0] : undefined;
  const coopName =
    product.cooperative && typeof product.cooperative !== "string"
      ? (product.cooperative as { name: string }).name
      : null;

  return (
    <Link to={`/products/${product._id}`} className={`product-card-list relative ${className}`}>
      <div className="relative w-[120px] shrink-0 overflow-hidden bg-[#f5ede6] sm:w-[140px]">
        {imageUrl ? (
          <img src={imageUrl} alt={product.name} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <ProductPlaceholder />
        )}
        <HeartButton
          productId={product._id}
          initialWishlisted={initialWishlisted ?? false}
          onWishlistChange={onWishlistChange}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between py-3.5 pr-4">
        <div>
          {coopName && <p className="product-card-co-op">{coopName}</p>}
          <h3 className="product-card-title !text-[15px] !mb-1.5">{product.name}</h3>
          <StarRating rating={product.rating} count={product.reviewCount} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="product-card-price !text-[17px]">{formatPrice(product.price)}</span>
          {(product.fairTradeCertified || product.isFairTrade) && <FairTradeBadge />}
        </div>
        <AddToCartButton product={product} />
      </div>
    </Link>
  );
}

export default function ProductCard({ layout = "grid", ...props }: ProductCardProps) {
  if (layout === "list") return <ProductCardList {...props} />;
  return <ProductCardGrid {...props} />;
}
