const STATUS_STYLE: Record<string, string> = {
  PENDING: "border-orange/25 bg-orange/5 text-orange",
  ACCEPTED: "border-green/25 bg-green/5 text-green",
  CONFIRMED: "border-green/25 bg-green/5 text-green",
  REJECTED: "border-orange-deep/25 bg-orange-deep/5 text-orange-deep",
  CANCELLED: "border-line-border bg-transparent text-muted",
  COMPLETED: "border-line-border bg-surface-2 text-muted",
};

export function BookingStatusBadge({ status }: { status: string }) {
  return (
    <span
      role="status"
      aria-label={`Booking status: ${status.toLowerCase()}`}
      className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLE[status] ?? "border-line-border text-muted"}`}
    >
      {status}
    </span>
  );
}
