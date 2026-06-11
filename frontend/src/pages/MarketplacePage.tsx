import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FadeSection from "@/components/FadeSection";
import ProductCard from "@/components/ProductCard";
import { useWishlist } from "@/hooks/useWishlist";
import { productService } from "@/services/productService";
import type { Product, ProductFilters, ProductCategory } from "@/types";
import toast from "react-hot-toast";

const CATEGORIES: { value: ProductCategory | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "argan", label: "Argan Oil" },
  { value: "carpets", label: "Carpets" },
  { value: "saffron", label: "Saffron" },
  { value: "pottery", label: "Pottery" },
  { value: "food", label: "Food & Spices" },
  { value: "leather", label: "Leather" },
  { value: "other", label: "Other" },
];

const REGIONS = [
  "",
  "Agadir",
  "Taghazout",
  "Tiznit",
  "Taroudant",
  "Tafraout",
  "Imsouane",
  "Taliouine",
  "Imouzzer",
];

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

type MarketplaceFilters = ProductFilters & { search?: string };

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ViewIcon({ view }: { view: "grid" | "list" }) {
  if (view === "grid") {
    return (
      <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true">
        <rect x="1" y="1" width="6" height="6" rx="1.5" />
        <rect x="9" y="1" width="6" height="6" rx="1.5" />
        <rect x="1" y="9" width="6" height="6" rx="1.5" />
        <rect x="9" y="9" width="6" height="6" rx="1.5" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true">
      <rect x="1" y="2" width="14" height="3" rx="1.5" />
      <rect x="1" y="6.5" width="14" height="3" rx="1.5" />
      <rect x="1" y="11" width="14" height="3" rx="1.5" />
    </svg>
  );
}

function EmptyIcon() {
  return (
    <svg viewBox="0 0 80 80" width="64" height="64" fill="none" aria-hidden="true">
      <rect x="12" y="14" width="56" height="52" rx="14" fill="#f6efe7" />
      <path d="M25 32h30M25 42h22" stroke="#9a8a7a" strokeWidth="2" strokeLinecap="round" />
      <path d="M40 19v42M19 40h42" stroke="#E76F51" strokeWidth="1.5" strokeOpacity="0.18" />
      <path d="m40 24 12 16-12 16-12-16 12-16Z" stroke="#2A9D8F" strokeWidth="1.6" strokeOpacity="0.36" />
    </svg>
  );
}

function ProductSkeleton({ layout }: { layout: "grid" | "list" }) {
  if (layout === "list") {
    return (
      <div className="market-skeleton-list" aria-hidden="true">
        <div className="market-skeleton-thumb ds-shimmer" />
        <div className="market-skeleton-content">
          <span className="ds-shimmer" />
          <strong className="ds-shimmer" />
          <p className="ds-shimmer" />
          <em className="ds-shimmer" />
        </div>
      </div>
    );
  }

  return (
    <div className="market-skeleton-card" aria-hidden="true">
      <div className="market-skeleton-image ds-shimmer" />
      <div className="market-skeleton-body">
        <span className="ds-shimmer" />
        <strong className="ds-shimmer" />
        <p className="ds-shimmer" />
        <em className="ds-shimmer" />
      </div>
    </div>
  );
}

function MarketplaceSearch({
  initialSearch,
  onSearch,
}: {
  initialSearch: string;
  onSearch: (value: string) => void;
}) {
  const [draft, setDraft] = useState(initialSearch);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(draft.trim());
  };

  return (
    <form className="market-search" onSubmit={handleSubmit} aria-label="Search products">
      <SearchIcon />
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Search argan oil, carpets, saffron..."
      />
      <button type="submit">Search</button>
    </form>
  );
}

