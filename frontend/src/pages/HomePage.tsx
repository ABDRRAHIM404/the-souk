import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FadeSection from "@/components/FadeSection";
import type { Product, Cooperative, PaginatedResponse } from "@/types";
import { productService } from "@/services/productService";
import { coopService } from "@/services/coopService";
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

function ProductFallback() {
  return (
    <div className="home-image-fallback" aria-hidden="true">
      <svg viewBox="0 0 220 170" width="100%" height="100%" preserveAspectRatio="none">
        <rect width="220" height="170" fill="#f6efe7" />
        {Array.from({ length: 4 }).map((_, row) =>
          Array.from({ length: 5 }).map((__, col) => {
            const cx = 28 + col * 42;
            const cy = 28 + row * 42;
            return (
              <path
                key={`${row}-${col}`}
                d={`M${cx} ${cy - 13} L${cx + 13} ${cy} L${cx} ${cy + 13} L${cx - 13} ${cy} Z`}
                fill="none"
                stroke={row % 2 ? "#2A9D8F" : "#E76F51"}
                strokeWidth="1.4"
                opacity="0.28"
              />
            );
          })
        )}
      </svg>
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

function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={`home-section-header ${align === "center" ? "home-section-header-center" : ""}`}>
      <p className="home-eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {description && <p className="home-section-description">{description}</p>}
    </div>
  );
}

function HomeProductCard({ product }: { product: Product }) {
  const coop = typeof product.cooperative === "object" ? product.cooperative : null;
  const image = product.images?.[0];

  return (
    <Link to={`/products/${product._id}`} className="home-product-card">
      <div className="home-product-media">
        {image ? <img src={mediaUrl(image)} alt={product.name} loading="lazy" /> : <ProductFallback />}
        {(product.fairTradeCertified || product.isFairTrade) && (
          <span className="home-card-badge">
            <VerifiedIcon />
            Fair trade
          </span>
        )}
      </div>
      <div className="home-product-body">
        <p className="home-card-meta">
          {formatCategory(product.category)}
          {product.origin ? ` / ${product.origin}` : ""}
        </p>
        <h3>{product.name}</h3>
        {coop && <p className="home-card-subtle">by {coop.name}</p>}
        <div className="home-card-bottom">
          <span className="home-price">{formatPrice(product.price)}</span>
          <span className={product.stock > 0 ? "home-stock home-stock-in" : "home-stock"}>
            {product.stock > 0 ? "In stock" : "Out of stock"}
          </span>
        </div>
      </div>
    </Link>
  );
}

function HomeCoopCard({ coop }: { coop: Cooperative }) {
  const location = coop.location
    ? `${coop.location.city}, ${coop.location.region}`
    : [coop.city, coop.region].filter(Boolean).join(", ");

  return (
    <Link to={`/coops/${coop._id}`} className="home-coop-card">
      <div className="home-coop-media">
        {coop.coverImage ? (
          <img src={mediaUrl(coop.coverImage)} alt={`${coop.name} cooperative`} loading="lazy" />
        ) : (
          <ProductFallback />
        )}
      </div>
      <div className="home-coop-body">
        <div className="home-coop-title-row">
          <h3>{coop.name}</h3>
          {(coop.verified || coop.isCertified) && <VerifiedIcon />}
        </div>
        {location && <p className="home-card-subtle">{location}</p>}
        <div className="home-coop-tags">
          <span>{formatCategory(coop.category)}</span>
          {(coop.followersCount ?? 0) > 0 && <span>{coop.followersCount} followers</span>}
        </div>
      </div>
    </Link>
  );
}

