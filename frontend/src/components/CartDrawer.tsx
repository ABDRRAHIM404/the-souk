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
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-[#FFFCF8] z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#f0e8e0]">
          <h2 className="font-['Playfair_Display'] font-bold text-xl text-[#1a1008]">
            Your Cart
            {totalItems > 0 && (
              <span className="ml-2 text-sm font-normal text-[#9a8a7a]">
                ({totalItems} {totalItems === 1 ? "item" : "items"})
              </span>
            )}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f0e8e0] transition-colors"
            aria-label="Close cart"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="#6b5a4e" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center pb-16">
              <div className="text-5xl mb-4">🛒</div>
              <p className="font-['Playfair_Display'] font-bold text-lg text-[#1a1008] mb-1">
                Your cart is empty
              </p>
              <p className="text-[#9a8a7a] text-sm">
                Discover handcrafted goods from Moroccan cooperatives.
              </p>
              <Link
                to="/marketplace"
                onClick={onClose}
                className="mt-6 bg-[#E76F51] text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-[#d46043] transition-colors"
              >
                Browse Marketplace
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.productId} className="flex gap-3 bg-white rounded-[16px] p-3 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
                {/* Image */}
                <Link to={`/marketplace/${item.productId}`} onClick={onClose} className="shrink-0">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#faf6f2]">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="opacity-20">
                          <rect x="3" y="3" width="18" height="18" rx="3" stroke="#6b5a4e" strokeWidth="1.5" />
                        </svg>
                      </div>
                    )}
                  </div>
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link to={`/marketplace/${item.productId}`} onClick={onClose}>
                    <p className="text-sm font-semibold text-[#1a1008] truncate hover:text-[#E76F51] transition-colors">
                      {item.name}
                    </p>
                  </Link>
                  <p className="text-xs text-[#9a8a7a] mt-0.5">{item.cooperativeName}</p>
                  <div className="flex items-center justify-between mt-2">
                    {/* Quantity stepper */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="w-6 h-6 rounded-full bg-[#f0e8e0] flex items-center justify-center text-[#6b5a4e] hover:bg-[#E76F51] hover:text-white transition-colors text-xs font-bold"
                      >
                        −
                      </button>
                      <span className="text-sm font-semibold text-[#1a1008] w-5 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="w-6 h-6 rounded-full bg-[#f0e8e0] flex items-center justify-center text-[#6b5a4e] hover:bg-[#E76F51] hover:text-white transition-colors text-xs font-bold"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-sm font-bold text-[#E76F51]">
                      MAD {(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeItem(item.productId)}
                  className="shrink-0 self-start mt-1 text-[#c4b8ae] hover:text-red-400 transition-colors"
                  aria-label="Remove item"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-6 py-5 border-t border-[#f0e8e0] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[#6b5a4e] font-semibold">Total</span>
              <span className="font-['Playfair_Display'] font-bold text-xl text-[#1a1008]">
                MAD {totalPrice.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-[#9a8a7a]">
              Cash on delivery · Free shipping within Morocco
            </p>
            <Link
              to="/checkout"
              onClick={onClose}
              className="block w-full bg-[#E76F51] text-white text-center py-3.5 rounded-full font-semibold text-sm hover:bg-[#d46043] transition-colors shadow-[0_4px_16px_rgba(231,111,81,0.3)]"
            >
              Proceed to Checkout
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
