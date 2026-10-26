"use client";

import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Package,
  ShoppingCart,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Products", icon: Package },
  { href: "/zones", label: "Zones", icon: MapPin },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
];

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-1 p-3">
      {navItems.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-primary-500 text-white shadow-sm"
                : "text-text-600 hover:bg-primary-50 hover:text-primary-700 dark:hover:bg-primary-300/10 dark:hover:text-text-900"
            }`}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({
  children,
  userEmail,
}: {
  children: React.ReactNode;
  userEmail?: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex h-dvh max-h-dvh min-h-0 overflow-hidden bg-page text-text-800">
      <aside className="hidden w-64 shrink-0 border-r border-divider bg-surface md:block dark:shadow-card-dark">
        <div className="border-b border-divider bg-gradient-to-br from-primary-50 to-secondary-50 px-4 py-5 dark:from-primary-200/20 dark:to-secondary-200/15">
          <Link href="/" className="text-sm font-bold text-primary-800 dark:text-text-900 hover:underline">
            Delivery Manager
          </Link>
          <p className="truncate text-xs text-text-500">{userEmail}</p>
        </div>
        <NavLinks pathname={pathname} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-72 border-r border-divider bg-surface shadow-xl">
            <div className="flex items-center justify-between border-b border-divider px-4 py-4">
              <p className="font-semibold">Menu</p>
              <Button variant="ghost" className="px-2 py-2" onClick={() => setMobileOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <NavLinks pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-2 border-b border-divider bg-surface/95 px-4 py-3 backdrop-blur-sm dark:bg-surface/90">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              className="px-2 py-2 md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-base font-semibold capitalize text-primary-800 dark:text-text-900">
              {pathname.split("/").filter(Boolean)[0] ?? "App"}
            </h1>
          </div>
          <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button variant="secondary" onClick={logout} className="text-sm">
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
          </div>
        </header>
        <main className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-hidden p-4 md:p-6">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden">{children}</div>
        </main>
      </div>
    </div>
  );
}
