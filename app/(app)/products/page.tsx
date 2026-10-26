"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api/client-fetch";
import { formatCurrency, formatDate } from "@/lib/format";
import type { DeliveryZone, ProductWithZones } from "@/types";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

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
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

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
    setModalOpen(true);
  }

  function openEdit(product: ProductWithZones) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      price: String(product.price),
      quantity: String(product.quantity),
      zoneIds: product.zones?.map((z) => z.id) ?? [],
    });
    setModalOpen(true);
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

      setModalOpen(false);
      await load();
    } catch (error) {
      push(error instanceof Error ? error.message : "Save failed", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(product: ProductWithZones) {
    if (!window.confirm(`Delete “${product.name}”? This cannot be undone.`)) return;
    try {
      await apiFetch(`/api/products/${product.id}`, { method: "DELETE" });
      push("Product deleted", "success");
      await load();
    } catch (error) {
      push(error instanceof Error ? error.message : "Delete failed", "error");
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-500">Manage catalog items and zone eligibility.</p>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          New product
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Loading products…</p>
      ) : products.length === 0 ? (
        <Card>
          <p className="text-sm text-zinc-600">No products yet.</p>
          <Button className="mt-3" onClick={openCreate}>Create your first product</Button>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-primary-100 bg-surface dark:border-primary-300/25">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-surface-muted text-text-500">
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
              {products.map((product) => (
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
                      <Button variant="danger" className="px-2 py-2" onClick={() => handleDelete(product)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit product" : "New product"}
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
              <div className="mt-2 max-h-40 space-y-2 overflow-y-auto rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
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
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Save product"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
