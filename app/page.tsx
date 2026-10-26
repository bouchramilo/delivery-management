import { LandingPage } from "@/components/home/LandingPage";
import { getAuthenticatedUser } from "@/lib/api/auth";
import { connection } from "next/server";

export const instant = false;

export default async function Home() {
  await connection();
  const user = await getAuthenticatedUser();

  return <LandingPage isAuthenticated={!!user} />;
}
