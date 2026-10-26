import { type HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-divider bg-surface p-4 shadow-card dark:shadow-card-dark ${className}`}
      {...props}
    />
  );
}

export function CardTitle({ className = "", ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={`text-sm font-medium text-text-500 ${className}`}
      {...props}
    />
  );
}

export function CardValue({ className = "", ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`mt-1 text-2xl font-semibold text-text-800 ${className}`} {...props} />
  );
}
