import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer
      style={{
        background: "#1a1008",
        color: "#9a8a7a",
        padding: "60px 24px 32px",
        marginTop: "auto",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 40,
            marginBottom: 48,
          }}
        >
          {/* Brand */}
          <div>
            <div
              style={{
                fontFamily: '"Playfair Display", serif',
                fontWeight: 800,
                fontSize: 22,
                color: "#E76F51",
                letterSpacing: "-0.04em",
                marginBottom: 12,
              }}
            >
              ✦ The Souk
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.7, maxWidth: 240 }}>
              A fair-trade marketplace connecting conscious tourists with
              Berber/Amazigh cooperatives in Souss-Massa.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h4
              style={{
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 16,
              }}
            >
              Explore
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <FooterLink to="/marketplace">Marketplace</FooterLink>
              <FooterLink to="/signup">Join as Cooperative</FooterLink>
              <FooterLink to="/signup">Join as Tourist</FooterLink>
            </div>
          </div>

          {/* Regions */}
          <div>
            <h4
              style={{
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 16,
              }}
            >
              Regions
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {["Agadir", "Tiznit", "Taroudant", "Tafraout", "Taliouine", "Imsouane"].map(
                (city) => (
                  <span key={city} style={{ fontSize: 14 }}>
                    {city}
                  </span>
                )
              )}
            </div>
          </div>

          {/* Fair trade */}
          <div>
            <h4
              style={{
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 16,
              }}
            >
              Our Promise
            </h4>
            <div
              style={{
                background: "rgba(231,111,81,0.12)",
                borderRadius: 12,
                padding: "16px",
                fontSize: 13,
                lineHeight: 1.7,
                color: "#E9C46A",
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 4 }}>88% to cooperatives</div>
              Fixed fair-trade prices. Transparent 12% platform fee. No haggling, ever.
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.08)",
            paddingTop: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
            fontSize: 13,
          }}
        >
          <span>© {new Date().getFullYear()} The Souk — Souss-Massa Explorer</span>
          <span>Built with respect for Amazigh culture 🏔️</span>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      style={{
        color: "#9a8a7a",
        textDecoration: "none",
        fontSize: 14,
        transition: "color 0.2s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "#E76F51")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "#9a8a7a")}
    >
      {children}
    </Link>
  );
}