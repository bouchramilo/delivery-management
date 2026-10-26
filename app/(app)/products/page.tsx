"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Drawer } from "@/components/ui/drawer";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api/client-fetch";
import { formatCurrency, formatDate } from "@/lib/format";
import type { DeliveryZone, ProductWithZones } from "@/types";
import { FilterBar, FilterField, FilterSelect } from "@/components/ui/filter-bar";
import { Pagination } from "@/components/ui/pagination";
import { usePagination } from "@/lib/pagination/use-pagination";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type StockFilter = "all" | "in_stock" | "out_of_stock";
type ZoneFilter = "all" | "unassigned" | string;

type ProductFormState = {
  name: string;
  price: string;
  quantity: string;
  zoneIds: string[];
};

const emptyForm: ProductFormState = {
  name: "",
  price: "",
  quantity: "0",
  zoneIds: [],
};

export default function ProductsPage() {
  const { push } = useToast();
  const [products, setProducts] = useState<ProductWithZones[]>([]);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProductWithZones | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [zoneFilter, setZoneFilter] = useState<ZoneFilter>("all");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) => {
      if (query && !product.name.toLowerCase().includes(query)) {
        return false;
      }
      if (stockFilter === "in_stock" && product.quantity <= 0) return false;
      if (stockFilter === "out_of_stock" && product.quantity > 0) return false;
      if (zoneFilter === "unassigned" && (product.zones?.length ?? 0) > 0) {
        return false;
      }
      if (
        zoneFilter !== "all" &&
        zoneFilter !== "unassigned" &&
        !product.zones?.some((z) => z.id === zoneFilter)
      ) {
        return false;
      }
      return true;
    });
  }, [products, search, stockFilter, zoneFilter]);

  const {
    pageItems: pagedProducts,
    page,
    setPage,
    totalPages,
    totalItems: filteredCount,
    rangeStart,
    rangeEnd,
    resetPage,
  } = usePagination(filteredProducts);

  function resetFilters() {
    setSearch("");
    setZoneFilter("all");
    setStockFilter("all");
    resetPage();
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [productsRes, zonesRes] = await Promise.all([
        apiFetch<{ products: ProductWithZones[] }>("/api/products"),
        apiFetch<{ zones: DeliveryZone[] }>("/api/zones"),
      ]);
      setProducts(productsRes.products);
      setZones(zonesRes.zones);
    } catch (error) {
      push(error instanceof Error ? error.message : "Failed to load products", "error");
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setDrawerOpen(true);
  }

  function openEdit(product: ProductWithZones) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      price: String(product.price),
      quantity: String(product.quantity),
      zoneIds: product.zones?.map((z) => z.id) ?? [],
    });
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setEditingId(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        price: Number(form.price),
        quantity: Number.parseInt(form.quantity, 10),
        zoneIds: form.zoneIds,
      };

      if (!payload.name) {
        push("Product name is required", "error");
        return;
      }
      if (Number.isNaN(payload.price) || payload.price < 0) {
        push("Enter a valid price", "error");
        return;
      }
      if (Number.isNaN(payload.quantity) || payload.quantity < 0) {
        push("Enter a valid quantity", "error");
        return;
      }

      if (editingId) {
        await apiFetch(`/api/products/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        push("Product updated", "success");
      } else {
        await apiFetch("/api/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        push("Product created", "success");
      }

      closeDrawer();
      await load();
    } catch (error) {
      push(error instanceof Error ? error.message : "Save failed", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/products/${deleteTarget.id}`, { method: "DELETE" });
      push("Product deleted", "success");
      setDeleteTarget(null);
      await load();
    } catch (error) {
      push(error instanceof Error ? error.message : "Delete failed", "error");
    } finally {
      setDeleting(false);
    }
  }

  function toggleZone(zoneId: string) {
    setForm((current) => ({
      ...current,
      zoneIds: current.zoneIds.includes(zoneId)
        ? current.zoneIds.filter((id) => id !== zoneId)
        : [...current.zoneIds, zoneId],
    }));
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-500">Manage catalog items and zone eligibility.</p>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          New product
        </Button>
      </div>

      {!loading && products.length > 0 && (
        <div className="shrink-0">
        <FilterBar
          onReset={resetFilters}
          resultCount={filteredProducts.length}
          totalCount={products.length}
        >
          <FilterField label="Search" className="min-w-[200px] flex-[2]">
            <Input
              placeholder="Product name…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                resetPage();
              }}
            />
          </FilterField>
          <FilterSelect
            label="Delivery zone"
            value={zoneFilter}
            onChange={(v) => {
              setZoneFilter(v as ZoneFilter);
              resetPage();
            }}
            options={[
              { value: "all", label: "All zones" },
              { value: "unassigned", label: "No zone assigned" },
              ...zones.map((z) => ({ value: z.id, label: z.name })),
            ]}
          />
          <FilterSelect
            label="Stock"
            value={stockFilter}
            onChange={(v) => {
              setStockFilter(v as StockFilter);
              resetPage();
            }}
            options={[
              { value: "all", label: "All stock levels" },
              { value: "in_stock", label: "In stock" },
              { value: "out_of_stock", label: "Out of stock" },
            ]}
          />
        </FilterBar>
        </div>
      )}

      {loading ? (
        <p className="shrink-0 text-sm text-text-500">Loading products…</p>
      ) : products.length === 0 ? (
        <Card className="shrink-0">
          <p className="text-sm text-text-600">No products yet.</p>
          <Button className="mt-3" onClick={openCreate}>Create your first product</Button>
        </Card>
      ) : filteredProducts.length === 0 ? (
        <Card className="shrink-0">
          <p className="text-sm text-text-600">No products match your filters.</p>
          <Button className="mt-3" variant="secondary" onClick={resetFilters}>
            Reset filters
          </Button>
        </Card>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-divider bg-surface">
          <div className="min-h-0 flex-1 overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-surface-muted text-text-500 shadow-[0_1px_0_0_var(--color-divider)]">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Zones</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedProducts.map((product) => (
                <tr key={product.id} className="border-t border-primary-100 dark:border-primary-300/20">
                  <td className="px-4 py-3 font-medium">{product.name}</td>
                  <td className="px-4 py-3">{formatCurrency(Number(product.price))}</td>
                  <td className="px-4 py-3">{product.quantity}</td>
                  <td className="px-4 py-3">
                    {product.zones?.length
                      ? product.zones.map((z) => z.name).join(", ")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{formatDate(product.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button variant="secondary" className="px-2 py-2" onClick={() => openEdit(product)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="danger" className="px-2 py-2" onClick={() => setDeleteTarget(product)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={filteredCount}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            onPageChange={setPage}
          />
        </div>
      )}

      <Drawer
        open={drawerOpen}
        onClose={closeDrawer}
        size="md"
        title={editingId ? "Edit product" : "New product"}
        description="Set price, stock, and eligible delivery zones."
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                step="1"
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                required
              />
            </div>
          </div>
          <div>
            <Label>Delivery zones</Label>
            {zones.length === 0 ? (
              <p className="text-sm text-zinc-500">Create a zone first on the Zones page.</p>
            ) : (
              <div className="mt-2 max-h-40 space-y-2 overflow-y-auto rounded-lg border border-divider p-3">
                {zones.map((zone) => (
                  <label key={zone.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.zoneIds.includes(zone.id)}
                      onChange={() => toggleZone(zone.id)}
                    />
                    <span>
                      {zone.name}
                      {!zone.is_active && (
                        <span className="ml-1 text-xs text-zinc-500">(inactive)</span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={closeDrawer}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Save product"}
            </Button>
          </div>
        </form>
      </Drawer>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete product?"
        description={
          deleteTarget
            ? `“${deleteTarget.name}” will be permanently removed. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
