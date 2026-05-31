import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { orderService } from "@/services/orderService";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const checkoutSchema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  address: z.string().min(5, "Enter a complete street address"),
  city: z.string().min(2, "Enter your city"),
  country: z.string().min(2, "Enter your country"),
  phone: z.string().min(6, "Enter a reachable phone number"),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

const panelClass = "rounded-xl border border-[#eadfd5] bg-white shadow-[0_1px_2px_rgba(26,16,8,0.04)]";
const inputClass =
  "w-full rounded-lg border border-[#e8ddd3] bg-white px-3.5 py-2.5 text-sm text-[#1a1008] placeholder:text-[#b7a99d] transition-all focus:border-[#2A9D8F] focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/20";
const inputErrorClass =
  "border-red-300 bg-red-50/30 focus:border-red-400 focus:ring-red-100";
const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-[#1a1008] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#332216] disabled:opacity-60";
const secondaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-[#e8ddd3] bg-white px-4 py-2.5 text-sm font-semibold text-[#5f5046] transition-colors hover:bg-[#faf6f2]";

function formatMoney(value: number) {
  return `MAD ${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response &&
    typeof error.response.data === "object" &&
    error.response.data !== null &&
    "message" in error.response.data &&
    typeof error.response.data.message === "string"
  ) {
    return error.response.data.message;
  }

  return fallback;
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-[#1a1008]">{label}</label>
      {children}
      {error && (
        <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-600">
          <span aria-hidden="true">!</span>
          {error}
        </p>
      )}
    </div>
  );
}

function ProgressIndicator() {
  const steps = ["Cart", "Shipping", "Payment", "Confirmation"];

  return (
    <nav className="mb-6" aria-label="Checkout progress">
      <ol className={`${panelClass} grid grid-cols-4 overflow-hidden`}>
        {steps.map((step, index) => {
          const active = index <= 2;
          return (
            <li key={step} className={`relative flex min-h-14 items-center justify-center gap-2 border-r border-[#eadfd5] px-2 text-center last:border-r-0 ${active ? "text-[#1a1008]" : "text-[#9a8a7a]"}`}>
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${active ? "bg-[#1a1008] text-white" : "bg-[#f0e8e0] text-[#8c7b6f]"}`}>
                {index + 1}
              </span>
              <span className="hidden text-xs font-bold uppercase tracking-[0.08em] sm:inline">{step}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function TrustStrip() {
  return (
    <div className={`${panelClass} grid gap-0 overflow-hidden sm:grid-cols-3`}>
      {[
        ["Verified cooperatives", "Orders go directly to artisan partners."],
        ["Cash on delivery", "Pay only when your order arrives."],
        ["Clear totals", "No hidden marketplace fees at checkout."],
      ].map(([title, text]) => (
        <div key={title} className="border-b border-[#eadfd5] px-4 py-3 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
          <p className="text-sm font-bold text-[#1a1008]">{title}</p>
          <p className="mt-1 text-xs leading-5 text-[#7b6a5e]">{text}</p>
        </div>
      ))}
    </div>
  );
}

interface SummaryProps {
  groups: { name: string; items: ReturnType<typeof useCart>["items"] }[];
  totalPrice: number;
  totalItems: number;
}

function OrderSummary({ groups, totalPrice, totalItems }: SummaryProps) {
  return (
    <aside className="lg:sticky lg:top-[92px]">
      <div className={`${panelClass} overflow-hidden`}>
        <div className="border-b border-[#eadfd5] bg-[#fbf7f2] px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8c7b6f]">Order summary</p>
              <h2 className="mt-1 text-lg font-bold text-[#1a1008]">{totalItems} item{totalItems === 1 ? "" : "s"}</h2>
            </div>
            <Link to="/marketplace" className="text-sm font-semibold text-[#5f5046] hover:text-[#1a1008]">Edit cart</Link>
          </div>
        </div>

        <div className="max-h-[460px] overflow-y-auto p-4">
          <div className="space-y-5">
            {groups.map(({ name, items }) => (
              <section key={name}>
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-[#2A9D8F]">{name || "Cooperative"}</p>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.productId} className="flex gap-3">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-[#f0e8e0] bg-[#faf6f2]">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[#b7a99d]">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                              <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#1a1008]">{item.name}</p>
                        <p className="mt-1 text-xs text-[#8c7b6f]">Qty {item.quantity} x {formatMoney(item.price)}</p>
                      </div>
                      <span className="shrink-0 text-sm font-bold text-[#1a1008]">{formatMoney(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex justify-between border-t border-[#f0e8e0] pt-3 text-sm">
                  <span className="text-[#8c7b6f]">Subtotal</span>
                  <span className="font-semibold text-[#1a1008]">
                    {formatMoney(items.reduce((sum, item) => sum + item.price * item.quantity, 0))}
                  </span>
                </div>
              </section>
            ))}
          </div>
        </div>

        <div className="border-t border-[#eadfd5] bg-[#fbf7f2] p-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#7b6a5e]">Products</span>
              <span className="font-semibold text-[#1a1008]">{formatMoney(totalPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#7b6a5e]">Delivery</span>
              <span className="font-semibold text-[#1a1008]">Arranged by cooperative</span>
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between border-t border-[#eadfd5] pt-4">
            <span className="text-sm font-semibold text-[#1a1008]">Total due</span>
            <span className="text-2xl font-bold text-[#1a1008]">{formatMoney(totalPrice)}</span>
          </div>
          <p className="mt-2 text-xs leading-5 text-[#7b6a5e]">Cash on delivery. The cooperative will confirm delivery details after your order is placed.</p>
        </div>
      </div>
    </aside>
  );
}

export default function CheckoutPage() {
  const { items, totalPrice, totalItems, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [placing, setPlacing] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: user?.name ?? "",
      country: user?.country ?? "",
    },
  });

  const byCoopMap = new Map<string, { name: string; items: typeof items }>();
  for (const item of items) {
    const key = item.cooperativeId;
    if (!byCoopMap.has(key)) byCoopMap.set(key, { name: item.cooperativeName, items: [] });
    byCoopMap.get(key)!.items.push(item);
  }
  const byCoop = Array.from(byCoopMap.values());

  const onSubmit: SubmitHandler<CheckoutForm> = async (data) => {
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setPlacing(true);
    try {
      await orderService.create({
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        shippingAddress: data,
      });

      clearCart();
      toast.success("Order placed! The cooperative will confirm shortly.");
      navigate("/dashboard");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Could not place order"));
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#FFFCF8]" style={{ paddingTop: 68 }}>
        <Navbar />
        <main className="mx-auto max-w-lg px-4 py-24 text-center">
          <div className={`${panelClass} px-6 py-12`}>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-[#eadfd5] bg-[#faf6f2] text-[#7b6a5e]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 7h12l-1 13H7L6 7zM9 7a3 3 0 016 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-[#1a1008]">Your cart is empty</h1>
            <p className="mt-2 text-sm leading-6 text-[#7b6a5e]">Add products from the marketplace before checking out.</p>
            <Link to="/marketplace" className={`${primaryButtonClass} mt-6`}>Browse marketplace</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFCF8]" style={{ paddingTop: 68 }}>
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:pb-12">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8c7b6f]">Secure checkout</p>
            <h1 className="mt-1 text-2xl font-bold text-[#1a1008] md:text-3xl">Complete your order</h1>
            <p className="mt-1 text-sm leading-6 text-[#7b6a5e]">Confirm delivery details and pay when your order arrives.</p>
          </div>
          <Link to="/marketplace" className={secondaryButtonClass}>Continue shopping</Link>
        </div>

        <ProgressIndicator />

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
          <div className="space-y-5">
            <section className={`${panelClass} overflow-hidden`}>
              <div className="border-b border-[#eadfd5] bg-[#fbf7f2] px-5 py-4">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8c7b6f]">Shipping</p>
                <h2 className="mt-1 text-lg font-bold text-[#1a1008]">Delivery address</h2>
              </div>
              <div className="space-y-4 p-5 sm:p-6">
                <Field label="Full name" error={errors.fullName?.message}>
                  <input {...register("fullName")} className={`${inputClass} ${errors.fullName ? inputErrorClass : ""}`} placeholder="Your full name" autoComplete="name" />
                </Field>

                <Field label="Street address" error={errors.address?.message}>
                  <input {...register("address")} className={`${inputClass} ${errors.address ? inputErrorClass : ""}`} placeholder="Street, building, apartment" autoComplete="street-address" />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="City" error={errors.city?.message}>
                    <input {...register("city")} className={`${inputClass} ${errors.city ? inputErrorClass : ""}`} placeholder="City" autoComplete="address-level2" />
                  </Field>
                  <Field label="Country" error={errors.country?.message}>
                    <input {...register("country")} className={`${inputClass} ${errors.country ? inputErrorClass : ""}`} placeholder="Country" autoComplete="country-name" />
                  </Field>
                </div>

                <Field label="Phone number" error={errors.phone?.message}>
                  <input {...register("phone")} className={`${inputClass} ${errors.phone ? inputErrorClass : ""}`} placeholder="+212 6XX XXX XXX" type="tel" autoComplete="tel" />
                </Field>
              </div>
            </section>

            <section className={`${panelClass} overflow-hidden`}>
              <div className="border-b border-[#eadfd5] bg-[#fbf7f2] px-5 py-4">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8c7b6f]">Payment</p>
                <h2 className="mt-1 text-lg font-bold text-[#1a1008]">Payment method</h2>
              </div>
              <div className="p-5 sm:p-6">
                <div className="flex items-start gap-3 rounded-xl border border-[#b9dfd8] bg-[#edf8f6] p-4">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-[#2A9D8F]">
                    <div className="h-2.5 w-2.5 rounded-full bg-[#2A9D8F]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#1a1008]">Cash on delivery</p>
                    <p className="mt-1 text-sm leading-6 text-[#6b5a4e]">No online payment is collected. The cooperative will confirm your order and delivery details.</p>
                  </div>
                </div>
              </div>
            </section>

            <TrustStrip />

            <button type="submit" disabled={placing} className={`${primaryButtonClass} hidden w-full lg:flex`}>
              {placing ? (
                <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Placing order...</>
              ) : (
                `Place order · ${formatMoney(totalPrice)}`
              )}
            </button>
          </div>

          <OrderSummary groups={byCoop} totalPrice={totalPrice} totalItems={totalItems} />
        </form>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#eadfd5] bg-[#FFFCF8]/95 p-3 backdrop-blur lg:hidden">
        <button type="button" disabled={placing} onClick={handleSubmit(onSubmit)} className={`${primaryButtonClass} w-full`}>
          {placing ? (
            <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Placing order...</>
          ) : (
            `Place order · ${formatMoney(totalPrice)}`
          )}
        </button>
      </div>

      <Footer />
    </div>
  );
}
