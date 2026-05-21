import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";
import { useCart } from "@/hooks/useCart";
import CartDrawer from "@/components/CartDrawer";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpenPath, setMenuOpenPath] = useState<string | null>(null);
  const location = useLocation();
  const { totalItems } = useCart();  
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
    } catch {
      toast.error("Failed to log out");
    }
  };

  const dashboardPath =
    user?.role === "coop_owner" ? "/dashboard/coop" : "/dashboard/tourist";

  const menuOpen = menuOpenPath === location.pathname;

  return (
    <nav
      
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        transition: "all 0.3s ease",
        ...(scrolled
          ? {
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              background: "rgba(255,252,248,0.92)",
              borderBottom: "1px solid #f0e8e0",
              boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
            }
          : {
              background: "transparent",
            }),
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px",
          height: 68,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <Link
          to="/"
          style={{
            fontFamily: '"Playfair Display", serif',
            fontWeight: 800,
            fontSize: 24,
            color: "#E76F51",
            textDecoration: "none",
            letterSpacing: "-0.04em",
          }}
        >
          ✦ The Souk
        </Link>

        {/* Desktop nav links */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 32,
          }}
          className="desktop-nav"
        >
          <NavLink to="/marketplace">Marketplace</NavLink>

          {user ? (
            <>
              <NavLink to={dashboardPath}>Dashboard</NavLink>
              <button
                onClick={handleLogout}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#6b5a4e",
                  fontSize: 15,
                  fontWeight: 500,
                }}
              >
                Log out
              </button>
              <Link
                to={dashboardPath}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  textDecoration: "none",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "#E76F51",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </Link>
            </>
          ) : (
            <>
              <NavLink to="/login">Log in</NavLink>
              <Link
                to="/signup"
                style={{
                  background: "#E76F51",
                  color: "#fff",
                  borderRadius: 50,
                  padding: "10px 24px",
                  fontWeight: 600,
                  fontSize: 14,
                  textDecoration: "none",
                  transition: "background 0.2s",
                }}
              >
                Join The Souk
              </Link>
            </>
          )}

          {/* Cart icon */}
          <button
            onClick={() => setCartOpen(true)}
            style={{
              position: "relative",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 8,
              color: "#6b5a4e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              transition: "background 0.2s",
            }}
            aria-label="Open cart"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {totalItems > 0 && (
              <span style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: 18,
                height: 18,
                background: "#E76F51",
                color: "#fff",
                fontSize: 10,
                fontWeight: 700,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                {totalItems > 9 ? "9+" : totalItems}
              </span>
            )}
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() =>
            setMenuOpenPath((p) =>
              p === location.pathname ? null : location.pathname
            )
          }
          style={{
            display: "none",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 8,
            color: "#1a1008",
          }}
          className="mobile-menu-btn"
          aria-label="Toggle menu"
        >
          <div style={{ width: 24, height: 2, background: "currentColor", marginBottom: 5 }} />
          <div style={{ width: 24, height: 2, background: "currentColor", marginBottom: 5 }} />
          <div style={{ width: 24, height: 2, background: "currentColor" }} />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          style={{
            background: "rgba(255,252,248,0.98)",
            borderTop: "1px solid #f0e8e0",
            padding: "16px 24px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <MobileNavLink to="/marketplace">Marketplace</MobileNavLink>
          {user ? (
            <>
              <MobileNavLink to={dashboardPath}>Dashboard</MobileNavLink>
              <button
                onClick={handleLogout}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#6b5a4e",
                  fontSize: 16,
                  textAlign: "left",
                  padding: "8px 0",
                }}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <MobileNavLink to="/login">Log in</MobileNavLink>
              <MobileNavLink to="/signup">Join The Souk</MobileNavLink>
            </>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </nav>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link
      to={to}
      style={{
        color: active ? "#E76F51" : "#6b5a4e",
        textDecoration: "none",
        fontSize: 15,
        fontWeight: active ? 600 : 500,
        transition: "color 0.2s",
      }}
    >
      {children}
    </Link>
  );
}

function MobileNavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      style={{
        color: "#1a1008",
        textDecoration: "none",
        fontSize: 16,
        fontWeight: 500,
        padding: "8px 0",
        borderBottom: "1px solid #f0e8e0",
      }}
    >
      {children}
    </Link>
  );
}