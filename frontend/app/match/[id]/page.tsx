import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { MatchArena } from "@/features/match";
import { fetchMatchById } from "@/services/match-service";

export const dynamic = "force-dynamic";

interface MatchPageProps {
  params: Promise<{ id: string }>;
}

export default async function LiveMatchPage({ params }: MatchPageProps) {
  const cookieStore = await cookies();
  const { id } = await params;

  let realMatchData;
  let isUnauthorized = false;

  try {
    realMatchData = await fetchMatchById(id, cookieStore.toString());
  } catch (err: any) {
    console.error(`[LiveMatchPage] Error loading match ${id}:`, err);
    if (err?.status === 401 || err?.message?.includes("(401)")) {
      isUnauthorized = true;
    } else {
      notFound();
    }
  }

  if (isUnauthorized) {
    redirect("/login");
  }

  return <MatchArena initialMatchData={realMatchData!} />;
}
