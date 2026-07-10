import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { ProblemDetailsFeature } from "@/features/problems";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProblemSlugPage({ params }: PageProps) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  if (!token) redirect("/auth/login");

  const { slug } = await params;

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{ background: "var(--color-bg)", color: "var(--color-text-primary)" }}
    >
      {/* Render Problem Details Feature which internally renders layout Navbar */}
      <ProblemDetailsFeature initialToken={token} slug={slug}/>
    </div>
  );
}
