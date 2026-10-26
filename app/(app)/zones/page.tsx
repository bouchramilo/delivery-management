"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api/client-fetch";
import { MOROCCO_MAP_DEFAULT } from "@/lib/map/morocco";
import type { DeliveryZone } from "@/types";
import { Pencil, Plus } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";

const ZoneMap = dynamic(() => import("@/components/map/ZoneMapEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[320px] items-center justify-center rounded-lg border border-dashed border-zinc-300 text-sm text-zinc-500">
      Loading map…
    </div>
  ),
});

const DEFAULT_CENTER = { lat: MOROCCO_MAP_DEFAULT.lat, lng: MOROCCO_MAP_DEFAULT.lng };

type ZoneForm = {
  name: string;
  center_lat: string;
  center_lng: string;
  radius_km: string;
  is_active: boolean;
};

const emptyForm: ZoneForm = {
  name: "",
  center_lat: String(DEFAULT_CENTER.lat),
  center_lng: String(DEFAULT_CENTER.lng),
  radius_km: "5",
  is_active: true,
};

export default function ZonesPage() {
  const { push } = useToast();
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [form, setForm] = useState<ZoneForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ zones: DeliveryZone[] }>("/api/zones");
      setZones(data.zones);
    } catch (error) {
      push(error instanceof Error ? error.message : "Failed to load zones", "error");
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  const mapCenter = useMemo(() => {
    const selected = zones.find((z) => z.id === selectedZoneId);
    if (selected) return { lat: selected.center_lat, lng: selected.center_lng };
    return {
      lat: Number(form.center_lat) || DEFAULT_CENTER.lat,
      lng: Number(form.center_lng) || DEFAULT_CENTER.lng,
    };
  }, [zones, selectedZoneId, form.center_lat, form.center_lng]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(zone: DeliveryZone) {
    setEditingId(zone.id);
    setForm({
      name: zone.name,
      center_lat: String(zone.center_lat),
      center_lng: String(zone.center_lng),
      radius_km: String(zone.radius_km),
      is_active: zone.is_active,
    });
    setModalOpen(true);
  }

  function handleMapClick(lat: number, lng: number) {
    setForm((current) => ({
      ...current,
      center_lat: lat.toFixed(6),
      center_lng: lng.toFixed(6),
    }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        center_lat: Number(form.center_lat),
        center_lng: Number(form.center_lng),
        radius_km: Number(form.radius_km),
        is_active: form.is_active,
      };

      if (editingId) {
        await apiFetch(`/api/zones/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        push("Zone updated", "success");
      } else {
        await apiFetch("/api/zones", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        push("Zone created", "success");
      }

      setModalOpen(false);
      await load();
    } catch (error) {
      push(error instanceof Error ? error.message : "Save failed", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(zone: DeliveryZone) {
    try {
      await apiFetch(`/api/zones/${zone.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !zone.is_active }),
      });
      await load();
    } catch (error) {
      push(error instanceof Error ? error.message : "Update failed", "error");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <Card className="overflow-hidden p-0">
        <div className="h-[420px]">
          <ZoneMap
            zones={zones}
            selectedZoneId={selectedZoneId}
            centerLat={mapCenter.lat}
            centerLng={mapCenter.lng}
            radiusKm={Number(form.radius_km) || 1}
            onMapClick={modalOpen ? handleMapClick : () => {}}
          />
        </div>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-zinc-500">Click the map while editing to set the zone center.</p>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New zone
          </Button>
        </div>

        {loading ? (
          <p className="text-sm text-zinc-500">Loading zones…</p>
        ) : zones.length === 0 ? (
          <Card>
            <p className="text-sm text-zinc-600">No delivery zones yet.</p>
            <Button className="mt-3" onClick={openCreate}>Create a zone</Button>
          </Card>
        ) : (
          <ul className="space-y-2">
            {zones.map((zone) => (
              <li key={zone.id}>
                <button
                  type="button"
                  onClick={() => setSelectedZoneId(zone.id)}
                  className={`w-full rounded-xl border p-3 text-left transition-colors ${
                    selectedZoneId === zone.id
                      ? "border-primary-500 bg-primary-50 dark:bg-primary-300/15"
                      : "border-primary-100 bg-surface hover:bg-surface-muted dark:border-primary-300/25"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{zone.name}</p>
                      <p className="text-xs text-zinc-500">
                        {zone.radius_km} km · {zone.center_lat.toFixed(4)}, {zone.center_lng.toFixed(4)}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {zone.is_active ? "Active" : "Inactive"}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="secondary"
                        className="px-2 py-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(zone);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        className="text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleActive(zone);
                        }}
                      >
                        {zone.is_active ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit zone" : "New delivery zone"}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="zone-name">Name</Label>
            <Input
              id="zone-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="lat">Latitude</Label>
              <Input
                id="lat"
                type="number"
                step="any"
                value={form.center_lat}
                onChange={(e) => setForm((f) => ({ ...f, center_lat: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="lng">Longitude</Label>
              <Input
                id="lng"
                type="number"
                step="any"
                value={form.center_lng}
                onChange={(e) => setForm((f) => ({ ...f, center_lng: e.target.value }))}
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="radius">Radius (km)</Label>
            <Input
              id="radius"
              type="number"
              min="0.1"
              step="0.1"
              value={form.radius_km}
              onChange={(e) => setForm((f) => ({ ...f, radius_km: e.target.value }))}
              required
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
            />
            Active zone
          </label>
          <p className="text-xs text-zinc-500">
            Tip: click the map behind this dialog to set coordinates quickly.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Save zone"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
