import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

export async function getAuthenticatedUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function requireUser(): Promise<User> {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new AuthError();
  }
  return user;
}

export class AuthError extends Error {
  readonly status = 401;
  readonly code = "UNAUTHORIZED";

  constructor(message = "Authentication required") {
    super(message);
    this.name = "AuthError";
  }
}
