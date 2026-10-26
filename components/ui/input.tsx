import { type InputHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-lg border border-divider bg-surface px-3 py-2 text-sm text-text-800 shadow-sm placeholder:text-text-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-300/20 ${className}`}
      {...props}
    />
  );
}
