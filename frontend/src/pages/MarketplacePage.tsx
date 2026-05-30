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
        <div className="market-skeleton-thumb" />
        <div className="market-skeleton-content">
          <span />
          <strong />
          <p />
          <em />
        </div>
      </div>
    );
  }

  return (
    <div className="market-skeleton-card" aria-hidden="true">
      <div className="market-skeleton-image" />
      <div className="market-skeleton-body">
        <span />
        <strong />
        <p />
        <em />
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [searchDraft, setSearchDraft] = useState(searchParams.get("search") ?? "");

  const { wishlistSet } = useWishlist();

  const category = (searchParams.get("category") ?? "") as ProductCategory | "";
  const region = searchParams.get("region") ?? "";
  const sort = searchParams.get("sort") ?? "newest";
  const page = Number(searchParams.get("page") ?? 1);
  const search = searchParams.get("search") ?? "";

  useEffect(() => {
    setSearchDraft(search);
  }, [search]);

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
    setSearchDraft("");
    setSearchParams({});
  };

  const setPage = (p: number) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(p));
    setSearchParams(next);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilter("search", searchDraft.trim());
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

              <form className="market-search" onSubmit={handleSearchSubmit} aria-label="Search products">
                <SearchIcon />
                <input
                  value={searchDraft}
                  onChange={(e) => setSearchDraft(e.target.value)}
                  placeholder="Search argan oil, carpets, saffron..."
                />
                <button type="submit">Search</button>
              </form>

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

      <style>{`
        .market-page {
          min-height: 100vh;
          background: #FFFCF8;
          color: #6b5a4e;
        }

        .market-container {
          width: min(1180px, calc(100% - 48px));
          margin: 0 auto;
        }

        .market-hero {
          padding: 108px 0 44px;
          border-bottom: 1px solid rgba(26,16,8,0.1);
          background:
            linear-gradient(180deg, rgba(255,252,248,0.96), rgba(255,252,248,0.84)),
            linear-gradient(135deg, #fff7ef 0%, #f3ebe2 46%, #eef8f5 100%);
        }

        .market-hero-inner {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 360px;
          gap: 32px;
          align-items: end;
        }

        .market-eyebrow {
          margin: 0 0 8px;
          color: #8e6b25;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.12em;
          line-height: 1.3;
          text-transform: uppercase;
        }

        .market-hero h1 {
          margin: 0;
          max-width: 720px;
          color: #1a1008;
          font-family: "Playfair Display", serif;
          font-size: clamp(38px, 5.4vw, 64px);
          font-weight: 800;
          letter-spacing: -0.035em;
          line-height: 1;
        }

        .market-hero p:not(.market-eyebrow) {
          margin: 16px 0 0;
          color: #59473b;
          font-size: 16px;
          line-height: 1.65;
        }

        .market-hero-card,
        .market-filter-panel,
        .market-empty-state,
        .market-skeleton-card,
        .market-skeleton-list {
          border: 1px solid rgba(26,16,8,0.1);
          border-radius: 16px;
          background: #fff;
          box-shadow: 0 18px 48px rgba(26,16,8,0.08);
        }

        .market-hero-card {
          display: grid;
          gap: 8px;
          padding: 22px;
        }

        .market-hero-card strong {
          color: #1a1008;
          font-size: 15px;
          line-height: 1.35;
        }

        .market-hero-card span {
          color: #7b6a5e;
          font-size: 13px;
          line-height: 1.55;
        }

        .market-content {
          padding: 34px 0 86px;
        }

        .market-filter-panel {
          position: sticky;
          top: 82px;
          z-index: 5;
          margin-bottom: 34px;
          padding: 20px;
        }

        .market-filter-heading,
        .market-filter-row,
        .market-results-bar,
        .market-pagination {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .market-filter-heading {
          margin-bottom: 18px;
        }

        .market-filter-heading h2,
        .market-results-bar h2 {
          margin: 0;
          color: #1a1008;
          font-family: "Playfair Display", serif;
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1.1;
        }

        .market-clear-btn,
        .market-empty-state button,
        .market-search button,
        .market-pagination button {
          min-height: 40px;
          border: 0;
          border-radius: 12px;
          padding: 0 16px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          transition: transform 0.18s ease, background 0.18s ease, color 0.18s ease;
        }

        .market-clear-btn {
          border: 1px solid rgba(26,16,8,0.1);
          background: #fff;
          color: #7b6a5e;
        }

        .market-search {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 12px;
          align-items: center;
          margin-bottom: 16px;
          padding: 8px;
          padding-left: 16px;
          border: 1px solid rgba(26,16,8,0.1);
          border-radius: 14px;
          background: #FFFCF8;
          color: #9a8a7a;
        }

        .market-search input {
          min-width: 0;
          border: 0;
          outline: 0;
          background: transparent;
          color: #1a1008;
          font-size: 15px;
        }

        .market-search button,
        .market-empty-state button {
          background: #E76F51;
          color: #fff;
          box-shadow: 0 12px 28px rgba(231,111,81,0.22);
        }

        .market-category-scroller {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 12px;
          scrollbar-width: none;
        }

        .market-category-scroller::-webkit-scrollbar {
          display: none;
        }

        .market-chip {
          flex: 0 0 auto;
          min-height: 38px;
          border: 1px solid rgba(26,16,8,0.1);
          border-radius: 999px;
          padding: 0 15px;
          background: #fff;
          color: #6b5a4e;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease;
        }

        .market-chip-active {
          border-color: #E76F51;
          background: #E76F51;
          color: #fff;
        }

        .market-filter-row {
          align-items: end;
          flex-wrap: wrap;
          margin-top: 4px;
        }

        .market-select-wrap {
          display: grid;
          min-width: 200px;
          gap: 6px;
        }

        .market-select-wrap span {
          color: #8c7b6f;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .market-select-wrap select {
          width: 100%;
          min-height: 42px;
          border: 1px solid rgba(26,16,8,0.1);
          border-radius: 12px;
          background: #fff;
          color: #1a1008;
          font-size: 14px;
          outline: none;
          padding: 0 14px;
        }

        .market-layout-toggle {
          display: flex;
          gap: 4px;
          margin-left: auto;
          padding: 4px;
          border-radius: 12px;
          background: #f3ece5;
        }

        .market-view-btn {
          width: 36px;
          height: 34px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 0;
          border-radius: 9px;
          background: transparent;
          color: #9a8a7a;
          cursor: pointer;
        }

        .market-view-active {
          background: #fff;
          color: #E76F51;
          box-shadow: 0 4px 12px rgba(26,16,8,0.08);
        }

        .market-active-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid rgba(26,16,8,0.08);
        }

        .market-active-pill {
          display: inline-flex;
          align-items: center;
          min-height: 28px;
          border-radius: 999px;
          padding: 0 10px;
          background: rgba(42,157,143,0.08);
          color: #20786f;
          font-size: 12px;
          font-weight: 800;
        }

        .market-results-bar {
          margin-bottom: 20px;
        }

        .market-results-bar span {
          color: #8c7b6f;
          font-size: 13px;
          font-weight: 800;
        }

        .market-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 22px;
          margin-bottom: 48px;
        }

        .market-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-bottom: 48px;
        }

        .market-grid > a,
        .market-list > a {
          background: #fff !important;
          border-color: rgba(26,16,8,0.1) !important;
        }

        .market-skeleton-card,
        .market-skeleton-list {
          overflow: hidden;
          box-shadow: none;
        }

        .market-skeleton-card {
          min-height: 360px;
        }

        .market-skeleton-image {
          aspect-ratio: 4 / 3;
          background: linear-gradient(90deg, #f0e8e0, #faf6f2, #f0e8e0);
          background-size: 240% 100%;
          animation: marketPulse 1.35s ease-in-out infinite;
        }

        .market-skeleton-body {
          display: grid;
          gap: 10px;
          padding: 18px;
        }

        .market-skeleton-list {
          display: flex;
          gap: 16px;
          padding: 12px;
        }

        .market-skeleton-thumb {
          width: 120px;
          min-height: 120px;
          border-radius: 12px;
          background: linear-gradient(90deg, #f0e8e0, #faf6f2, #f0e8e0);
          background-size: 240% 100%;
          animation: marketPulse 1.35s ease-in-out infinite;
        }

        .market-skeleton-content {
          flex: 1;
          display: grid;
          align-content: center;
          gap: 10px;
        }

        .market-skeleton-body span,
        .market-skeleton-body strong,
        .market-skeleton-body p,
        .market-skeleton-body em,
        .market-skeleton-content span,
        .market-skeleton-content strong,
        .market-skeleton-content p,
        .market-skeleton-content em {
          display: block;
          height: 12px;
          border-radius: 999px;
          background: linear-gradient(90deg, #f0e8e0, #faf6f2, #f0e8e0);
          background-size: 240% 100%;
          animation: marketPulse 1.35s ease-in-out infinite;
        }

        .market-skeleton-body span,
        .market-skeleton-content span {
          width: 42%;
        }

        .market-skeleton-body strong,
        .market-skeleton-content strong {
          width: 76%;
          height: 18px;
        }

        .market-skeleton-body p,
        .market-skeleton-content p {
          width: 58%;
        }

        .market-skeleton-body em,
        .market-skeleton-content em {
          width: 32%;
          height: 20px;
        }

        .market-empty-state {
          max-width: 620px;
          margin: 18px auto 52px;
          padding: 44px 32px;
          text-align: center;
          box-shadow: none;
        }

        .market-empty-state h3 {
          margin: 14px 0 8px;
          color: #1a1008;
          font-family: "Playfair Display", serif;
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.03em;
        }

        .market-empty-state p {
          max-width: 470px;
          margin: 0 auto 22px;
          color: #6b5a4e;
          font-size: 15px;
          line-height: 1.7;
        }

        .market-empty-actions {
          display: flex;
          justify-content: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .market-empty-secondary {
          border: 1px solid rgba(26,16,8,0.1) !important;
          background: #fff !important;
          color: #1a1008 !important;
          box-shadow: none !important;
        }

        .market-pagination {
          justify-content: center;
          flex-wrap: wrap;
          margin-top: 4px;
        }

        .market-pagination button {
          border: 1px solid rgba(26,16,8,0.1);
          background: #fff;
          color: #1a1008;
        }

        .market-pagination button:disabled {
          cursor: not-allowed;
          opacity: 0.45;
        }

        .market-page-numbers {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .market-page-numbers button {
          width: 40px;
          padding: 0;
        }

        .market-page-numbers .market-page-active {
          border-color: #E76F51;
          background: #E76F51;
          color: #fff;
        }

        @keyframes marketPulse {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }

        @media (max-width: 980px) {
          .market-container {
            width: min(100% - 32px, 760px);
          }

          .market-hero-inner {
            grid-template-columns: 1fr;
            align-items: start;
          }

          .market-hero-card {
            max-width: 520px;
          }

          .market-filter-panel {
            position: relative;
            top: auto;
          }

          .market-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 18px;
          }
        }

        @media (max-width: 620px) {
          .market-container {
            width: min(100% - 28px, 520px);
          }

          .market-hero {
            padding: 92px 0 34px;
          }

          .market-hero h1 {
            font-size: clamp(34px, 10vw, 46px);
          }

          .market-content {
            padding-top: 24px;
          }

          .market-filter-panel {
            padding: 16px;
          }

          .market-filter-heading,
          .market-filter-row,
          .market-results-bar {
            align-items: flex-start;
            flex-direction: column;
          }

          .market-clear-btn {
            width: 100%;
          }

          .market-search {
            grid-template-columns: auto 1fr;
          }

          .market-search button {
            grid-column: 1 / -1;
            width: 100%;
          }

          .market-select-wrap,
          .market-layout-toggle {
            width: 100%;
            margin-left: 0;
          }

          .market-layout-toggle {
            justify-content: stretch;
          }

          .market-view-btn {
            flex: 1;
          }

          .market-grid {
            grid-template-columns: 1fr;
          }

          .market-list > a {
            flex-direction: column !important;
            gap: 0 !important;
          }

          .market-list > a > div:first-child {
            width: 100% !important;
            aspect-ratio: 4 / 3;
          }

          .market-list > a > div:nth-child(2) {
            padding: 16px 18px 18px !important;
          }

          .market-skeleton-list {
            flex-direction: column;
          }

          .market-skeleton-thumb {
            width: 100%;
            aspect-ratio: 4 / 3;
          }

          .market-empty-state {
            padding: 34px 22px;
          }
        }
      `}</style>
    </div>
  );
}
