export type StatusTone = "success" | "warning" | "danger" | "neutral";

const tones: Record<StatusTone, string> = {
  success: "ds-badge-success",
  warning: "ds-badge-warning",
  danger: "ds-badge-danger",
  neutral: "ds-badge-neutral",
};

export default function StatusChip({ label, tone }: { label: string; tone: StatusTone }) {
  return <span className={`ds-badge ${tones[tone]}`}>{label}</span>;
}
