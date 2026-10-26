import { formatCurrency, formatDate } from "@/lib/format";
import type { OrderWithRelations } from "@/types";
import { Calendar, Hash, MapPin, Package } from "lucide-react";

function OrderStatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const isAccepted = normalized === "accepted";

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
        isAccepted
          ? "bg-emerald-500/12 text-emerald-800 ring-1 ring-inset ring-emerald-500/30 dark:text-emerald-400"
          : "bg-primary-100/80 text-primary-800 ring-1 ring-inset ring-primary-300/40 dark:bg-primary-300/10 dark:text-primary-400"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${isAccepted ? "bg-emerald-500" : "bg-primary-500"}`}
        aria-hidden
      />
      {status}
    </span>
  );
}

function MetaPill({
  icon: Icon,
  children,
  className = "",
}: {
  icon: typeof Package;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-lg bg-surface-muted/90 px-2.5 py-1.5 text-xs text-text-700 ring-1 ring-inset ring-divider ${className}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 text-primary-500" aria-hidden />
      <span className="truncate">{children}</span>
    </span>
  );
}

export function OrderCard({ order }: { order: OrderWithRelations }) {
  const productName = order.product?.name ?? "Product";
  const zoneName = order.zone?.name ?? "—";
  const unitPrice = Number(order.unit_price);
  const totalPrice = Number(order.total_price);

  return (
    <article
      className="group relative overflow-hidden rounded-2xl border border-divider bg-surface shadow-sm ring-1 ring-black/[0.02] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-300/50 hover:shadow-md dark:ring-white/[0.04] dark:hover:border-primary-400/35 dark:hover:shadow-card-dark"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-400 via-primary-500 to-secondary-500 opacity-90"
        aria-hidden
      />

      <div className="p-4 pt-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-lg font-semibold tracking-tight text-text-900">
                {productName}
              </h3>
              <OrderStatusBadge status={order.status} />
            </div>
            <p className="mt-1 flex items-center gap-1 font-mono text-[11px] text-text-500">
              <Hash className="h-3 w-3" aria-hidden />
              {order.id.slice(0, 8).toUpperCase()}
            </p>
          </div>

          <div className="shrink-0 rounded-xl bg-gradient-to-br from-primary-50 to-secondary-50 px-4 py-2.5 text-right ring-1 ring-inset ring-primary-200/60 dark:from-primary-300/10 dark:to-secondary-300/10 dark:ring-primary-400/20">
            <p className="text-xl font-bold tabular-nums leading-none text-primary-700 dark:text-primary-400">
              {formatCurrency(totalPrice)}
            </p>
            <p className="mt-1 text-[11px] text-text-500">
              {order.quantity} × {formatCurrency(unitPrice)}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 border-t border-divider pt-4">
          <MetaPill icon={Package}>
            <span className="text-text-500">Qty</span>
            <span className="font-semibold text-text-800">{order.quantity}</span>
          </MetaPill>
          <MetaPill icon={MapPin}>
            <span className="text-text-500">Zone</span>
            <span className="font-semibold text-text-800">{zoneName}</span>
          </MetaPill>
          <MetaPill icon={MapPin} className="font-mono text-[11px] sm:max-w-[220px]">
            {order.customer_lat.toFixed(4)}, {order.customer_lng.toFixed(4)}
          </MetaPill>
          <MetaPill icon={Calendar} className="sm:ml-auto">
            {formatDate(order.created_at)}
          </MetaPill>
        </div>
      </div>
    </article>
  );
}
