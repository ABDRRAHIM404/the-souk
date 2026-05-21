import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/context/AuthProvider";
import { useAuth } from "@/hooks/useAuth";
import type { ReactNode } from "react";


import HomePage          from "@/pages/HomePage";
import LoginPage         from "@/pages/LoginPage";
import SignupPage        from "@/pages/SignupPage";
import MarketplacePage   from "@/pages/MarketplacePage";
import ProductDetailPage from "@/pages/ProductDetailPage";
import CoopProfilePage   from "@/pages/CoopProfilePage";
import TouristDashboard  from "@/pages/TouristDashboard";
import CoopDashboard     from "@/pages/CoopDashboard";
import CartProvider from "@/context/CartProvider";
import CheckoutPage from "@/pages/CheckoutPage";

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", border: "4px solid #E76F51", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
          <p style={{ color: "#9a8a7a", fontSize: 14 }}>Loading…</p>
        </div>
      </div>
    );
  }
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

function CoopRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "coop_owner") return <Navigate to="/dashboard/tourist" replace />;
  return <>{children}</>;
}

function GuestRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (user) {
    return <Navigate to={user.role === "coop_owner" ? "/dashboard/coop" : "/dashboard/tourist"} replace />;
  }
  return <>{children}</>;
}

function DashboardRedirect() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === "coop_owner" ? "/dashboard/coop" : "/dashboard/tourist"} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"             element={<HomePage />} />
      <Route path="/marketplace"  element={<MarketplacePage />} />
      <Route path="/products/:id" element={<ProductDetailPage />} />
      <Route path="/coops/:id"    element={<CoopProfilePage />} />

      <Route path="/login"  element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/signup" element={<GuestRoute><SignupPage /></GuestRoute>} />

      <Route path="/dashboard" element={<ProtectedRoute><DashboardRedirect /></ProtectedRoute>} />
      <Route path="/dashboard/tourist" element={<ProtectedRoute><TouristDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/coop"    element={<CoopRoute><CoopDashboard /></CoopRoute>} />
      <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppRoutes />
          <Toaster
          position="top-right"
          toastOptions={{
            style: {
              borderRadius: "12px",
              background: "#1a1008",
              color: "#fff",
              fontSize: "14px",
            },
            success: { iconTheme: { primary: "#2A9D8F", secondary: "#fff" } },
            error:   { iconTheme: { primary: "#E76F51", secondary: "#fff" } },
          }}
        />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}