export default function MarketplacePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [layout, setLayout] = useState<"grid" | "list">("grid");

  const { wishlistSet } = useWishlist();

  const category = (searchParams.get("category") ?? "") as ProductCategory | "";
  const region = searchParams.get("region") ?? "";
  const sort = searchParams.get("sort") ?? "newest";
  const page = Number(searchParams.get("page") ?? 1);
  const search = searchParams.get("search") ?? "";

  const selectedCategoryLabel = CATEGORIES.find((cat) => cat.value === category)?.label ?? "All";
  const selectedSortLabel = SORTS.find((item) => item.value === sort)?.label ?? "Newest";
  const hasActiveFilters = Boolean(category || region || sort !== "newest" || search);

  const resultLabel = useMemo(() => {
    if (isLoading) return "Finding products from cooperative partners";
    if (total === 0) return "No products match this selection";
    return `${total} product${total === 1 ? "" : "s"} from Moroccan cooperatives`;
  }, [isLoading, total]);

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    setSearchParams(next);
  };

  const clearFilters = () => {
    setSearchParams({});
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
        const filters: MarketplaceFilters = {
          page,
          limit: 12,
          sort: sort as ProductFilters["sort"],
        };
        if (category) filters.category = category;
        if (region) filters.region = region;
        if (search) filters.search = search;

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
  }, [category, region, sort, page, search]);

  return (
    <div className="market-page">
      <Navbar />

      <main>
        <section className="market-hero">
          <div className="market-container market-hero-inner">
            <div>
              <p className="market-eyebrow">Marketplace / Souss-Massa</p>
              <h1>Discover verified cooperative products.</h1>
              <p>{resultLabel}</p>
            </div>
            <div className="market-hero-card" aria-label="Marketplace trust summary">
              <strong>Fair prices, regional origin, cooperative storefronts.</strong>
              <span>Filter by craft, city, and price to find goods worth bringing home.</span>
            </div>
          </div>
        </section>

        <section className="market-container market-content">
          <FadeSection>
            <div className="market-filter-panel">
              <div className="market-filter-heading">
                <div>
                  <p className="market-eyebrow">Product discovery</p>
                  <h2>Browse by craft, region, and price</h2>
                </div>
                {hasActiveFilters && (
                  <button className="market-clear-btn" onClick={clearFilters} type="button">
                    Clear filters
                  </button>
                )}
              </div>

              <MarketplaceSearch
                key={search}
                initialSearch={search}
                onSearch={(value) => setFilter("search", value)}
              />

              <div className="market-category-scroller" aria-label="Product categories">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setFilter("category", cat.value)}
                    className={category === cat.value ? "market-chip market-chip-active" : "market-chip"}
                    type="button"
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="market-filter-row">
                <label className="market-select-wrap">
                  <span>Region</span>
                  <select value={region} onChange={(e) => setFilter("region", e.target.value)}>
                    <option value="">All regions</option>
                    {REGIONS.filter(Boolean).map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="market-select-wrap">
                  <span>Sort</span>
                  <select value={sort} onChange={(e) => setFilter("sort", e.target.value)}>
                    {SORTS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="market-layout-toggle" aria-label="Layout">
                  {(["grid", "list"] as const).map((view) => (
                    <button
                      key={view}
                      onClick={() => setLayout(view)}
                      className={layout === view ? "market-view-btn market-view-active" : "market-view-btn"}
                      aria-label={`${view} view`}
                      type="button"
                    >
                      <ViewIcon view={view} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="market-active-row" aria-label="Active filters">
                <span className="market-active-pill">Category: {selectedCategoryLabel}</span>
                <span className="market-active-pill">Region: {region || "All"}</span>
                <span className="market-active-pill">Sort: {selectedSortLabel}</span>
                {search && <span className="market-active-pill">Search: {search}</span>}
              </div>
            </div>
          </FadeSection>

          <div className="market-results-bar">
            <div>
              <p className="market-eyebrow">Results</p>
              <h2>{isLoading ? "Loading products" : total > 0 ? "Available now" : "No matches found"}</h2>
            </div>
            <span>{isLoading ? "Loading" : `${products.length} shown`}</span>
          </div>

          {isLoading ? (
            <div className={layout === "grid" ? "market-grid" : "market-list"}>
              {Array.from({ length: layout === "grid" ? 12 : 6 }).map((_, index) => (
                <ProductSkeleton key={index} layout={layout} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <FadeSection>
              <div className="market-empty-state">
                <EmptyIcon />
                <h3>No products found</h3>
                <p>
                  This selection may be too narrow. Try removing a filter, choosing a different
                  region, or browsing all cooperative products.
                </p>
                <div className="market-empty-actions">
                  <button onClick={clearFilters} type="button">
                    Clear filters
                  </button>
                  <button onClick={() => setFilter("category", "")} type="button" className="market-empty-secondary">
                    Browse all
                  </button>
                </div>
              </div>
            </FadeSection>
          ) : (
            <FadeSection>
              <div className={layout === "grid" ? "market-grid" : "market-list"}>
                {products.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    layout={layout}
                    initialWishlisted={wishlistSet.has(product._id)}
                  />
                ))}
              </div>

              {pages > 1 && (
                <nav className="market-pagination" aria-label="Product pagination">
                  <button onClick={() => setPage(page - 1)} disabled={page === 1} type="button">
                    Previous
                  </button>

                  <div className="market-page-numbers">
                    {Array.from({ length: pages }, (_, i) => i + 1).map((pageNumber) => (
                      <button
                        key={pageNumber}
                        onClick={() => setPage(pageNumber)}
                        className={pageNumber === page ? "market-page-active" : ""}
                        type="button"
                      >
                        {pageNumber}
                      </button>
                    ))}
                  </div>

                  <button onClick={() => setPage(page + 1)} disabled={page === pages} type="button">
                    Next
                  </button>
                </nav>
              )}
            </FadeSection>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
