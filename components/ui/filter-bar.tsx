import { Label } from "@/components/ui/label";
export function FilterBar({
  children,
  onReset,
  resultCount,
  totalCount,
  variant = "card",
}: {
  children: React.ReactNode;
  onReset?: () => void;
  resultCount?: number;
  totalCount?: number;
  variant?: "card" | "plain";
}) {
  const showCount =
    resultCount !== undefined &&
    totalCount !== undefined &&
    (resultCount !== totalCount || onReset);

  return (
    <div className="space-y-2">
      <div
        className={`flex flex-wrap items-end gap-3 ${
          variant === "card"
            ? "rounded-xl border border-divider bg-surface p-4"
            : ""
        }`}
      >
        {children}
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="mb-0.5 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-500"
          >
            Reset filters
          </button>
        )}
      </div>
      {showCount && resultCount !== totalCount && (
        <p className="text-xs text-text-500">
          {resultCount} match{resultCount === 1 ? "" : "es"} (of {totalCount} total)
        </p>
      )}
    </div>
  );
}

export function FilterField({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`min-w-[140px] flex-1 ${className}`}>
      <Label className="mb-1 text-xs text-text-500">{label}</Label>
      {children}
    </div>
  );
}

const selectClassName =
  "w-full rounded-lg border border-divider bg-surface px-3 py-2 text-sm text-text-800 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-300/20";

export function FilterSelect({
  label,
  value,
  onChange,
  options,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <FilterField label={label} className={className}>
      <select
        className={selectClassName}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FilterField>
  );
}
