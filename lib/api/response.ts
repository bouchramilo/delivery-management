import { NextResponse } from "next/server";
import { AuthError } from "@/lib/api/auth";

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "INSUFFICIENT_STOCK"
  | "OUTSIDE_DELIVERY_ZONE"
  | "CONFLICT"
  | "INTERNAL_ERROR";

export function apiError(
  code: ApiErrorCode,
  message: string,
  status: number
) {
  return NextResponse.json({ error: { code, message } }, { status });
}

type PostgrestLikeError = {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
};

function asPostgrestError(error: unknown): PostgrestLikeError | null {
  if (!error || typeof error !== "object") return null;
  const e = error as PostgrestLikeError;
  if (typeof e.message === "string") return e;
  return null;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  const pg = asPostgrestError(error);
  if (pg?.message) return pg.message;
  return "Unexpected error";
}

function getErrorCode(error: unknown): string | undefined {
  const pg = asPostgrestError(error);
  return pg?.code;
}

export function handleApiError(error: unknown) {
  if (error instanceof AuthError) {
    return apiError("UNAUTHORIZED", error.message, 401);
  }

  const message = getErrorMessage(error);
  const code = getErrorCode(error);

  if (
    code === "PGRST205" ||
    message.includes("schema cache") ||
    message.includes("does not exist") ||
    message.includes("Could not find the table")
  ) {
    return apiError(
      "INTERNAL_ERROR",
      "Database tables are missing. Run supabase/migrations/001_delivery_management.sql in the Supabase SQL Editor, then reload the app.",
      503
    );
  }

  if (code === "PGRST202" || message.includes("create_order_atomic")) {
    return apiError(
      "INTERNAL_ERROR",
      "Database function create_order_atomic is missing. Re-run the full SQL migration in Supabase.",
      503
    );
  }

  if (message.includes("insufficient stock")) {
    return apiError("INSUFFICIENT_STOCK", "Not enough stock for this order.", 422);
  }
  if (message.includes("outside delivery zone")) {
    return apiError(
      "OUTSIDE_DELIVERY_ZONE",
      "This delivery location is outside all available delivery zones for the selected product.",
      422
    );
  }
  if (message.includes("product not found")) {
    return apiError("NOT_FOUND", "Product not found.", 404);
  }
  if (message.includes("violates foreign key") || message.includes("still referenced")) {
    return apiError(
      "CONFLICT",
      "This item cannot be deleted because it is referenced by existing orders.",
      409
    );
  }

  console.error(error);
  return apiError("INTERNAL_ERROR", "Something went wrong. Please try again.", 500);
}
