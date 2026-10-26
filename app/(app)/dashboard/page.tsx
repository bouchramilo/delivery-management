"use client";

import { StatCard } from "@/components/dashboard/StatCard";
import { apiFetch } from "@/lib/api/client-fetch";
import { formatCurrency } from "@/lib/format";
import type { DashboardStats } from "@/types";
import {
  Boxes,
  MapPin,
  Package,
  ShoppingBag,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      void (async () => {
        try {
          const data = await apiFetch<{ stats: DashboardStats }>("/api/dashboard");
          if (!cancelled) setStats(data.stats);
        } catch (err) {
          if (!cancelled) {
            setError(err instanceof Error ? err.message : "Failed to load dashboard");
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 animate-pulse rounded-3xl bg-primary-100/60" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-surface/80" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return <p className="text-sm text-accent-600">{error ?? "Dashboard unavailable"}</p>;
  }

  return (
    <div className="space-y-8">
      <section
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-500 via-primary-400 to-secondary-500 p-6 text-white shadow-soft md:p-8"
      >
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 left-1/3 h-32 w-32 rounded-full bg-accent-400/20 blur-2xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Delivery overview
            </div>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
              Welcome back
            </h2>
            <p className="mt-2 max-w-xl text-sm text-primary-50/95 md:text-base">
              Track zones, stock, and orders in one friendly place. Your numbers update
              as you manage deliveries.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/orders"
              className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-primary-700 shadow-sm transition hover:bg-primary-50"
            >
              New order
            </Link>
            <Link
              href="/zones"
              className="rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold backdrop-blur-sm transition hover:bg-white/20"
            >
              Manage zones
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Active zones"
          value={stats.activeZones}
          icon={MapPin}
          tone="primary"
        />
        <StatCard
          label="Products"
          value={stats.totalProducts}
          icon={Package}
          tone="secondary"
        />
        <StatCard
          label="Available stock"
          value={stats.totalStock}
          icon={Boxes}
          tone="accent"
        />
        <StatCard
          label="Accepted orders"
          value={stats.acceptedOrders}
          icon={ShoppingBag}
          tone="background"
        />
        <StatCard
          label="Order value"
          value={formatCurrency(stats.totalOrderValue)}
          icon={TrendingUp}
          tone="primary"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-divider bg-surface p-5 shadow-card dark:shadow-card-dark">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary-100 text-secondary-600">
              <Package className="h-4 w-4" aria-hidden />
            </div>
            <h2 className="text-lg font-semibold text-text-800">Products by zone</h2>
          </div>
          {stats.productsByZone.length === 0 ? (
            <p className="rounded-xl bg-surface-muted p-4 text-sm text-text-500">
              No zone assignments yet. Assign products from the{" "}
              <Link href="/products" className="font-medium text-primary-600 underline">
                Products
              </Link>{" "}
              page.
            </p>
          ) : (
            <ul className="space-y-3">
              {stats.productsByZone.map((zone) => (
                <li
                  key={zone.zoneId}
                  className="rounded-xl border border-background-100 bg-surface-muted/80 p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-text-800">{zone.zoneName}</p>
                    <span className="rounded-full bg-secondary-100 px-2.5 py-0.5 text-xs font-medium text-secondary-700">
                      {zone.productCount} products
                    </span>
                  </div>
                  <ul className="mt-3 space-y-1.5 text-sm text-text-600">
                    {zone.products.map((product) => (
                      <li
                        key={product.id}
                        className="flex items-center justify-between gap-2 border-t border-background-100 pt-1.5 first:border-0 first:pt-0"
                      >
                        <span>{product.name}</span>
                        <span className="text-text-500">Stock {product.quantity}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-divider bg-surface p-5 shadow-card dark:shadow-card-dark">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-100 text-accent-600">
              <ShoppingBag className="h-4 w-4" aria-hidden />
            </div>
            <h2 className="text-lg font-semibold text-text-800">Orders by zone</h2>
          </div>
          {stats.ordersByZone.length === 0 ? (
            <p className="rounded-xl bg-surface-muted p-4 text-sm text-text-500">
              No accepted orders yet. Create one from the{" "}
              <Link href="/orders" className="font-medium text-primary-600 underline">
                Orders
              </Link>{" "}
              page.
            </p>
          ) : (
            <ul className="space-y-3">
              {stats.ordersByZone.map((zone) => (
                <li
                  key={zone.zoneId}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-background-100 bg-gradient-to-r from-surface to-primary-50/40 p-4 dark:to-primary-300/10"
                >
                  <div>
                    <p className="font-semibold text-text-800">{zone.zoneName}</p>
                    <p className="mt-1 text-sm text-text-500">
                      {zone.orderCount} orders · {zone.totalItems} items ·{" "}
                      <span className="font-medium text-primary-600">
                        {formatCurrency(zone.totalValue)}
                      </span>
                    </p>
                  </div>
                  <Link
                    href={`/orders?zoneId=${zone.zoneId}`}
                    className="rounded-lg bg-primary-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-primary-600"
                  >
                    View orders
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
