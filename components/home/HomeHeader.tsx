import { ThemeToggle } from "@/components/theme/ThemeToggle";
import Link from "next/link";

export function HomeHeader({ isAuthenticated }: { isAuthenticated?: boolean }) {
  return (
    <header className="sticky top-0 z-30 border-b border-divider bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Link href="/" className="text-lg font-bold text-text-950">
          Delivery Manager
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-xl bg-primary-500 px-4 py-2 text-sm font-medium text-text-50 transition-colors hover:bg-primary-600"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium text-text-600 transition-colors hover:bg-primary-50 hover:text-primary-700 dark:hover:bg-surface-muted dark:hover:text-text-900"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-xl bg-primary-500 px-4 py-2 text-sm font-medium text-text-50 transition-colors hover:bg-primary-600"
              >
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
