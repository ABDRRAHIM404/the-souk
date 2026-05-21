import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";

/**
 * Returns a Set of product IDs currently in the authenticated tourist's wishlist.
 *
 * Usage:
 *   const { wishlistSet } = useWishlist();
 *   <ProductCard initialWishlisted={wishlistSet.has(product._id)} ... />
 *
 * The hook is intentionally read-only. Mutations (add / remove) are handled
 * directly by ProductCard's HeartButton so it can do optimistic updates without
 * re-fetching the whole user object.
 *
 * If you need to keep a parent's local wishlist state in sync (e.g. on the
 * TouristDashboard where removing an item should collapse the card), pass
 * `onWishlistChange` to ProductCard and update your local state there.
 */
export function useWishlist(): { wishlistSet: Set<string> } {
  const { user } = useAuth();

  const wishlistSet = useMemo(() => {
    if (!user || user.role !== "tourist") return new Set<string>();
    const raw = (user as typeof user & { wishlist?: string[] }).wishlist ?? [];
    return new Set(raw);
  }, [user]);

  return { wishlistSet };
}
