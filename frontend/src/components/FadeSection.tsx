import { useEffect, useRef, useState } from "react";
import type { ReactNode, CSSProperties } from "react";

interface FadeSectionProps {
  children: ReactNode;
  delay?: number; // ms delay before fade starts
  style?: CSSProperties;
  className?: string;
}

export default function FadeSection({
  children,
  delay = 0,
  style,
  className,
}: FadeSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), delay);
          observer.unobserve(el);
        }
      },
      { threshold: 0.12 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(32px)",
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
        ...style,
      }}
      className={className}
    >
      {children}
    </div>
  );
}