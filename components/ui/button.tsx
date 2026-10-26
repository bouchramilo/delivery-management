import { type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const variants: Record<Variant, string> = {
  primary: "bg-primary-500 text-white hover:bg-primary-600",
  secondary:
    "border border-divider bg-surface text-primary-800 hover:bg-primary-50 dark:text-text-900 dark:hover:bg-surface-muted",
  danger: "bg-accent-600 text-white hover:bg-accent-700",
  ghost: "text-text-600 hover:bg-primary-50 hover:text-primary-700",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export function Button({
  className = "",
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-400 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
