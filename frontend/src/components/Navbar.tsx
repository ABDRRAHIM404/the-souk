import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";
import { useCart } from "@/hooks/useCart";
import CartDrawer from "@/components/CartDrawer";

function BrandMark() {
  return (
    <span className="flex items-center gap-2">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1a1008] text-sm font-bold text-white">TS</span>
      <span className="leading-none">
        <span className="block text-lg font-bold text-[#1a1008]">The Souk</span>
        <span className="hidden text-[11px] font-bold uppercase tracking-[0.14em] text-[#8c7b6f] sm:block">Souss-Massa</span>
      </span>
    </span>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { totalItems } = useCart();
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
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

  const dashboardPath = user?.role === "coop_owner" ? "/dashboard/coop" : "/dashboard/tourist";
  const isDashboard = location.pathname.startsWith("/dashboard");
  const isOpaque = scrolled || isDashboard || menuOpen;

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-[100] transition-all duration-200 ${
        isOpaque
          ? "border-b border-[#eadfd5] bg-[#FFFCF8]/95 shadow-[0_1px_18px_rgba(26,16,8,0.06)] backdrop-blur"
          : "bg-[#FFFCF8]/70 backdrop-blur-sm"
      }`}
    >
      <div className="mx-auto flex h-[68px] max-w-[1200px] items-center justify-between px-4 sm:px-6">
        <Link to="/" className="text-decoration-none" aria-label="The Souk home">
          <BrandMark />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          <NavLink to="/marketplace">Marketplace</NavLink>
          {user && <NavLink to={dashboardPath}>Dashboard</NavLink>}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <CartButton totalItems={totalItems} onClick={() => setCartOpen(true)} />
          {user ? (
            <>
              <button
                onClick={handleLogout}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-[#6b5a4e] transition-colors hover:bg-[#faf6f2] hover:text-[#1a1008]"
                type="button"
              >
                Log out
              </button>
              <Link to={dashboardPath} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1a1008] text-sm font-bold text-white" aria-label="Open dashboard">
                {user.name.charAt(0).toUpperCase()}
              </Link>
            </>
          ) : (
            <>
              <NavLink to="/login">Log in</NavLink>
              <Link to="/signup" className="rounded-lg bg-[#1a1008] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#332216]">
                Join The Souk
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <CartButton totalItems={totalItems} onClick={() => setCartOpen(true)} />
          <button
            onClick={() => setMenuOpen((open) => !open)}
            className="rounded-lg p-2 text-[#1a1008] transition-colors hover:bg-[#faf6f2]"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            type="button"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              {menuOpen ? (
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-[#eadfd5] bg-[#FFFCF8] px-4 py-3 md:hidden">
          <div className="mx-auto max-w-[1200px] space-y-1">
            <MobileNavLink to="/marketplace" onNavigate={() => setMenuOpen(false)}>Marketplace</MobileNavLink>
            {user ? (
              <>
                <MobileNavLink to={dashboardPath} onNavigate={() => setMenuOpen(false)}>Dashboard</MobileNavLink>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    void handleLogout();
                  }}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-sm font-semibold text-[#6b5a4e] transition-colors hover:bg-[#faf6f2] hover:text-[#1a1008]"
                  type="button"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <MobileNavLink to="/login" onNavigate={() => setMenuOpen(false)}>Log in</MobileNavLink>
                <MobileNavLink to="/signup" onNavigate={() => setMenuOpen(false)}>Join The Souk</MobileNavLink>
              </>
            )}
            <button
              onClick={() => {
                setMenuOpen(false);
                setCartOpen(true);
              }}
              className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-sm font-semibold text-[#6b5a4e] transition-colors hover:bg-[#faf6f2] hover:text-[#1a1008]"
              type="button"
            >
              Cart
              <span className="rounded-full bg-[#f0e8e0] px-2 py-0.5 text-xs text-[#6b5a4e]">{totalItems}</span>
            </button>
          </div>
        </div>
      )}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </nav>
  );
}

function CartButton({ totalItems, onClick }: { totalItems: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="relative rounded-lg p-2 text-[#6b5a4e] transition-colors hover:bg-[#faf6f2] hover:text-[#1a1008]"
      aria-label="Open cart"
      type="button"
    >
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6 7h12l-1 13H7L6 7zM9 7a3 3 0 016 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {totalItems > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E76F51] px-1 text-[10px] font-bold text-white">
          {totalItems > 9 ? "9+" : totalItems}
        </span>
      )}
    </button>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const location = useLocation();
  const active = location.pathname === to || (to.startsWith("/dashboard") && location.pathname.startsWith("/dashboard"));
  return (
    <Link
      to={to}
      className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
        active ? "bg-[#faf6f2] text-[#1a1008]" : "text-[#6b5a4e] hover:bg-[#faf6f2] hover:text-[#1a1008]"
      }`}
    >
      {children}
    </Link>
  );
}

function MobileNavLink({ to, children, onNavigate }: { to: string; children: React.ReactNode; onNavigate: () => void }) {
  return (
    <Link to={to} onClick={onNavigate} className="flex items-center justify-between rounded-lg px-3 py-3 text-sm font-semibold text-[#6b5a4e] transition-colors hover:bg-[#faf6f2] hover:text-[#1a1008]">
      {children}
    </Link>
  );
}
