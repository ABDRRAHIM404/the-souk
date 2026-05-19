import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      await login(data);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch {
      toast.error("Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div
        style={{
          minHeight: "100vh",
          background: "#FFFCF8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "100px 24px 60px",
        }}
      >
        <div style={{ width: "100%", maxWidth: 440 }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <Link
              to="/"
              style={{
                fontFamily: '"Playfair Display", serif',
                fontWeight: 800,
                fontSize: 28,
                color: "#E76F51",
                textDecoration: "none",
                letterSpacing: "-0.04em",
                display: "block",
                marginBottom: 16,
              }}
            >
              ✦ The Souk
            </Link>
            <h1
              style={{
                fontFamily: '"Playfair Display", serif',
                fontSize: 28,
                fontWeight: 700,
                color: "#1a1008",
                marginBottom: 8,
              }}
            >
              Welcome back
            </h1>
            <p style={{ color: "#6b5a4e", fontSize: 15 }}>
              Log in to your account to continue
            </p>
          </div>

          {/* Card */}
          <div
            style={{
              background: "#fff",
              borderRadius: 20,
              border: "1px solid #f0e8e0",
              boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
              padding: "40px 36px",
            }}
          >
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              {/* Email */}
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Email address</label>
                <input
                  {...register("email")}
                  type="email"
                  placeholder="you@example.com"
                  style={{
                    ...inputStyle,
                    ...(errors.email ? errorBorderStyle : {}),
                  }}
                />
                {errors.email && (
                  <p style={errorStyle}>{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div style={{ marginBottom: 28 }}>
                <label style={labelStyle}>Password</label>
                <input
                  {...register("password")}
                  type="password"
                  placeholder="Your password"
                  style={{
                    ...inputStyle,
                    ...(errors.password ? errorBorderStyle : {}),
                  }}
                />
                {errors.password && (
                  <p style={errorStyle}>{errors.password.message}</p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: "100%",
                  background: isLoading ? "#c9896e" : "#E76F51",
                  color: "#fff",
                  border: "none",
                  borderRadius: 50,
                  padding: "14px 28px",
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: isLoading ? "not-allowed" : "pointer",
                  transition: "background 0.2s",
                }}
              >
                {isLoading ? "Logging in…" : "Log in"}
              </button>
            </form>
          </div>

          {/* Footer link */}
          <p style={{ textAlign: "center", marginTop: 24, color: "#6b5a4e", fontSize: 14 }}>
            Don't have an account?{" "}
            <Link
              to="/signup"
              style={{ color: "#E76F51", fontWeight: 600, textDecoration: "none" }}
            >
              Join The Souk
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: "#1a1008",
  marginBottom: 8,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 12,
  border: "1px solid #f0e8e0",
  padding: "12px 16px",
  fontSize: 15,
  color: "#1a1008",
  background: "#fff",
  outline: "none",
  boxSizing: "border-box",
};

const errorBorderStyle: React.CSSProperties = {
  border: "1px solid #e74c3c",
};

const errorStyle: React.CSSProperties = {
  color: "#e74c3c",
  fontSize: 13,
  marginTop: 6,
};