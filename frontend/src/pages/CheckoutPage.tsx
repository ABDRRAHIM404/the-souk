import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { orderService } from "@/services/orderService";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// ─── Schema ───────────────────────────────────────────────────────────────────

const checkoutSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  country: z.string().min(2, "Country is required"),
  phone: z.string().min(6, "Phone number is required"),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const inputClass =
  "w-full px-4 py-3 rounded-xl border border-[#f0e8e0] bg-white text-[#1a1008] text-sm placeholder:text-[#c4b8ae] focus:outline-none focus:ring-2 focus:ring-[#E76F51]/30 focus:border-[#E76F51] transition-all";

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
      <label className="block text-sm font-semibold text-[#1a1008] mb-1.5">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
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

  // Group items by cooperative for the order summary
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
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Could not place order");
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#FFFCF8]">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-32 text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h1 className="font-['Playfair_Display'] font-bold text-2xl text-[#1a1008] mb-2">
            Your cart is empty
          </h1>
          <p className="text-[#9a8a7a] mb-6">Add some products before checking out.</p>
          <Link
            to="/marketplace"
            className="inline-block bg-[#E76F51] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#d46043] transition-colors"
          >
            Browse Marketplace
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFCF8]">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="font-['Playfair_Display'] font-bold text-3xl text-[#1a1008] mb-8">
          Checkout
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* ── Left: Shipping form ─────────────────────────────────────── */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="bg-white rounded-[20px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] space-y-4">
                <h2 className="font-semibold text-[#1a1008] text-base">Shipping Address</h2>

                <Field label="Full name" error={errors.fullName?.message}>
                  <input {...register("fullName")} className={inputClass} placeholder="Your full name" />
                </Field>

                <Field label="Address" error={errors.address?.message}>
                  <input {...register("address")} className={inputClass} placeholder="Street address" />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="City" error={errors.city?.message}>
                    <input {...register("city")} className={inputClass} placeholder="City" />
                  </Field>
                  <Field label="Country" error={errors.country?.message}>
                    <input {...register("country")} className={inputClass} placeholder="Country" />
                  </Field>
                </div>

                <Field label="Phone number" error={errors.phone?.message}>
                  <input {...register("phone")} className={inputClass} placeholder="+212 6XX XXX XXX" type="tel" />
                </Field>
              </div>

              {/* Payment */}
              <div className="bg-white rounded-[20px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
                <h2 className="font-semibold text-[#1a1008] text-base mb-3">Payment</h2>
                <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-[#2A9D8F] bg-[#2A9D8F]/5">
                  <div className="w-5 h-5 rounded-full border-2 border-[#2A9D8F] flex items-center justify-center shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#2A9D8F]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1a1008]">Cash on Delivery</p>
                    <p className="text-xs text-[#9a8a7a] mt-0.5">Pay when your order arrives</p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={placing}
                className="w-full bg-[#E76F51] text-white py-4 rounded-full font-semibold text-sm hover:bg-[#d46043] transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(231,111,81,0.3)]"
              >
                {placing ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Placing order…
                  </>
                ) : (
                  `Place Order · MAD ${totalPrice.toFixed(2)}`
                )}
              </button>
            </form>
          </div>

          {/* ── Right: Order summary ────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">
            {byCoop.map(({ name, items: coopItems }) => (
              <div
                key={name}
                className="bg-white rounded-[20px] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
              >
                <p className="text-xs font-semibold text-[#2A9D8F] uppercase tracking-widest mb-3">
                  {name}
                </p>
                <div className="space-y-3">
                  {coopItems.map((item) => (
                    <div key={item.productId} className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#faf6f2] shrink-0">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="opacity-20">
                              <rect x="3" y="3" width="18" height="18" rx="3" stroke="#6b5a4e" strokeWidth="1.5" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#1a1008] truncate">{item.name}</p>
                        <p className="text-xs text-[#9a8a7a]">Qty {item.quantity}</p>
                      </div>
                      <span className="text-sm font-bold text-[#E76F51] shrink-0">
                        MAD {(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-[#f0e8e0] mt-3 pt-3 flex justify-between text-sm">
                  <span className="text-[#9a8a7a]">Subtotal</span>
                  <span className="font-semibold text-[#1a1008]">
                    MAD {coopItems.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}

            {/* Grand total */}
            <div className="bg-[#1a1008] rounded-[20px] p-5 text-white">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total</span>
                <span className="font-['Playfair_Display'] font-bold text-2xl">
                  MAD {totalPrice.toFixed(2)}
                </span>
              </div>
              <p className="text-white/50 text-xs mt-1">Cash on delivery · No hidden fees</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
