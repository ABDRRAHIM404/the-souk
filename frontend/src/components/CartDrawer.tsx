import { useCart } from "@/hooks/useCart";
import { Link } from "react-router-dom";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, removeItem, updateQuantity, totalItems, totalPrice } = useCart();

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      <div
        className={`ds-drawer fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-[#eadfd5] px-6 py-5">
          <h2 className="text-xl font-bold text-[#1a1008]">
            Your cart
            {totalItems > 0 && (
              <span className="ml-2 text-sm font-medium text-[#8c7b6f]">
                ({totalItems} {totalItems === 1 ? "item" : "items"})
              </span>
            )}
          </h2>
          <button onClick={onClose} className="ds-icon-btn" aria-label="Close cart" type="button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center pb-16 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-[#eadfd5] bg-[#faf6f2] text-[#7b6a5e]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M6 7h12l-1 13H7L6 7zM9 7a3 3 0 016 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="mb-1 text-lg font-bold text-[#1a1008]">Your cart is empty</p>
              <p className="text-sm text-[#8c7b6f]">Discover handcrafted goods from Moroccan cooperatives.</p>
              <Link to="/marketplace" onClick={onClose} className="ds-btn ds-btn-primary mt-6">
                Browse marketplace
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.productId} className="ds-panel flex gap-3 p-3">
                <Link to={`/products/${item.productId}`} onClick={onClose} className="shrink-0">
                  <div className="h-16 w-16 overflow-hidden rounded-lg bg-[#faf6f2]">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[#b7a99d]">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
                        </svg>
                      </div>
                    )}
                  </div>
                </Link>

                <div className="min-w-0 flex-1">
                  <Link to={`/products/${item.productId}`} onClick={onClose}>
                    <p className="truncate text-sm font-semibold text-[#1a1008] transition-colors hover:text-[#E76F51]">
                      {item.name}
                    </p>
                  </Link>
                  <p className="mt-0.5 text-xs text-[#8c7b6f]">{item.cooperativeName}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f0e8e0] text-sm font-bold text-[#6b5a4e] transition-colors hover:bg-[#1a1008] hover:text-white"
                        type="button"
                      >
                        -
                      </button>
                      <span className="w-6 text-center text-sm font-semibold text-[#1a1008]">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f0e8e0] text-sm font-bold text-[#6b5a4e] transition-colors hover:bg-[#1a1008] hover:text-white"
                        type="button"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-sm font-bold text-[#1a1008]">MAD {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={() => removeItem(item.productId)}
                  className="mt-1 shrink-0 self-start text-[#b7a99d] transition-colors hover:text-red-500"
                  aria-label="Remove item"
                  type="button"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="space-y-3 border-t border-[#eadfd5] px-6 py-5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#6b5a4e]">Total</span>
              <span className="text-xl font-bold text-[#1a1008]">MAD {totalPrice.toFixed(2)}</span>
            </div>
            <p className="text-xs text-[#8c7b6f]">Cash on delivery. Delivery details are confirmed by the cooperative.</p>
            <Link to="/checkout" onClick={onClose} className="ds-btn ds-btn-primary w-full">
              Proceed to checkout
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
