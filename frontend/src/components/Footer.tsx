import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mt-auto bg-[#1a1008] text-[#b7a99d]">
      <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 sm:py-14">
        <div className="grid gap-10 border-b border-white/10 pb-10 lg:grid-cols-[1.35fr_0.8fr_0.8fr_1fr]">
          <div>
            <Link to="/" className="inline-flex items-center gap-2.5 text-white">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sm font-bold text-[#1a1008]">
                TS
              </span>
              <span>
                <span className="block font-serif text-xl font-bold">The Souk</span>
                <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-[#E9C46A]">
                  Souss-Massa marketplace
                </span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-7 text-[#b7a99d]">
              A trusted marketplace for travellers to discover fair-trade products from Berber and Amazigh
              cooperatives across Souss-Massa.
            </p>
            <div className="mt-5 grid max-w-sm grid-cols-2 gap-2">
              <TrustMetric value="88%" label="to cooperatives" />
              <TrustMetric value="12%" label="transparent platform fee" />
            </div>
          </div>

          <FooterGroup title="Explore">
            <FooterLink to="/marketplace">Marketplace</FooterLink>
            <FooterLink to="/signup">Join as tourist</FooterLink>
            <FooterLink to="/signup">Join as cooperative</FooterLink>
            <FooterLink to="/login">Log in</FooterLink>
          </FooterGroup>

          <FooterGroup title="Regions">
            {["Agadir", "Tiznit", "Taroudant", "Tafraout", "Taliouine", "Imsouane"].map((city) => (
              <span key={city} className="text-sm text-[#b7a99d]">
                {city}
              </span>
            ))}
          </FooterGroup>

          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-white">Our promise</h4>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-bold text-white">Tourism that gives back</p>
              <p className="mt-2 text-sm leading-6 text-[#b7a99d]">
                Fixed fair-trade prices, cooperative-first payouts, and product stories that make every purchase
                easier to trust.
              </p>
            </div>
            <div className="mt-4 flex gap-2" aria-label="Social links">
              <SocialLink label="Instagram" />
              <SocialLink label="Facebook" />
              <SocialLink label="LinkedIn" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-6 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} The Souk. Built for responsible travel in Morocco.</span>
          <span className="font-medium text-[#E9C46A]">Fair trade · Local craft · Clear impact</span>
        </div>
      </div>
    </footer>
  );
}

function TrustMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5">
      <p className="font-serif text-lg font-bold text-white">{value}</p>
      <p className="mt-1 text-xs leading-4 text-[#b7a99d]">{label}</p>
    </div>
  );
}

function FooterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-white">{title}</h4>
      <div className="flex flex-col gap-2.5">{children}</div>
    </div>
  );
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="text-sm text-[#b7a99d] transition-colors hover:text-white">
      {children}
    </Link>
  );
}

function SocialLink({ label }: { label: string }) {
  return (
    <a
      href="#"
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xs font-bold text-white transition-colors hover:bg-white/10"
    >
      {label.slice(0, 2).toUpperCase()}
    </a>
  );
}
