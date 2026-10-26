import { HomeHeader } from "@/components/home/HomeHeader";
import { HeroIllustration } from "@/components/home/HeroIllustration";
import {
  MapPin,
  Package,
  Shield,
  ShoppingCart,
  Sparkles,
  Truck,
} from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: Package,
    title: "Product catalog",
    description: "Manage prices, stock, and which zones each product can reach.",
  },
  {
    icon: MapPin,
    title: "Delivery zones",
    description: "Draw coverage on the map with radius-based zones across Morocco.",
  },
  {
    icon: ShoppingCart,
    title: "Smart orders",
    description: "Validate customer location server-side before accepting an order.",
  },
  {
    icon: Shield,
    title: "Secure by default",
    description: "Your data stays isolated with authentication and row-level security.",
  },
];

export function LandingPage({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <div className="flex min-h-screen flex-col bg-page">
      <HomeHeader isAuthenticated={isAuthenticated} />

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-divider">
          <div className="pointer-events-none absolute inset-0 bg-page" />
          <div
            className="pointer-events-none absolute -right-24 top-1/4 h-72 w-72 rounded-full bg-primary-200/30 blur-3xl dark:bg-primary-500/10"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-secondary-200/25 blur-3xl dark:bg-secondary-500/10"
            aria-hidden
          />
          <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:gap-12 md:px-6 md:py-20 lg:grid-cols-2 lg:gap-14 lg:py-24">
            <div>
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-divider bg-surface px-3 py-1 text-xs font-medium text-text-600">
                <Sparkles className="h-3.5 w-3.5 text-accent-500" aria-hidden />
                Delivery operations, simplified
              </p>
              <h1 className="text-4xl font-bold leading-tight tracking-tight text-text-950 md:text-5xl lg:text-[2.75rem]">
                Manage{" "}
                <span className="text-gradient-primary">deliveries</span>
                <br />
                with{" "}
                <span className="text-gradient-secondary">maps</span>
              </h1>
              <p className="mt-5 max-w-lg text-lg leading-relaxed text-text-600">
                Plan zones, assign products, and create orders with geographic validation.
                Built for teams who need accurate coverage—not guesswork.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={isAuthenticated ? "/dashboard" : "/login"}
                  className="inline-flex items-center justify-center rounded-xl bg-secondary-100 px-5 py-3 text-sm font-semibold text-text-950 transition hover:bg-secondary-200 dark:bg-secondary-200/30 dark:text-text-950 dark:hover:bg-secondary-300/40"
                >
                  How it works
                </Link>
                {isAuthenticated ? (
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-5 py-3 text-sm font-semibold text-text-50 shadow-soft transition hover:bg-primary-600"
                  >
                    <Truck className="h-4 w-4" aria-hidden />
                    Open dashboard
                  </Link>
                ) : (
                  <Link
                    href="/signup"
                    className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-5 py-3 text-sm font-semibold text-text-50 shadow-soft transition hover:bg-primary-600"
                  >
                    Get started
                  </Link>
                )}
              </div>
            </div>
            <div className="flex justify-center lg:justify-end lg:justify-self-end">
              <HeroIllustration />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-20">
          <h2 className="text-center text-2xl font-bold text-text-950 md:text-3xl">
            Everything you need in one place
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-text-500">
            From zone setup to order confirmation—connected to your live database.
          </p>
          <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <li
                  key={feature.title}
                  className="rounded-2xl border border-divider bg-surface p-5 shadow-card transition hover:shadow-soft dark:shadow-card-dark"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-300/25 dark:text-primary-500">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <h3 className="mt-4 font-semibold text-text-900 dark:text-text-950">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-500">
                    {feature.description}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="border-t border-divider bg-surface-muted py-12">
          <div className="mx-auto max-w-6xl px-4 text-center md:px-6">
            <p className="text-sm text-text-500">Ready to run your first delivery zone?</p>
            <Link
              href={isAuthenticated ? "/zones" : "/signup"}
              className="mt-4 inline-flex rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-semibold text-text-50 transition hover:bg-primary-600"
            >
              {isAuthenticated ? "Go to zones" : "Start now"}
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-divider py-6 text-center text-xs text-text-500">
        Delivery Manager · Geographic delivery validation
      </footer>
    </div>
  );
}
