import type { ReactNode } from "react";

const panelStyles =
  "rounded-3xl border border-[#e9ded2] bg-white shadow-[0_1px_2px_rgba(26,16,8,0.04),0_18px_48px_rgba(26,16,8,0.06)]";

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fbf7f2] text-[#1a1008]">
      {children}
    </div>
  );
}

export function DashboardContainer({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">{children}</div>;
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
    <section className={`space-y-5 ${className}`}>
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8c7b6f]">{title}</p>
        {description ? <p className="max-w-2xl text-sm leading-6 text-[#6b5a4e]">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function DashboardCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`${panelStyles} p-5 ${className}`}>{children}</div>;
}

export function DashboardStatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <div className="rounded-3xl border border-[#e9ded2] bg-white p-5 shadow-sm ring-1 ring-[#e9ded2]/60">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8c7b6f]">{label}</p>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-[#1a1008]">{value}</p>
      <p className="mt-2 text-sm text-[#6b5a4e]">{detail}</p>
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
    <aside className="hidden lg:block lg:w-[260px]">
      <div className="sticky top-6 space-y-4 rounded-3xl border border-[#e9ded2] bg-white p-4 shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8c7b6f]">{label}</p>
        </div>
        <div className="space-y-2">
          {items.map((item) => {
            const active = item.id === activeItem;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                className={`flex w-full items-start gap-3 rounded-3xl border px-4 py-4 text-left transition ${
                  active
                    ? "border-[#1a1008] bg-[#fbf7f2] shadow-sm"
                    : "border-transparent bg-white hover:border-[#e8ddd3] hover:bg-[#fcfaf7]"
                }`}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f8f4ef] text-[#1a1008]">{item.icon}</span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-[#1a1008]">{item.label}</span>
                  <span className="block truncate text-xs text-[#7b6a5e]">{item.description}</span>
                </span>
                {item.count !== null ? (
                  <span className="ml-auto rounded-full bg-[#faf7f2] px-2.5 py-1 text-xs font-semibold text-[#1a1008]">{item.count}</span>
                ) : null}
              </button>
            );
          })}
        </div>
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
    <div className="space-y-2 lg:hidden">
      {items.map((item) => {
        const active = item.id === activeItem;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={`flex w-full items-center justify-between rounded-3xl border px-4 py-4 text-left transition ${
              active
                ? "border-[#1a1008] bg-[#fbf7f2] shadow-sm"
                : "border-[#e9ded2] bg-white hover:border-[#d8cbbf] hover:bg-[#fcfaf7]"
            }`}
          >
            <div>
              <p className="text-sm font-semibold text-[#1a1008]">{item.label}</p>
              <p className="mt-1 text-xs text-[#7b6a5e]">{item.description}</p>
            </div>
            {item.count !== null ? (
              <span className="rounded-full bg-[#faf7f2] px-2.5 py-1 text-xs font-semibold text-[#1a1008]">{item.count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
