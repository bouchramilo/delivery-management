import { requireUser } from "@/lib/api/auth";
import { apiError, handleApiError } from "@/lib/api/response";
import { createClient } from "@/lib/supabase/server";
import { zonePatchSchema } from "@/lib/validations/zone";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const body = await request.json();
    const parsed = zonePatchSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "Invalid zone data",
        400
      );
    }

    if (Object.keys(parsed.data).length === 0) {
      return apiError("VALIDATION_ERROR", "No fields to update.", 400);
    }

    const supabase = await createClient();
    const { data: zone, error } = await supabase
      .from("delivery_zones")
      .update(parsed.data)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .maybeSingle();

    if (error) {
      throw error;
    }
    if (!zone) {
      return apiError("NOT_FOUND", "Zone not found.", 404);
    }

    return NextResponse.json({ zone });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const supabase = await createClient();

    const { error } = await supabase
      .from("delivery_zones")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
