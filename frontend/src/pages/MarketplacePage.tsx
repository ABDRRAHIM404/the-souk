import { useEffect, useState} from "react";
import { useSearchParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FadeSection from "@/components/FadeSection";
import { productService } from "@/services/productService";
import type { Product, ProductFilters, ProductCategory } from "@/types";
import toast from "react-hot-toast";

// ── Filter Bar ─────────────────────────────────────────────────────────────

const CATEGORIES: { value: ProductCategory | ""; label: string }[] = [
  { value: "",         label: "All" },
  { value: "argan",   label: "Argan Oil" },
  { value: "carpets", label: "Carpets" },
  { value: "saffron", label: "Saffron" },
  { value: "pottery", label: "Pottery" },
  { value: "food",    label: "Food & Spices" },
  { value: "leather", label: "Leather" },
  { value: "other",   label: "Other" },
];

const REGIONS = [
  "", "Agadir", "Taghazout", "Tiznit", "Taroudant",
  "Tafraout", "Imsouane", "Taliouine", "Imouzzer",
];

const SORTS = [
  { value: "newest",     label: "Newest" },
  { value: "price_asc",  label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
];

// ── Product Card ───────────────────────────────────────────────────────────

function ProductCard({ product }: { product: Product }) {
  const coop = typeof product.cooperative === "object" ? product.cooperative : null;
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
          boxShadow: hovered
            ? "0 12px 40px rgba(0,0,0,0.13)"
            : "0 4px 24px rgba(0,0,0,0.06)",
          transform: hovered ? "translateY(-4px)" : "translateY(0)",
          transition: "all 0.25s ease",
          cursor: "pointer",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Image */}
        <div
          style={{
            height: 220,
            background: product.images[0]
              ? `url(http://localhost:5000${product.images[0]}) center/cover no-repeat`
              : "linear-gradient(135deg, #f0e8e0, #E9C46A22)",
            flexShrink: 0,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            padding: 12,
          }}
        >
          {product.fairTradeCertified && (
            <span
              style={{
                background: "rgba(42,157,143,0.92)",
                color: "#fff",
                fontSize: 11,
                fontWeight: 600,
                padding: "4px 10px",
                borderRadius: 50,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              ✓ Fair Trade
            </span>
          )}
          {!product.isAvailable && (
            <span
              style={{
                background: "rgba(0,0,0,0.6)",
                color: "#fff",
                fontSize: 11,
                fontWeight: 600,
                padding: "4px 10px",
                borderRadius: 50,
                marginLeft: "auto",
              }}
            >
              Out of stock
            </span>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: "16px 20px 20px", flex: 1, display: "flex", flexDirection: "column" }}>
          <p style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "#9a8a7a",
            marginBottom: 6,
          }}>
            {product.category} · {product.origin}
          </p>
          <h3 style={{
            fontFamily: '"Playfair Display", serif',
            fontSize: 17,
            fontWeight: 700,
            color: "#1a1008",
            marginBottom: 6,
            lineHeight: 1.3,
            flex: 1,
          }}>
            {product.name}
          </h3>
          {coop && (
            <p style={{ fontSize: 13, color: "#9a8a7a", marginBottom: 12 }}>
              by {coop.name}
            </p>
          )}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
            <span style={{
              fontFamily: '"Playfair Display", serif',
              fontWeight: 800,
              fontSize: 20,
              color: "#E76F51",
            }}>
              {product.price} MAD
            </span>
            <span style={{
              fontSize: 12,
              background: "rgba(231,111,81,0.1)",
              color: "#E76F51",
              padding: "4px 10px",
              borderRadius: 50,
              fontWeight: 600,
            }}>
              Fixed price
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function MarketplacePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  const category = (searchParams.get("category") ?? "") as ProductCategory | "";
  const region   = searchParams.get("region") ?? "";
  const sort     = searchParams.get("sort") ?? "newest";
  const page     = Number(searchParams.get("page") ?? 1);

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    setSearchParams(next);
  };

  const setPage = (p: number) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(p));
    setSearchParams(next);
  };


 useEffect(() => {
    const controller = new AbortController();

    const run = async () => {
      setIsLoading(true);
      try {
        const filters: ProductFilters = {
          page,
          limit: 12,
          sort: sort as ProductFilters["sort"],
        };
        if (category) filters.category = category;
        if (region) filters.region = region;
        const res = await productService.getAll(filters);
        if (!controller.signal.aborted) {
          setProducts(res.data);
          setTotal(res.total);
          setPages(res.pages);
        }
      } catch {
        if (!controller.signal.aborted) {
          toast.error("Failed to load products");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    run();

    return () => controller.abort();
  }, [category, region, sort, page]);
  return (
    <div style={{ background: "#FFFCF8", minHeight: "100vh" }}>
      <Navbar />

      {/* Header */}
      <div
        style={{
          paddingTop: 100,
          paddingBottom: 40,
          background: "linear-gradient(160deg, #FFFCF8 60%, #f5ede4 100%)",
          borderBottom: "1px solid #f0e8e0",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
          <p style={{
            fontSize: 11, fontWeight: 600, textTransform: "uppercase",
            letterSpacing: "0.1em", color: "#9a8a7a", marginBottom: 8,
          }}>
            Souss-Massa · Southern Morocco
          </p>
          <h1 style={{
            fontFamily: '"Playfair Display", serif',
            fontSize: "clamp(32px, 5vw, 52px)",
            fontWeight: 800,
            color: "#1a1008",
            letterSpacing: "-0.04em",
            marginBottom: 8,
          }}>
            The Marketplace
          </h1>
          <p style={{ color: "#6b5a4e", fontSize: 16 }}>
            {total > 0 ? `${total} products from Berber/Amazigh cooperatives` : "Explore authentic fair-trade products"}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px 80px" }}>

        {/* ── Filter Bar ── */}
        <FadeSection>
          <div style={{ marginBottom: 40 }}>
            {/* Category chips */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setFilter("category", cat.value)}
                  style={{
                    border: `2px solid ${category === cat.value ? "#E76F51" : "#f0e8e0"}`,
                    background: category === cat.value ? "#E76F51" : "#fff",
                    color: category === cat.value ? "#fff" : "#6b5a4e",
                    borderRadius: 50,
                    padding: "8px 18px",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Region + Sort */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <select
                value={region}
                onChange={(e) => setFilter("region", e.target.value)}
                style={{
                  borderRadius: 12,
                  border: "1px solid #f0e8e0",
                  padding: "10px 16px",
                  fontSize: 14,
                  color: "#1a1008",
                  background: "#fff",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="">All regions</option>
                {REGIONS.filter(Boolean).map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>

              <select
                value={sort}
                onChange={(e) => setFilter("sort", e.target.value)}
                style={{
                  borderRadius: 12,
                  border: "1px solid #f0e8e0",
                  padding: "10px 16px",
                  fontSize: 14,
                  color: "#1a1008",
                  background: "#fff",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>

              {(category || region || sort !== "newest") && (
                <button
                  onClick={() => setSearchParams({})}
                  style={{
                    background: "transparent",
                    border: "1px solid #f0e8e0",
                    borderRadius: 50,
                    padding: "10px 16px",
                    fontSize: 13,
                    color: "#9a8a7a",
                    cursor: "pointer",
                  }}
                >
                  ✕ Clear filters
                </button>
              )}
            </div>
          </div>
        </FadeSection>

        {/* ── Product Grid ── */}
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              border: "4px solid #E76F51", borderTopColor: "transparent",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 16px",
            }} />
            <p style={{ color: "#9a8a7a" }}>Loading products…</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : products.length === 0 ? (
          <FadeSection>
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🏺</div>
              <h3 style={{
                fontFamily: '"Playfair Display", serif',
                fontSize: 24, fontWeight: 700,
                color: "#1a1008", marginBottom: 8,
              }}>
                No products found
              </h3>
              <p style={{ color: "#9a8a7a", marginBottom: 24 }}>
                Try adjusting your filters or browse all categories
              </p>
              <button
                onClick={() => setSearchParams({})}
                style={{
                  background: "#E76F51", color: "#fff", border: "none",
                  borderRadius: 50, padding: "12px 28px",
                  fontSize: 14, fontWeight: 600, cursor: "pointer",
                }}
              >
                Clear filters
              </button>
            </div>
          </FadeSection>
        ) : (
          <FadeSection>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 24,
              marginBottom: 48,
            }}>
              {products.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  style={{
                    border: "1px solid #f0e8e0",
                    background: "#fff",
                    borderRadius: 50,
                    padding: "10px 20px",
                    fontSize: 14,
                    cursor: page === 1 ? "not-allowed" : "pointer",
                    color: page === 1 ? "#9a8a7a" : "#1a1008",
                  }}
                >
                  ← Prev
                </button>

                {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    style={{
                      border: `2px solid ${p === page ? "#E76F51" : "#f0e8e0"}`,
                      background: p === page ? "#E76F51" : "#fff",
                      color: p === page ? "#fff" : "#1a1008",
                      borderRadius: 50,
                      width: 40, height: 40,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {p}
                  </button>
                ))}

                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === pages}
                  style={{
                    border: "1px solid #f0e8e0",
                    background: "#fff",
                    borderRadius: 50,
                    padding: "10px 20px",
                    fontSize: 14,
                    cursor: page === pages ? "not-allowed" : "pointer",
                    color: page === pages ? "#9a8a7a" : "#1a1008",
                  }}
                >
                  Next →
                </button>
              </div>
            )}
          </FadeSection>
        )}
      </div>

      <Footer />
    </div>
  );
}