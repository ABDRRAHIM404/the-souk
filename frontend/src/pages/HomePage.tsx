import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FadeSection from "@/components/FadeSection";
import type { Product, Cooperative, PaginatedResponse } from "@/types";
import { productService } from "@/services/productService";
import { coopService } from "@/services/coopService";
import toast from "react-hot-toast";
import { cssUrl } from "@/utils/media";

// ── Product Card (inline for HomePage) ────────────────────────────────────

function HomeProductCard({ product }: { product: Product }) {
  const coop = typeof product.cooperative === "object" ? product.cooperative : null;
  return (
    <Link
      to={`/products/${product._id}`}
      style={{ textDecoration: "none" }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 20,
          border: "1px solid #f0e8e0",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          overflow: "hidden",
          transition: "transform 0.25s ease, box-shadow 0.25s ease",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 12px 40px rgba(0,0,0,0.13)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 24px rgba(0,0,0,0.06)";
        }}
      >
        {/* Image */}
        <div
          style={{
            height: 200,
            background: product.images[0]
              ? cssUrl(product.images[0])
              : "linear-gradient(135deg, #f0e8e0, #E9C46A22)",
            display: "flex",
            alignItems: "flex-end",
            padding: 12,
          }}
        >
          {product.fairTradeCertified && (
            <span
              style={{
                background: "rgba(42,157,143,0.9)",
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
        </div>

        {/* Content */}
        <div style={{ padding: "16px 20px 20px" }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "#9a8a7a",
              marginBottom: 6,
            }}
          >
            {product.category} · {product.origin}
          </p>
          <h3
            style={{
              fontFamily: '"Playfair Display", serif',
              fontSize: 17,
              fontWeight: 700,
              color: "#1a1008",
              marginBottom: 8,
              lineHeight: 1.3,
            }}
          >
            {product.name}
          </h3>
          {coop && (
            <p style={{ fontSize: 13, color: "#9a8a7a", marginBottom: 12 }}>
              by {coop.name}
            </p>
          )}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontFamily: '"Playfair Display", serif',
                fontWeight: 800,
                fontSize: 20,
                color: "#E76F51",
              }}
            >
              {product.price} MAD
            </span>
            <span
              style={{
                fontSize: 12,
                color: "#2A9D8F",
                fontWeight: 600,
              }}
            >
              {product.stock > 0 ? "In stock" : "Out of stock"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Coop Card (inline for HomePage) ───────────────────────────────────────

function HomeCoopCard({ coop }: { coop: Cooperative }) {
  return (
    <Link
      to={`/coops/${coop._id}`}
      style={{ textDecoration: "none", flexShrink: 0 }}
    >
      <div
        style={{
          width: 260,
          background: "#fff",
          borderRadius: 20,
          border: "1px solid #f0e8e0",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          overflow: "hidden",
          transition: "transform 0.25s ease, box-shadow 0.25s ease",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 12px 40px rgba(0,0,0,0.13)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 24px rgba(0,0,0,0.06)";
        }}
      >
        {/* Cover */}
        <div
          style={{
            height: 140,
            background: coop.coverImage
              ? cssUrl(coop.coverImage)
              : "linear-gradient(135deg, #E76F5122, #E9C46A33)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {!coop.coverImage && (
            <span style={{ fontSize: 36 }}>🏺</span>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: "16px 20px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <h3
              style={{
                fontFamily: '"Playfair Display", serif',
                fontSize: 16,
                fontWeight: 700,
                color: "#1a1008",
              }}
            >
              {coop.name}
            </h3>
            {coop.verified && (
              <span style={{ color: "#2A9D8F", fontSize: 14 }}>✓</span>
            )}
          </div>
          <p style={{ fontSize: 13, color: "#9a8a7a", marginBottom: 8 }}>
            📍 {coop.location.city}, {coop.location.region}
          </p>
          <span
            style={{
              display: "inline-block",
              background: "rgba(233,196,106,0.2)",
              color: "#a07c00",
              fontSize: 11,
              fontWeight: 600,
              padding: "3px 10px",
              borderRadius: 50,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            {coop.category}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = `/marketplace?search=${encodeURIComponent(search)}`;
  };

  return (
    <div style={{ background: "#FFFCF8", minHeight: "100vh" }}>
      <Navbar />

      {/* ── Hero ── */}
      <section
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(160deg, #FFFCF8 60%, #f5ede4 100%)",
          padding: "120px 24px 80px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -120,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(231,111,81,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -80,
            left: -80,
            width: 360,
            height: 360,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(42,157,143,0.07) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ textAlign: "center", maxWidth: 760, position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(233,196,106,0.18)",
              border: "1px solid rgba(233,196,106,0.4)",
              borderRadius: 50,
              padding: "6px 16px",
              fontSize: 12,
              fontWeight: 600,
              color: "#a07c00",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: 28,
            }}
          >
            🏔️ Souss-Massa · Southern Morocco
          </div>

          <h1
            style={{
              fontFamily: '"Playfair Display", serif',
              fontSize: "clamp(42px, 7vw, 80px)",
              fontWeight: 800,
              color: "#1a1008",
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              marginBottom: 24,
            }}
          >
            Buy Direct.{" "}
            <span style={{ color: "#E76F51" }}>Pay Fair.</span>
            <br />
            Impact Real.
          </h1>

          <p
            style={{
              fontSize: "clamp(16px, 2vw, 20px)",
              color: "#6b5a4e",
              lineHeight: 1.7,
              marginBottom: 40,
              maxWidth: 560,
              margin: "0 auto 40px",
            }}
          >
            Shop handcrafted argan oil, saffron, carpets, and more — directly
            from Berber/Amazigh women's cooperatives. 88% goes straight to the
            artisan.
          </p>

          {/* Search bar */}
          <form
            onSubmit={handleSearch}
            style={{
              display: "flex",
              gap: 12,
              maxWidth: 520,
              margin: "0 auto 40px",
              background: "#fff",
              borderRadius: 50,
              border: "1px solid #f0e8e0",
              boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
              padding: "6px 6px 6px 24px",
              alignItems: "center",
            }}
          >
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search argan oil, carpets, saffron…"
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: 15,
                color: "#1a1008",
                background: "transparent",
              }}
            />
            <button
              type="submit"
              style={{
                background: "#E76F51",
                color: "#fff",
                border: "none",
                borderRadius: 50,
                padding: "12px 24px",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Search
            </button>
          </form>

          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/marketplace" className="btn btn-primary">
              Browse Marketplace
            </Link>
            <Link to="/signup" className="btn btn-outline">
              Join as Cooperative
            </Link>
          </div>
        </div>
      </section>

      {/* ── Featured Cooperatives ── */}
      <FadeSection>
        <section style={{ padding: "80px 0", background: "#fff" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
            <div style={{ marginBottom: 40 }}>
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#9a8a7a", marginBottom: 8 }}>
                Our Partners
              </p>
              <h2
                style={{
                  fontFamily: '"Playfair Display", serif',
                  fontSize: "clamp(28px, 4vw, 40px)",
                  fontWeight: 700,
                  color: "#1a1008",
                  letterSpacing: "-0.04em",
                }}
              >
                Featured Cooperatives
              </h2>
            </div>

            {/* Horizontal scroll */}
            <div
              style={{
                display: "flex",
                gap: 20,
                overflowX: "auto",
                paddingBottom: 16,
                scrollbarWidth: "none",
              }}
            >
              {coops.length === 0 ? (
                <p style={{ color: "#9a8a7a" }}>No cooperatives yet.</p>
              ) : (
                coops.map((coop) => (
                  <HomeCoopCard key={coop._id} coop={coop} />
                ))
              )}
            </div>

            <div style={{ marginTop: 32, textAlign: "center" }}>
              <Link to="/marketplace" className="btn btn-outline">
                View all cooperatives
              </Link>
            </div>
          </div>
        </section>
      </FadeSection>

      {/* ── Featured Products ── */}
      <FadeSection delay={100}>
        <section style={{ padding: "80px 0" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
            <div style={{ marginBottom: 40 }}>
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#9a8a7a", marginBottom: 8 }}>
                Handpicked for you
              </p>
              <h2
                style={{
                  fontFamily: '"Playfair Display", serif',
                  fontSize: "clamp(28px, 4vw, 40px)",
                  fontWeight: 700,
                  color: "#1a1008",
                  letterSpacing: "-0.04em",
                }}
              >
                From the Souk
              </h2>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 24,
              }}
            >
              {products.length === 0 ? (
                <p style={{ color: "#9a8a7a" }}>No products yet.</p>
              ) : (
                products.map((p) => (
                  <HomeProductCard key={p._id} product={p} />
                ))
              )}
            </div>

            <div style={{ marginTop: 48, textAlign: "center" }}>
              <Link to="/marketplace" className="btn btn-primary">
                Shop all products
              </Link>
            </div>
          </div>
        </section>
      </FadeSection>

      {/* ── How it works ── */}
      <FadeSection delay={100}>
        <section style={{ padding: "80px 0", background: "#fff" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#9a8a7a", marginBottom: 8 }}>
                Simple & transparent
              </p>
              <h2
                style={{
                  fontFamily: '"Playfair Display", serif',
                  fontSize: "clamp(28px, 4vw, 40px)",
                  fontWeight: 700,
                  color: "#1a1008",
                  letterSpacing: "-0.04em",
                }}
              >
                How The Souk Works
              </h2>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 32,
              }}
            >
              {[
                {
                  step: "01",
                  icon: "🔍",
                  title: "Browse",
                  desc: "Explore authentic products from verified Berber/Amazigh cooperatives across Souss-Massa.",
                },
                {
                  step: "02",
                  icon: "🤝",
                  title: "Buy Direct",
                  desc: "Fixed fair-trade prices. No haggling, no middlemen. Contact the cooperative directly.",
                },
                {
                  step: "03",
                  icon: "💛",
                  title: "Real Impact",
                  desc: "88% of every purchase goes directly to the cooperative. Transparent 12% platform fee.",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  style={{
                    background: "#FFFCF8",
                    borderRadius: 20,
                    border: "1px solid #f0e8e0",
                    padding: "36px 32px",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 20,
                      right: 24,
                      fontFamily: '"Playfair Display", serif',
                      fontSize: 48,
                      fontWeight: 800,
                      color: "rgba(231,111,81,0.08)",
                      lineHeight: 1,
                    }}
                  >
                    {item.step}
                  </div>
                  <div style={{ fontSize: 36, marginBottom: 16 }}>{item.icon}</div>
                  <h3
                    style={{
                      fontFamily: '"Playfair Display", serif',
                      fontSize: 22,
                      fontWeight: 700,
                      color: "#1a1008",
                      marginBottom: 12,
                    }}
                  >
                    {item.title}
                  </h3>
                  <p style={{ color: "#6b5a4e", lineHeight: 1.7, fontSize: 15 }}>
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </FadeSection>

      {/* ── Testimonials ── */}
      <FadeSection delay={100}>
        <section style={{ padding: "80px 0" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#9a8a7a", marginBottom: 8 }}>
                From travellers
              </p>
              <h2
                style={{
                  fontFamily: '"Playfair Display", serif',
                  fontSize: "clamp(28px, 4vw, 40px)",
                  fontWeight: 700,
                  color: "#1a1008",
                  letterSpacing: "-0.04em",
                }}
              >
                Stories from The Souk
              </h2>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 24,
              }}
            >
              {[
                {
                  name: "Sophie L.",
                  country: "France",
                  text: "I bought argan oil directly from the cooperative in Taroudant. Knowing that 88% went to the women who made it made the purchase feel meaningful.",
                  rating: 5,
                },
                {
                  name: "James K.",
                  country: "United Kingdom",
                  text: "The handwoven carpet I found on The Souk is now the centerpiece of my living room. Authentic, fairly priced, and a real connection to Amazigh culture.",
                  rating: 5,
                },
                {
                  name: "Amina R.",
                  country: "Netherlands",
                  text: "Finally a platform that respects both the buyer and the artisan. The saffron from Taliouine is the best I have ever tasted.",
                  rating: 5,
                },
              ].map((t) => (
                <div
                  key={t.name}
                  style={{
                    background: "#fff",
                    borderRadius: 20,
                    border: "1px solid #f0e8e0",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
                    padding: "32px",
                  }}
                >
                  <div style={{ display: "flex", gap: 2, marginBottom: 16 }}>
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <span key={i} style={{ color: "#E9C46A", fontSize: 16 }}>★</span>
                    ))}
                  </div>
                  <p
                    style={{
                      color: "#6b5a4e",
                      lineHeight: 1.7,
                      fontSize: 15,
                      marginBottom: 20,
                      fontStyle: "italic",
                    }}
                  >
                    "{t.text}"
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: "#E76F51",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: 16,
                      }}
                    >
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: "#1a1008", fontSize: 14 }}>{t.name}</div>
                      <div style={{ fontSize: 12, color: "#9a8a7a" }}>{t.country}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </FadeSection>

      {/* ── CTA Banner ── */}
      <FadeSection delay={100}>
        <section style={{ padding: "80px 24px" }}>
          <div
            style={{
              maxWidth: 900,
              margin: "0 auto",
              background: "linear-gradient(135deg, #E76F51, #c4563a)",
              borderRadius: 24,
              padding: "64px 48px",
              textAlign: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -60,
                right: -60,
                width: 240,
                height: 240,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.06)",
                pointerEvents: "none",
              }}
            />
            <h2
              style={{
                fontFamily: '"Playfair Display", serif',
                fontSize: "clamp(28px, 4vw, 44px)",
                fontWeight: 800,
                color: "#fff",
                letterSpacing: "-0.04em",
                marginBottom: 16,
              }}
            >
              Are you a cooperative?
            </h2>
            <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 17, marginBottom: 36, lineHeight: 1.7 }}>
              Join The Souk and connect with conscious tourists from around the
              world. List your products, tell your story, and keep 88% of every
              sale.
            </p>
            <Link
              to="/signup"
              style={{
                background: "#fff",
                color: "#E76F51",
                borderRadius: 50,
                padding: "14px 36px",
                fontWeight: 700,
                fontSize: 15,
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Join as a Cooperative
            </Link>
          </div>
        </section>
      </FadeSection>

      <Footer />
    </div>
  );
}
