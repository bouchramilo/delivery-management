import { createClient as createServerClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(cookieStore);
}
