"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Drawer } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api/client-fetch";
import { selectBestDeliveryZone } from "@/lib/delivery/zone-selection";
import { formatCurrency } from "@/lib/format";
import { MOROCCO_MAP_DEFAULT } from "@/lib/map/morocco";
import type { DeliveryZone, OrderWithRelations, ProductWithZones } from "@/types";
import dynamic from "next/dynamic";
import { OrderCard } from "@/components/orders/OrderCard";
import { FilterBar, FilterField, FilterSelect } from "@/components/ui/filter-bar";
import { Pagination } from "@/components/ui/pagination";
import { usePagination } from "@/lib/pagination/use-pagination";
import { Plus } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

const OrderLocationMap = dynamic(() => import("@/components/map/OrderLocationMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[280px] items-center justify-center rounded-lg border border-dashed border-zinc-300 text-sm text-zinc-500">
      Loading map…
    </div>
  ),
});

const DEFAULT_CENTER = { lat: MOROCCO_MAP_DEFAULT.lat, lng: MOROCCO_MAP_DEFAULT.lng };

function OrdersPageContent() {
  const { push } = useToast();
  const searchParams = useSearchParams();

  const [orders, setOrders] = useState<OrderWithRelations[]>([]);
  const [products, setProducts] = useState<ProductWithZones[]>([]);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);

  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [customerLat, setCustomerLat] = useState(String(DEFAULT_CENTER.lat));
  const [customerLng, setCustomerLng] = useState(String(DEFAULT_CENTER.lng));
  const [submitting, setSubmitting] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterZoneId, setFilterZoneId] = useState("");
  const [filterProductId, setFilterProductId] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "accepted">("all");

  useEffect(() => {
    const zoneFromUrl = searchParams.get("zoneId");
    if (zoneFromUrl) {
      queueMicrotask(() => setFilterZoneId(zoneFromUrl));
    }
  }, [searchParams]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersRes, productsRes, zonesRes] = await Promise.all([
        apiFetch<{ orders: OrderWithRelations[] }>("/api/orders"),
        apiFetch<{ products: ProductWithZones[] }>("/api/products"),
        apiFetch<{ zones: DeliveryZone[] }>("/api/zones"),
      ]);
      setOrders(ordersRes.orders);
      setProducts(productsRes.products);
      setZones(zonesRes.zones);
    } catch (error) {
      push(error instanceof Error ? error.message : "Failed to load orders", "error");
    } finally {
      setLoading(false);
    }
  }, [push]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((order) => {
      if (filterZoneId && order.zone_id !== filterZoneId) return false;
      if (filterProductId && order.product_id !== filterProductId) return false;
      if (filterStatus !== "all" && order.status !== filterStatus) return false;
      if (query) {
        const haystack = [
          order.product?.name ?? "",
          order.zone?.name ?? "",
          order.id,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [orders, search, filterZoneId, filterProductId, filterStatus]);

  const {
    pageItems: pagedOrders,
    page,
    setPage,
    totalPages,
    totalItems: filteredCount,
    rangeStart,
    rangeEnd,
    resetPage,
  } = usePagination(filteredOrders);

  function resetOrderFilters() {
    setSearch("");
    setFilterZoneId("");
    setFilterProductId("");
    setFilterStatus("all");
    resetPage();
  }

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  const orderableProducts = useMemo(
    () =>
      products.filter((product) => {
        const assignedActiveZones = (product.zones ?? []).filter((z) =>
          zones.some((zone) => zone.id === z.id && zone.is_active)
        );
        return product.quantity > 0 && assignedActiveZones.length > 0;
      }),
    [products, zones]
  );

  const selectedProduct = products.find((p) => p.id === productId);

  const eligibleZones = useMemo(() => {
    if (!selectedProduct) return [];
    const zoneIds = new Set((selectedProduct.zones ?? []).map((z) => z.id));
    return zones
      .filter((z) => zoneIds.has(z.id) && z.is_active)
      .map((z) => ({
        id: z.id,
        name: z.name,
        center_lat: z.center_lat,
        center_lng: z.center_lng,
        radius_km: z.radius_km,
        is_active: z.is_active,
      }));
  }, [selectedProduct, zones]);

  const coverage = useMemo(() => {
    const lat = Number(customerLat);
    const lng = Number(customerLng);
    if (Number.isNaN(lat) || Number.isNaN(lng) || eligibleZones.length === 0) {
      return null;
    }
    return selectBestDeliveryZone(lat, lng, eligibleZones);
  }, [customerLat, customerLng, eligibleZones]);

  const estimatedTotal = useMemo(() => {
    const qty = Number.parseInt(quantity, 10);
    if (!selectedProduct || Number.isNaN(qty) || qty <= 0) return null;
    return Number(selectedProduct.price) * qty;
  }, [selectedProduct, quantity]);

  const canSubmit =
    !!selectedProduct &&
    !!coverage &&
    Number.parseInt(quantity, 10) > 0 &&
    Number.parseInt(quantity, 10) <= selectedProduct.quantity &&
    !submitting;

  function openCreateDrawer() {
    setProductId("");
    setQuantity("1");
    setCustomerLat(String(DEFAULT_CENTER.lat));
    setCustomerLng(String(DEFAULT_CENTER.lng));
    setDrawerOpen(true);
  }

  function closeCreateDrawer() {
    if (submitting) return;
    setDrawerOpen(false);
  }

  async function handleCreateOrder(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit || !coverage) {
      push(
        "This delivery location is outside all available delivery zones for the selected product.",
        "error"
      );
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          productId,
          quantity: Number.parseInt(quantity, 10),
          customerLat: Number(customerLat),
          customerLng: Number(customerLng),
        }),
      });
      push("Order created successfully", "success");
      setDrawerOpen(false);
      setProductId("");
      setQuantity("1");
      await load();
    } catch (error) {
      push(error instanceof Error ? error.message : "Order failed", "error");
    } finally {
      setSubmitting(false);
    }
  }

  const orderFilters = (
    <FilterBar
      variant="plain"
      onReset={resetOrderFilters}
      resultCount={filteredOrders.length}
      totalCount={orders.length}
    >
      <FilterField label="Search" className="min-w-[180px] flex-[2]">
        <Input
          placeholder="Product, zone, order ID…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            resetPage();
          }}
        />
      </FilterField>
      <FilterSelect
        label="Zone"
        value={filterZoneId}
        onChange={(v) => {
          setFilterZoneId(v);
          resetPage();
        }}
        options={[
          { value: "", label: "All zones" },
          ...zones.map((z) => ({ value: z.id, label: z.name })),
        ]}
      />
      <FilterSelect
        label="Product"
        value={filterProductId}
        onChange={(v) => {
          setFilterProductId(v);
          resetPage();
        }}
        options={[
          { value: "", label: "All products" },
          ...products.map((p) => ({ value: p.id, label: p.name })),
        ]}
      />
      <FilterSelect
        label="Status"
        value={filterStatus}
        onChange={(v) => {
          setFilterStatus(v as "all" | "accepted");
          resetPage();
        }}
        options={[
          { value: "all", label: "All statuses" },
          { value: "accepted", label: "Accepted" },
        ]}
      />
    </FilterBar>
  );

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-500">View and filter delivery orders.</p>
        <Button onClick={openCreateDrawer}>
          <Plus className="h-4 w-4" />
          New order
        </Button>
      </div>

      {loading ? (
        <p className="shrink-0 text-sm text-text-500">Loading orders…</p>
      ) : orders.length === 0 ? (
        <Card className="shrink-0">
          <p className="text-sm text-text-600">No orders yet.</p>
          <Button className="mt-3" onClick={openCreateDrawer}>Create your first order</Button>
        </Card>
      ) : (
        <section
          className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-divider bg-surface shadow-card dark:shadow-card-dark"
          aria-label="Orders list panel"
        >
          <div className="shrink-0 border-b border-divider bg-surface-muted/50 p-3 md:p-4">
            {orderFilters}
          </div>

          {filteredOrders.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
              <p className="text-sm text-text-600">No orders match your filters.</p>
              <Button variant="secondary" onClick={resetOrderFilters}>
                Reset filters
              </Button>
            </div>
          ) : (
            <>
              <div
                className="list-scroll min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain bg-page/40 p-3 md:p-4"
                role="list"
                aria-label="Orders"
              >
                {pagedOrders.map((order) => (
                  <div key={order.id} role="listitem">
                    <OrderCard order={order} />
                  </div>
                ))}
              </div>
              <Pagination
                className="shrink-0 rounded-b-2xl border-t border-divider bg-surface"
                page={page}
                totalPages={totalPages}
                totalItems={filteredCount}
                rangeStart={rangeStart}
                rangeEnd={rangeEnd}
                onPageChange={setPage}
              />
            </>
          )}
        </section>
      )}

      <Drawer
        open={drawerOpen}
        onClose={closeCreateDrawer}
        size="xl"
        title="New order"
        description="Choose a product, set quantity, and pick the customer location on the map."
      >
        <form className="space-y-4" onSubmit={handleCreateOrder}>
          <div>
            <Label htmlFor="product">Product</Label>
            <select
              id="product"
              className="w-full rounded-lg border border-primary-200 bg-surface px-3 py-2 text-sm text-text-800 dark:border-primary-400/30"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              required
            >
              <option value="">Select a product</option>
              {orderableProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} · stock {product.quantity} · {formatCurrency(Number(product.price))}
                </option>
              ))}
            </select>
            {orderableProducts.length === 0 && (
              <p className="mt-1 text-xs text-text-500">
                Add stock and active zone assignments before creating orders.
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="clat">Customer latitude</Label>
              <Input
                id="clat"
                type="number"
                step="any"
                value={customerLat}
                onChange={(e) => setCustomerLat(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="clng">Customer longitude</Label>
              <Input
                id="clng"
                type="number"
                step="any"
                value={customerLng}
                onChange={(e) => setCustomerLng(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-divider">
            <div className="h-[min(50vh,320px)]">
              <OrderLocationMap
                lat={Number(customerLat) || DEFAULT_CENTER.lat}
                lng={Number(customerLng) || DEFAULT_CENTER.lng}
                zones={eligibleZones}
                selectedZoneId={coverage?.zone.id ?? null}
                onMapClick={(lat, lng) => {
                  setCustomerLat(lat.toFixed(6));
                  setCustomerLng(lng.toFixed(6));
                }}
              />
            </div>
          </div>

          <div className="rounded-lg bg-surface-muted p-3 text-sm">
            {coverage ? (
              <p className="text-emerald-700 dark:text-emerald-400">
                Covered by <strong>{coverage.zone.name}</strong> (
                {coverage.distanceKm.toFixed(2)} km from center)
              </p>
            ) : selectedProduct ? (
              <p className="text-red-600">
                This delivery location is outside all available delivery zones for the selected
                product.
              </p>
            ) : (
              <p className="text-text-500">Select a product and delivery location.</p>
            )}
            {estimatedTotal != null && (
              <p className="mt-1 text-text-600">
                Estimated total: {formatCurrency(estimatedTotal)}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pb-2">
            <Button type="button" variant="secondary" onClick={closeCreateDrawer} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {submitting ? "Creating order…" : "Create order"}
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<p className="text-sm text-zinc-500">Loading orders…</p>}>
      <OrdersPageContent />
    </Suspense>
  );
}