function HeroMedia({ products, coops }: { products: Product[]; coops: Cooperative[] }) {
  const featuredProduct = products.find((product) => product.images?.[0]) ?? products[0];
  const featuredCoop = coops.find((coop) => coop.coverImage) ?? coops[0];
  const productImage = featuredProduct?.images?.[0];

  return (
    <div className="home-hero-media" aria-label="Featured Moroccan cooperative marketplace preview">
      <div className="home-hero-photo home-hero-photo-large">
        {productImage ? (
          <img src={mediaUrl(productImage)} alt={featuredProduct.name} />
        ) : (
          <ProductFallback />
        )}
        <div className="home-hero-photo-caption">
          <span>Featured craft</span>
          <strong>{featuredProduct?.name ?? "Handcrafted goods"}</strong>
        </div>
      </div>
      <div className="home-hero-side-panel">
        <div className="home-impact-card">
          <span className="home-impact-number">88%</span>
          <span>of every purchase goes directly to the cooperative.</span>
        </div>
        <div className="home-hero-photo home-hero-photo-small">
          {featuredCoop?.coverImage ? (
            <img src={mediaUrl(featuredCoop.coverImage)} alt={featuredCoop.name} />
          ) : (
            <ProductFallback />
          )}
          <div className="home-hero-photo-caption">
            <span>Verified partner</span>
            <strong>{featuredCoop?.name ?? "Souss-Massa cooperative"}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrustStrip({ productsCount, coopsCount }: { productsCount: number; coopsCount: number }) {
  const items = [
    { value: `${coopsCount || "6+"}`, label: "cooperatives highlighted" },
    { value: "88%", label: "paid to cooperative partners" },
    { value: `${productsCount || "20+"}`, label: "regional products to discover" },
    { value: "COD", label: "cash on delivery supported" },
  ];

  return (
    <div className="home-trust-strip">
      {items.map((item) => (
        <div key={item.label} className="home-trust-item">
          <strong>{item.value}</strong>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function ProcessIcon({ type }: { type: "discover" | "connect" | "impact" }) {
  if (type === "discover") {
    return (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
        <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.8" />
        <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === "connect") {
    return (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
        <path d="M8.5 12.5 6.8 14a3.4 3.4 0 0 0 4.8 4.8l2.1-2.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="m15.5 11.5 1.7-1.5a3.4 3.4 0 0 0-4.8-4.8l-2.1 2.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="m9.5 14.5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
      <path d="M12 20s7-4.4 7-10.3A4.1 4.1 0 0 0 12 6.8 4.1 4.1 0 0 0 5 9.7C5 15.6 12 20 12 20Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 9v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [coops, setCoops] = useState<Cooperative[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    productService
      .getAll({ limit: 6 })
      .then((res: PaginatedResponse<Product>) => setProducts(res.data))
      .catch(() => toast.error("Failed to load products"));

    coopService
      .getAll()
      .then((res: PaginatedResponse<Cooperative>) => setCoops(res.data.slice(0, 6)))
      .catch(() => toast.error("Failed to load cooperatives"));
  }, []);

  const featuredRegions = useMemo(() => {
    const regionSet = new Set<string>();
    coops.forEach((coop) => {
      const city = coop.location?.city ?? coop.city;
      if (city) regionSet.add(city);
    });
    const regions = Array.from(regionSet).slice(0, 4);
    return regions.length > 0 ? regions : ["Agadir", "Tiznit", "Taroudant", "Taliouine"];
  }, [coops]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = `/marketplace?search=${encodeURIComponent(search)}`;
  };

  return (
    <div className="home-page">
      <Navbar />

      <main>
        <section className="home-hero">
          <div className="home-container home-hero-grid">
            <div className="home-hero-copy">
              <p className="home-kicker">Souss-Massa / Southern Morocco</p>
              <h1>The Souk for verified Moroccan cooperative craft.</h1>
              <p className="home-hero-lede">
                Shop argan oil, saffron, carpets, pottery, and regional goods directly from
                Berber/Amazigh cooperatives. Built for tourists who want authentic products,
                transparent prices, and real local impact.
              </p>

              <form onSubmit={handleSearch} className="home-search" aria-label="Search marketplace">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
                  <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
                  <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search argan oil, carpets, saffron..."
                />
                <button type="submit">Search</button>
              </form>

              <div className="home-hero-actions">
                <Link to="/marketplace" className="home-btn home-btn-primary">
                  Browse marketplace
                </Link>
                <Link to="/signup" className="home-btn home-btn-secondary">
                  Join as cooperative
                </Link>
              </div>

              <div className="home-region-list" aria-label="Featured regions">
                {featuredRegions.map((region) => (
                  <span key={region}>{region}</span>
                ))}
              </div>
            </div>

            <HeroMedia products={products} coops={coops} />
          </div>
        </section>

        <div className="home-container home-trust-wrap">
          <TrustStrip productsCount={products.length} coopsCount={coops.length} />
        </div>

        <FadeSection>
          <section className="home-section home-section-white">
            <div className="home-container">
              <div className="home-section-top">
                <SectionHeader
                  eyebrow="Verified partners"
                  title="Meet the cooperatives behind the craft"
                  description="Profiles bring the people, place, and proof behind each product closer to the traveler."
                />
                <Link to="/marketplace" className="home-text-link">
                  View marketplace
                </Link>
              </div>

              {coops.length === 0 ? (
                <div className="home-empty-state">
                  <h3>Cooperatives are loading</h3>
                  <p>Partner profiles will appear here once the marketplace data is available.</p>
                </div>
              ) : (
                <div className="home-coop-row">
                  {coops.map((coop) => (
                    <HomeCoopCard key={coop._id} coop={coop} />
                  ))}
                </div>
              )}
            </div>
          </section>
        </FadeSection>

        <FadeSection delay={100}>
          <section className="home-section">
            <div className="home-container">
              <div className="home-section-top">
                <SectionHeader
                  eyebrow="Curated marketplace"
                  title="Products worth bringing home"
                  description="Image-first cards, clear origin details, and fair-trade signals make discovery feel trustworthy."
                />
                <Link to="/marketplace" className="home-text-link">
                  Shop all products
                </Link>
              </div>

              {products.length === 0 ? (
                <div className="home-empty-state">
                  <h3>Products are loading</h3>
                  <p>Featured goods will appear here once cooperative inventory is available.</p>
                </div>
              ) : (
                <div className="home-product-grid">
                  {products.map((product) => (
                    <HomeProductCard key={product._id} product={product} />
                  ))}
                </div>
              )}
            </div>
          </section>
        </FadeSection>

        <FadeSection delay={100}>
          <section className="home-section home-section-white">
            <div className="home-container">
              <SectionHeader
                eyebrow="How it works"
                title="A simple path from discovery to local impact"
                description="The homepage should make the buying model obvious before a visitor reaches checkout."
                align="center"
              />

              <div className="home-process-grid">
                {[
                  {
                    step: "01",
                    icon: "discover" as const,
                    title: "Discover by craft and region",
                    desc: "Browse products from Souss-Massa cooperatives with clear category, origin, and availability signals.",
                  },
                  {
                    step: "02",
                    icon: "connect" as const,
                    title: "Buy direct at fair prices",
                    desc: "No haggling or middlemen. Every product connects the traveler to a cooperative storefront.",
                  },
                  {
                    step: "03",
                    icon: "impact" as const,
                    title: "Support measurable impact",
                    desc: "A transparent model keeps 88% of every purchase with the cooperative partner.",
                  },
                ].map((item) => (
                  <div key={item.step} className="home-process-card">
                    <div className="home-process-icon">
                      <ProcessIcon type={item.icon} />
                    </div>
                    <span className="home-process-step">{item.step}</span>
                    <h3>{item.title}</h3>
                    <p>{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </FadeSection>

        <FadeSection delay={100}>
          <section className="home-section">
            <div className="home-container">
              <SectionHeader
                eyebrow="Traveler proof"
                title="Designed for purchases with a story"
                description="Trust grows when travelers understand the product, the maker, and the reason the purchase matters."
                align="center"
              />

              <div className="home-testimonial-grid">
                {[
                  {
                    name: "Sophie L.",
                    country: "France",
                    text: "I bought argan oil from a cooperative in Taroudant. The product felt authentic, and the impact was clear before I ordered.",
                  },
                  {
                    name: "James K.",
                    country: "United Kingdom",
                    text: "The carpet I found here felt connected to a place and a maker, not just another marketplace listing.",
                  },
                  {
                    name: "Amina R.",
                    country: "Netherlands",
                    text: "The saffron from Taliouine was beautifully presented, fairly priced, and easy to trust.",
                  },
                ].map((testimonial) => (
                  <article key={testimonial.name} className="home-testimonial-card">
                    <div className="home-stars" aria-label="5 out of 5 stars">
                      <span>*</span>
                      <span>*</span>
                      <span>*</span>
                      <span>*</span>
                      <span>*</span>
                    </div>
                    <p>"{testimonial.text}"</p>
                    <div className="home-testimonial-person">
                      <span>{testimonial.name.charAt(0)}</span>
                      <div>
                        <strong>{testimonial.name}</strong>
                        <small>{testimonial.country}</small>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </FadeSection>

        <FadeSection delay={100}>
          <section className="home-cta-section">
            <div className="home-container">
              <div className="home-cta">
                <div>
                  <p className="home-eyebrow home-eyebrow-light">For cooperative teams</p>
                  <h2>Turn your cooperative into a trusted digital storefront.</h2>
                  <p>
                    List products, tell your story, and reach travelers looking for authentic
                    Moroccan goods with transparent impact.
                  </p>
                </div>
                <Link to="/signup" className="home-btn home-btn-light">
                  Join as a cooperative
                </Link>
              </div>
            </div>
          </section>
        </FadeSection>
      </main>

      <Footer />

      <style>{`
        .home-page {
          min-height: 100vh;
          background: #FFFCF8;
          color: #6b5a4e;
        }

        .home-container {
          width: min(1180px, calc(100% - 48px));
          margin: 0 auto;
        }

        .home-hero {
          padding: 116px 0 42px;
          background:
            linear-gradient(180deg, rgba(255,252,248,0.96), rgba(255,252,248,0.78)),
            linear-gradient(135deg, #fff7ef 0%, #f3ebe2 46%, #eef8f5 100%);
        }

        .home-hero-grid {
          display: grid;
          grid-template-columns: minmax(0, 0.92fr) minmax(420px, 1.08fr);
          gap: 56px;
          align-items: center;
          min-height: calc(100vh - 158px);
        }

        .home-kicker,
        .home-eyebrow {
          margin: 0 0 12px;
          color: #8e6b25;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.12em;
          line-height: 1.3;
          text-transform: uppercase;
        }

        .home-hero h1 {
          margin: 0;
          max-width: 650px;
          color: #1a1008;
          font-family: "Playfair Display", serif;
          font-size: clamp(44px, 6.4vw, 76px);
          font-weight: 800;
          letter-spacing: -0.035em;
          line-height: 0.98;
        }

        .home-hero-lede {
          margin: 24px 0 0;
          max-width: 610px;
          color: #59473b;
          font-size: 17px;
          line-height: 1.75;
        }

        .home-search {
          margin-top: 34px;
          width: min(100%, 600px);
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 12px;
          align-items: center;
          padding: 8px;
          padding-left: 18px;
          border: 1px solid rgba(26,16,8,0.1);
          border-radius: 14px;
          background: rgba(255,255,255,0.92);
          color: #9a8a7a;
          box-shadow: 0 18px 48px rgba(26,16,8,0.1);
        }

        .home-search input {
          min-width: 0;
          border: 0;
          outline: 0;
          background: transparent;
          color: #1a1008;
          font-size: 15px;
        }

        .home-search button,
        .home-btn {
          min-height: 46px;
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
          transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
        }

        .home-search button,
        .home-btn-primary {
          background: #E76F51;
          color: #fff;
          box-shadow: 0 14px 32px rgba(231,111,81,0.26);
        }

        .home-btn-secondary {
          background: #fff;
          color: #1a1008;
          border: 1px solid rgba(26,16,8,0.12);
          box-shadow: 0 10px 28px rgba(26,16,8,0.08);
        }

        .home-btn-light {
          background: #fff;
          color: #E76F51;
          box-shadow: 0 12px 30px rgba(26,16,8,0.16);
          white-space: nowrap;
        }

        .home-btn:hover,
        .home-search button:hover {
          transform: translateY(-1px);
        }

        .home-hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 18px;
        }

        .home-region-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 28px;
        }

        .home-region-list span {
          border: 1px solid rgba(42,157,143,0.2);
          border-radius: 999px;
          padding: 7px 11px;
          background: rgba(42,157,143,0.08);
          color: #20786f;
          font-size: 12px;
          font-weight: 800;
        }

        .home-hero-media {
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(170px, 0.65fr);
          gap: 16px;
          align-items: stretch;
        }

        .home-hero-photo,
        .home-impact-card,
        .home-product-card,
        .home-coop-card,
        .home-process-card,
        .home-testimonial-card,
        .home-empty-state {
          border: 1px solid rgba(26,16,8,0.1);
          background: #fff;
          box-shadow: 0 18px 48px rgba(26,16,8,0.08);
        }

        .home-hero-photo {
          position: relative;
          min-height: 520px;
          overflow: hidden;
          border-radius: 18px;
        }

        .home-hero-photo-small {
          min-height: 260px;
          flex: 1;
        }

        .home-hero-side-panel {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .home-hero-photo img,
        .home-product-media img,
        .home-coop-media img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        .home-image-fallback {
          width: 100%;
          height: 100%;
          min-height: inherit;
          display: flex;
          background: #f6efe7;
        }

        .home-hero-photo-caption {
          position: absolute;
          left: 16px;
          right: 16px;
          bottom: 16px;
          display: grid;
          gap: 3px;
          padding: 14px 16px;
          border-radius: 14px;
          background: rgba(26,16,8,0.72);
          color: #fff;
          backdrop-filter: blur(12px);
        }

        .home-hero-photo-caption span {
          color: rgba(255,255,255,0.66);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .home-hero-photo-caption strong {
          font-size: 15px;
          line-height: 1.3;
        }

        .home-impact-card {
          display: grid;
          gap: 8px;
          border-radius: 18px;
          padding: 22px;
          background: #1a1008;
          color: rgba(255,255,255,0.72);
        }

        .home-impact-number {
          color: #E9C46A;
          font-family: "Playfair Display", serif;
          font-size: 54px;
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 0.9;
        }

        .home-trust-wrap {
          position: relative;
          z-index: 2;
          margin-top: -18px;
        }

        .home-trust-strip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          overflow: hidden;
          border: 1px solid rgba(26,16,8,0.1);
          border-radius: 16px;
          background: rgba(26,16,8,0.1);
          box-shadow: 0 18px 48px rgba(26,16,8,0.08);
        }

        .home-trust-item {
          display: grid;
          gap: 4px;
          padding: 18px 20px;
          background: #fff;
        }

        .home-trust-item strong {
          color: #1a1008;
          font-family: "Playfair Display", serif;
          font-size: 26px;
          font-weight: 800;
          line-height: 1;
        }

        .home-trust-item span {
          color: #7b6a5e;
          font-size: 12px;
          font-weight: 700;
          line-height: 1.35;
        }

        .home-section {
          padding: 82px 0;
        }

        .home-section-white {
          background: #fff;
        }

        .home-section-top {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 32px;
        }

        .home-section-header {
          max-width: 660px;
        }

        .home-section-header-center {
          max-width: 720px;
          margin: 0 auto 34px;
          text-align: center;
        }

        .home-section-header h2,
        .home-cta h2 {
          margin: 0;
          color: #1a1008;
          font-family: "Playfair Display", serif;
          font-size: clamp(30px, 4vw, 46px);
          font-weight: 800;
          letter-spacing: -0.035em;
          line-height: 1.05;
        }

        .home-section-description {
          margin: 14px 0 0;
          color: #6b5a4e;
          font-size: 15px;
          line-height: 1.7;
        }

        .home-text-link {
          color: #E76F51;
          font-size: 14px;
          font-weight: 800;
          text-decoration: none;
          white-space: nowrap;
        }

        .home-coop-row {
          display: grid;
          grid-auto-flow: column;
          grid-auto-columns: minmax(260px, 1fr);
          gap: 18px;
          overflow-x: auto;
          padding: 4px 2px 18px;
          scroll-snap-type: x mandatory;
        }

        .home-coop-card,
        .home-product-card {
          display: block;
          overflow: hidden;
          border-radius: 16px;
          color: inherit;
          text-decoration: none;
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
          scroll-snap-align: start;
        }

        .home-coop-card:hover,
        .home-product-card:hover {
          transform: translateY(-3px);
          border-color: rgba(231,111,81,0.22);
          box-shadow: 0 24px 60px rgba(26,16,8,0.12);
        }

        .home-coop-media {
          height: 160px;
          background: #f6efe7;
        }

        .home-coop-body,
        .home-product-body {
          padding: 17px 18px 18px;
        }

        .home-coop-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 5px;
        }

        .home-coop-title-row h3,
        .home-product-card h3,
        .home-process-card h3 {
          margin: 0;
          color: #1a1008;
          font-family: "Playfair Display", serif;
          font-weight: 800;
          letter-spacing: -0.025em;
          line-height: 1.2;
        }

        .home-coop-title-row h3 {
          font-size: 18px;
        }

        .home-card-subtle,
        .home-card-meta {
          margin: 0;
          color: #8c7b6f;
          font-size: 12px;
          line-height: 1.45;
        }

        .home-card-meta {
          margin-bottom: 7px;
          color: #2A9D8F;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .home-coop-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-top: 13px;
        }

        .home-coop-tags span,
        .home-stock,
        .home-card-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          border-radius: 999px;
          padding: 5px 9px;
          font-size: 11px;
          font-weight: 800;
          line-height: 1;
        }

        .home-coop-tags span {
          background: rgba(233,196,106,0.22);
          color: #806318;
        }

        .home-product-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 22px;
        }

        .home-product-media {
          position: relative;
          aspect-ratio: 4 / 3;
          background: #f6efe7;
          overflow: hidden;
        }

        .home-card-badge {
          position: absolute;
          left: 12px;
          bottom: 12px;
          background: rgba(255,255,255,0.92);
          color: #20786f;
          box-shadow: 0 8px 22px rgba(26,16,8,0.14);
        }

        .home-product-card h3 {
          display: -webkit-box;
          min-height: 43px;
          margin-bottom: 8px;
          overflow: hidden;
          font-size: 18px;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
        }

        .home-card-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-top: 16px;
        }

        .home-price {
          color: #E76F51;
          font-family: "Playfair Display", serif;
          font-size: 21px;
          font-weight: 800;
          letter-spacing: -0.02em;
          white-space: nowrap;
        }

        .home-stock {
          background: #f0e8e0;
          color: #7b6a5e;
          white-space: nowrap;
        }

        .home-stock-in {
          background: rgba(42,157,143,0.1);
          color: #20786f;
        }

        .home-process-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 20px;
        }

        .home-process-card {
          position: relative;
          border-radius: 16px;
          padding: 26px;
          box-shadow: none;
        }

        .home-process-icon {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: rgba(231,111,81,0.1);
          color: #E76F51;
          margin-bottom: 22px;
        }

        .home-process-step {
          position: absolute;
          top: 24px;
          right: 24px;
          color: rgba(26,16,8,0.16);
          font-family: "Playfair Display", serif;
          font-size: 34px;
          font-weight: 800;
          line-height: 1;
        }

        .home-process-card h3 {
          margin-bottom: 10px;
          font-size: 21px;
        }

        .home-process-card p,
        .home-testimonial-card p,
        .home-cta p {
          margin: 0;
          color: #6b5a4e;
          font-size: 14px;
          line-height: 1.75;
        }

        .home-testimonial-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 20px;
        }

        .home-testimonial-card {
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 12px 34px rgba(26,16,8,0.06);
        }

        .home-stars {
          display: flex;
          gap: 4px;
          margin-bottom: 14px;
          color: #E9C46A;
          font-weight: 900;
          letter-spacing: 0.08em;
        }

        .home-testimonial-person {
          display: flex;
          align-items: center;
          gap: 11px;
          margin-top: 20px;
        }

        .home-testimonial-person > span {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #1a1008;
          color: #fff;
          font-weight: 800;
        }

        .home-testimonial-person strong,
        .home-testimonial-person small {
          display: block;
        }

        .home-testimonial-person strong {
          color: #1a1008;
          font-size: 14px;
        }

        .home-testimonial-person small {
          color: #9a8a7a;
          font-size: 12px;
        }

        .home-cta-section {
          padding: 38px 0 86px;
        }

        .home-cta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 32px;
          border-radius: 18px;
          padding: 42px;
          background: #1a1008;
          color: #fff;
          box-shadow: 0 24px 70px rgba(26,16,8,0.18);
        }

        .home-cta h2 {
          max-width: 700px;
          color: #fff;
        }

        .home-cta p {
          max-width: 680px;
          margin-top: 14px;
          color: rgba(255,255,255,0.7);
        }

        .home-eyebrow-light {
          color: #E9C46A;
        }

        .home-empty-state {
          border-radius: 16px;
          padding: 38px 24px;
          text-align: center;
          box-shadow: none;
        }

        .home-empty-state h3 {
          margin: 0 0 6px;
          color: #1a1008;
          font-family: "Playfair Display", serif;
          font-size: 22px;
        }

        .home-empty-state p {
          margin: 0;
          color: #9a8a7a;
          font-size: 14px;
        }

        @media (max-width: 980px) {
          .home-container {
            width: min(100% - 32px, 760px);
          }

          .home-hero {
            padding-top: 96px;
          }

          .home-hero-grid,
          .home-hero-media,
          .home-product-grid,
          .home-process-grid,
          .home-testimonial-grid {
            grid-template-columns: 1fr;
          }

          .home-hero-grid {
            gap: 34px;
            min-height: 0;
          }

          .home-hero-photo {
            min-height: 360px;
          }

          .home-hero-side-panel {
            display: grid;
            grid-template-columns: 1fr 1fr;
          }

          .home-hero-photo-small {
            min-height: 220px;
          }

          .home-trust-strip {
            grid-template-columns: repeat(2, 1fr);
          }

          .home-section-top {
            align-items: flex-start;
            flex-direction: column;
          }

          .home-product-grid {
            gap: 18px;
          }

          .home-cta {
            align-items: flex-start;
            flex-direction: column;
          }
        }

        @media (max-width: 620px) {
          .home-container {
            width: min(100% - 28px, 520px);
          }

          .home-hero {
            padding-top: 88px;
            padding-bottom: 32px;
          }

          .home-hero h1 {
            font-size: clamp(38px, 12vw, 50px);
          }

          .home-hero-lede {
            font-size: 15px;
          }

          .home-search {
            grid-template-columns: auto 1fr;
            border-radius: 14px;
          }

          .home-search button {
            grid-column: 1 / -1;
            width: 100%;
          }

          .home-hero-actions {
            display: grid;
            grid-template-columns: 1fr;
          }

          .home-hero-side-panel,
          .home-trust-strip {
            grid-template-columns: 1fr;
          }

          .home-hero-photo,
          .home-hero-photo-small {
            min-height: 300px;
          }

          .home-impact-card {
            padding: 20px;
          }

          .home-section {
            padding: 58px 0;
          }

          .home-section-header h2,
          .home-cta h2 {
            font-size: 30px;
          }

          .home-coop-row {
            grid-auto-columns: 82%;
          }

          .home-process-card,
          .home-testimonial-card {
            padding: 22px;
          }

          .home-cta-section {
            padding-bottom: 64px;
          }

          .home-cta {
            padding: 28px;
          }

          .home-btn-light {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
