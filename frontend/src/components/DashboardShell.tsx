import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function DashboardShell({ children }: { children: ReactNode }) {
  return <div className="dash-shell">{children}</div>;
}

export function DashboardTopBar({
  role,
}: {
  role: "tourist" | "coop_owner";
}) {
  const { user, logout } = useAuth();
  const dashboardPath = role === "coop_owner" ? "/dashboard/coop" : "/dashboard/tourist";

  return (
    <header className="dash-topbar">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-6">
          <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="The Souk home">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1a1008] text-xs font-bold text-white">
              TS
            </span>
            <span className="hidden sm:block">
              <span className="block text-sm font-bold leading-none text-[#1a1008]">The Souk</span>
              <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-[#8c7b6f]">
                {role === "coop_owner" ? "Cooperative workspace" : "Your account"}
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Dashboard navigation">
            <TopNavLink to={dashboardPath} active>
              Dashboard
            </TopNavLink>
            <TopNavLink to="/marketplace">Marketplace</TopNavLink>
            {role === "coop_owner" && user?.cooperativeId && (
              <TopNavLink to={`/coops/${user.cooperativeId}`}>Storefront</TopNavLink>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/marketplace"
            className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-[#6b5a4e] transition-colors hover:bg-[#faf6f2] hover:text-[#1a1008] sm:inline-flex"
          >
            Browse
          </Link>
          {user && (
            <div className="flex items-center gap-2 border-l border-[#eadfd5] pl-2 sm:pl-3">
              <div className="hidden text-right sm:block">
                <p className="max-w-[140px] truncate text-sm font-semibold text-[#1a1008]">{user.name}</p>
                <p className="text-[11px] text-[#8c7b6f]">{role === "coop_owner" ? "Cooperative owner" : "Tourist"}</p>
              </div>
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1a1008] text-xs font-bold text-white"
                aria-hidden="true"
              >
                {user.name.charAt(0).toUpperCase()}
              </span>
              <button
                type="button"
                onClick={() => void logout()}
                className="rounded-lg px-2.5 py-2 text-xs font-semibold text-[#8c7b6f] transition-colors hover:bg-[#faf6f2] hover:text-[#1a1008]"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function TopNavLink({
  to,
  children,
  active,
}: {
  to: string;
  children: ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
        active
          ? "bg-[#faf6f2] text-[#1a1008]"
          : "text-[#6b5a4e] hover:bg-[#faf6f2] hover:text-[#1a1008]"
      }`}
      aria-current={active ? "page" : undefined}
    >
      {children}
    </Link>
  );
}

export function DashboardContainer({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 ${className}`}>{children}</div>
  );
}

export function DashboardPageHeader({
  eyebrow,
  title,
  description,
  actions,
  badges,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  badges?: ReactNode;
}) {
  return (
    <div className="dash-panel p-6 sm:p-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 space-y-2">
          {eyebrow && (
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8c7b6f]">{eyebrow}</p>
          )}
          <h1 className="font-serif text-3xl font-bold tracking-tight text-[#1a1008] sm:text-4xl">{title}</h1>
          {badges && <div className="flex flex-wrap items-center gap-2 pt-1">{badges}</div>}
          {description && <p className="max-w-2xl text-sm leading-7 text-[#6b5a4e]">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
      </div>
    </div>
  );
}

export function DashboardSection({
  title,
  description,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`space-y-4 ${className}`}>
      <div className="space-y-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8c7b6f]">{title}</p>
        {description ? <p className="max-w-2xl text-sm leading-6 text-[#6b5a4e]">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function DashboardCard({
  children,
  className = "",
  padding = true,
}: {
  children: ReactNode;
  className?: string;
  padding?: boolean;
}) {
  return (
    <div className={`dash-panel ${padding ? "p-5" : ""} ${className}`}>{children}</div>
  );
}

export function DashboardStatCard({
  label,
  value,
  detail,
  accent,
}: {
  label: string;
  value: string | number;
  detail: string;
  accent?: "brand" | "success" | "warning" | "neutral";
}) {
  return (
    <div className="dash-stat" data-accent={accent ?? "brand"}>
      <p className="dash-stat-label">{label}</p>
      <p className="dash-stat-value">{value}</p>
      <p className="dash-stat-detail">{detail}</p>
    </div>
  );
}

export function DashboardSidebar<T extends string>({
  items,
  activeItem,
  onSelect,
  label,
}: {
  items: Array<{
    id: T;
    label: string;
    description: string;
    count: number | null;
    icon: ReactNode;
  }>;
  activeItem: T;
  onSelect: (item: T) => void;
  label: string;
}) {
  return (
    <aside className="hidden lg:block lg:w-[248px]">
      <div className="sticky top-[72px] space-y-3">
        <p className="px-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#8c7b6f]">{label}</p>
        <nav className="space-y-1" aria-label={label}>
          {items.map((item) => {
            const active = item.id === activeItem;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                className={`dash-nav-item ${active ? "dash-nav-item-active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                <span className="dash-nav-icon">{item.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-[#1a1008]">{item.label}</span>
                  <span className="block truncate text-xs text-[#8c7b6f]">{item.description}</span>
                </span>
                {item.count !== null && (
                  <span className="ml-auto rounded-full bg-[#fbf7f2] px-2 py-0.5 text-xs font-bold text-[#1a1008]">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

export function DashboardMobileTabs<T extends string>({
  items,
  activeItem,
  onSelect,
}: {
  items: Array<{
    id: T;
    label: string;
    description: string;
    count: number | null;
  }>;
  activeItem: T;
  onSelect: (item: T) => void;
}) {
  return (
    <div className="mb-5 flex gap-2 overflow-x-auto pb-1 lg:hidden" role="tablist" aria-label="Dashboard sections">
      {items.map((item) => {
        const active = item.id === activeItem;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(item.id)}
            className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition ${
              active
                ? "border-[#1a1008] bg-[#1a1008] text-white"
                : "border-[#eadfd5] bg-white text-[#6b5a4e] hover:border-[#d8cbbf]"
            }`}
          >
            {item.label}
            {item.count !== null && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold ${
                  active ? "bg-white/20 text-white" : "bg-[#fbf7f2] text-[#1a1008]"
                }`}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function DashboardEmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="dash-empty">
      <div className="dash-empty-icon" aria-hidden="true">
        {icon ?? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 7h16M6 7v12h12V7M9 7V5a3 3 0 016 0v2"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      <h3 className="text-lg font-bold text-[#1a1008]">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-[#7b6a5e]">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function DashboardTabHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#8c7b6f]">{eyebrow}</p>
        )}
        <h2 className="mt-1 text-xl font-bold text-[#1a1008]">{title}</h2>
        {description && <p className="mt-1 text-sm text-[#7b6a5e]">{description}</p>}
      </div>
      {actions}
    </div>
  );
}
