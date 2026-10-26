import { requireUser } from "@/lib/api/auth";
import { apiError, handleApiError } from "@/lib/api/response";
import { createClient } from "@/lib/supabase/server";
import { zoneBodySchema } from "@/lib/validations/zone";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await requireUser();
    const supabase = await createClient();

    const { data: zones, error } = await supabase
      .from("delivery_zones")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ zones: zones ?? [] });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const parsed = zoneBodySchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "Invalid zone data",
        400
      );
    }

    const supabase = await createClient();
    const { data: zone, error } = await supabase
      .from("delivery_zones")
      .insert({
        user_id: user.id,
        ...parsed.data,
      })
      .select()
      .single();

    if (error || !zone) {
      throw error ?? new Error("Failed to create zone");
    }

    return NextResponse.json({ zone }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
