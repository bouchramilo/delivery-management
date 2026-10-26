"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Drawer } from "@/components/ui/drawer";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api/client-fetch";
import { MOROCCO_MAP_DEFAULT } from "@/lib/map/morocco";
import type { DeliveryZone } from "@/types";
import { FilterBar, FilterField, FilterSelect } from "@/components/ui/filter-bar";
import { Pagination } from "@/components/ui/pagination";
import { usePagination } from "@/lib/pagination/use-pagination";
import { MapPin, Pencil, Plus } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";

const ZoneMap = dynamic(() => import("@/components/map/ZoneMapEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[200px] items-center justify-center rounded-lg border border-dashed border-divider text-sm text-text-500">
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [form, setForm] = useState<ZoneForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const filteredZones = useMemo(() => {
    const query = search.trim().toLowerCase();
    return zones.filter((zone) => {
      if (query && !zone.name.toLowerCase().includes(query)) return false;
      if (statusFilter === "active" && !zone.is_active) return false;
      if (statusFilter === "inactive" && zone.is_active) return false;
      return true;
    });
  }, [zones, search, statusFilter]);

  const {
    pageItems: pagedZones,
    page,
    setPage,
    totalPages,
    totalItems: filteredCount,
    rangeStart,
    rangeEnd,
    resetPage,
  } = usePagination(filteredZones);

  function resetFilters() {
    setSearch("");
    setStatusFilter("all");
    resetPage();
  }

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

  const selectedZone = zones.find((z) => z.id === selectedZoneId);

  const overviewCenter = useMemo(() => {
    if (selectedZone) {
      return { lat: selectedZone.center_lat, lng: selectedZone.center_lng };
    }
    return DEFAULT_CENTER;
  }, [selectedZone]);

  const formCenter = useMemo(
    () => ({
      lat: Number(form.center_lat) || DEFAULT_CENTER.lat,
      lng: Number(form.center_lng) || DEFAULT_CENTER.lng,
    }),
    [form.center_lat, form.center_lng]
  );

  const formRadiusKm = Number(form.radius_km) || 1;

  const zonesOnPickerMap = useMemo(
    () => (editingId ? zones.filter((z) => z.id !== editingId) : zones),
    [zones, editingId]
  );

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setDrawerOpen(true);
  }

  function openEdit(zone: DeliveryZone) {
    setEditingId(zone.id);
    setSelectedZoneId(zone.id);
    setForm({
      name: zone.name,
      center_lat: String(zone.center_lat),
      center_lng: String(zone.center_lng),
      radius_km: String(zone.radius_km),
      is_active: zone.is_active,
    });
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setEditingId(null);
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

      closeDrawer();
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
    <div className="grid min-h-0 flex-1 gap-6 overflow-hidden lg:grid-cols-[1.2fr_1fr]">
      <Card className="overflow-hidden p-0 lg:min-h-0">
        <div className="h-[280px] lg:h-full lg:min-h-[320px]">
          <ZoneMap
            zones={filteredZones}
            selectedZoneId={selectedZoneId}
            centerLat={overviewCenter.lat}
            centerLng={overviewCenter.lng}
            radiusKm={selectedZone?.radius_km ?? 0}
            showDraft={Boolean(selectedZone)}
            onMapClick={() => {}}
          />
        </div>
      </Card>

      <div className="flex min-h-0 flex-col gap-4 overflow-hidden">
        <div className="flex shrink-0 items-center justify-between gap-3">
          <p className="text-sm text-text-500">
            Select a zone in the list or create a new one.
          </p>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New zone
          </Button>
        </div>

        {!loading && zones.length > 0 && (
          <div className="shrink-0">
          <FilterBar
            onReset={resetFilters}
            resultCount={filteredZones.length}
            totalCount={zones.length}
          >
            <FilterField label="Search" className="min-w-[200px] flex-[2]">
              <Input
                placeholder="Zone name…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  resetPage();
                }}
              />
            </FilterField>
            <FilterSelect
              label="Status"
              value={statusFilter}
              onChange={(v) => {
                setStatusFilter(v as "all" | "active" | "inactive");
                resetPage();
              }}
              options={[
                { value: "all", label: "All statuses" },
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
            />
          </FilterBar>
          </div>
        )}

        {loading ? (
          <p className="shrink-0 text-sm text-text-500">Loading zones…</p>
        ) : zones.length === 0 ? (
          <Card className="shrink-0">
            <p className="text-sm text-text-600">No delivery zones yet.</p>
            <Button className="mt-3" onClick={openCreate}>Create a zone</Button>
          </Card>
        ) : filteredZones.length === 0 ? (
          <Card className="shrink-0">
            <p className="text-sm text-text-600">No zones match your filters.</p>
            <Button className="mt-3" variant="secondary" onClick={resetFilters}>
              Reset filters
            </Button>
          </Card>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-divider bg-surface">
            <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2">
            {pagedZones.map((zone) => (
              <li key={zone.id}>
                <button
                  type="button"
                  onClick={() => setSelectedZoneId(zone.id)}
                  className={`w-full rounded-xl border p-3 text-left transition-colors ${
                    selectedZoneId === zone.id
                      ? "border-primary-500 bg-primary-50 dark:bg-primary-300/15"
                      : "border-divider bg-surface hover:bg-surface-muted"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{zone.name}</p>
                      <p className="text-xs text-text-500">
                        {zone.radius_km} km · {zone.center_lat.toFixed(4)}, {zone.center_lng.toFixed(4)}
                      </p>
                      <p className="text-xs text-text-500">
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
      </div>

      <Drawer
        open={drawerOpen}
        onClose={closeDrawer}
        size="xl"
        title={editingId ? "Edit delivery zone" : "New delivery zone"}
        description="Click the map to set the zone center. Adjust radius and details below."
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

          <div>
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary-500" aria-hidden />
              Zone center — click on the map
            </Label>
            <p className="mb-2 text-xs text-text-500">
              Click to set latitude and longitude. The circle shows the delivery radius.
            </p>
            <div className="h-[min(50vh,320px)] overflow-hidden rounded-xl border border-divider">
              <ZoneMap
                zones={zonesOnPickerMap}
                centerLat={formCenter.lat}
                centerLng={formCenter.lng}
                radiusKm={formRadiusKm}
                pickMode
                showDraft
                onMapClick={handleMapClick}
              />
            </div>
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
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={closeDrawer}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Save zone"}
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
