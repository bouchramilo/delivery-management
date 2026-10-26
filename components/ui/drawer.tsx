"use client";

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useEffect } from "react";

type DrawerProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: "md" | "lg" | "xl";
};

const widthClass = {
  md: "max-w-md",
  lg: "max-w-xl",
  xl: "max-w-2xl",
};

export function Drawer({
  open,
  title,
  description,
  onClose,
  children,
  size = "lg",
}: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!open}
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className={`fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-divider bg-surface shadow-xl transition-transform duration-300 ease-out dark:shadow-card-dark ${widthClass[size]} ${
          open ? "translate-x-0" : "pointer-events-none translate-x-full"
        }`}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-divider px-5 py-4">
          <div>
            <h2 id="drawer-title" className="text-lg font-semibold text-text-900">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-sm text-text-500">{description}</p>
            )}
          </div>
          <Button variant="ghost" className="px-2 py-2" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </aside>
    </>
  );
}
