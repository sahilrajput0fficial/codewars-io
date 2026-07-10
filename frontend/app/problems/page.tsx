import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { ProblemsFeature } from "@/features/problems";

export const dynamic = "force-dynamic";

export default async function ProblemsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  if (!token) redirect("/auth/login");

  return (
    <div
      className="flex min-h-screen"
      style={{ background: "var(--color-bg)", color: "var(--color-text-primary)" }}
    >
      {/* Persistent Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 min-h-screen pb-24 overflow-x-hidden">
        <Navbar
          breadcrumbs={[
            { label: "Problems", href: "/problems" },
            { label: "Challenge Arena" },
          ]}
        />

        {/* Full-width Problems Feature Panel */}
        <div className="w-full px-8 py-8">
          <ProblemsFeature />
        </div>
      </div>
    </div>
  );
}
