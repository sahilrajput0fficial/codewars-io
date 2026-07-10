"use client";

import Link from "next/link";
import { ThemeSwitcher } from "@/components/theme-switcher";
import SidebarIcon from "@/components/menu";
import { useMatchStore } from "@/stores/match-store";
import { useCurrentUser } from "@/hooks/use-current-user";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface NavbarProps {
  breadcrumbs?: BreadcrumbItem[];
  extra?: React.ReactNode;
}

export function SidebarTrigger() {
  const toggle = () => {
    window.dispatchEvent(new CustomEvent("toggle-sidebar"));
  };

  return (
    <button
      id="sidebar-toggle-btn"
      onClick={toggle}
      className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all mr-2 flex items-center justify-center rounded hover:bg-[var(--color-surface-2)]"
      title="Toggle Sidebar"
    >
      <SidebarIcon className="w-5 h-5" />
    </button>
  );
}

export function Navbar({ breadcrumbs, extra }: NavbarProps) {
  // ── Hydrate the global userStore on every page that mounts this navbar ──
  useCurrentUser();

  const status = useMatchStore((state) => state.status);
  const startQueue = useMatchStore((state) => state.startQueue);
  const cancelQueue = useMatchStore((state) => state.cancelQueue);

  const isSearching = status === "searching";

  const handleToggleQueue = () => {
    if (isSearching) {
      cancelQueue();
    } else {
      startQueue();
    }
  };

  return (
    <nav
      className="sticky top-0 z-40 h-14 flex items-center justify-between px-6 border-b backdrop-blur-md relative"
      style={{
        background: "var(--color-surface)",
        borderColor: "var(--color-border)",
      }}
    >
      {/* Left Section: Sidebar Trigger & Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm font-semibold">
        <SidebarTrigger />
        {breadcrumbs &&
          breadcrumbs.map((item, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <div key={idx} className="flex items-center gap-2">
                {idx > 0 && (
                  <span style={{ color: "var(--color-text-tertiary)" }}>/</span>
                )}
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="hover:underline transition-all"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    style={{
                      color: isLast
                        ? "var(--color-text-primary)"
                        : "var(--color-text-secondary)",
                    }}
                  >
                    {item.label}
                  </span>
                )}
              </div>
            );
          })}
      </div>

      {extra && (
        <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center justify-center">
          {extra}
        </div>
      )}

      {/* Right Section: Theme switcher & Battle CTA */}
      <div className="flex items-center gap-4">
        <ThemeSwitcher />

        {/* Find Battle CTA — angular corner per DESIGN.md §7 */}
        <button
          id="find-battle-btn"
          onClick={handleToggleQueue}
          className="px-4 h-8 text-xs font-bold transition-colors hover:opacity-90 flex items-center gap-1.5"
          style={{
            background: isSearching ? "var(--color-surface-2)" : "var(--color-accent)",
            color: isSearching ? "var(--color-text-primary)" : "var(--color-text-on-accent)",
            border: isSearching ? "1px solid var(--color-accent)" : "none",
            clipPath: "polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)",
          }}
        >
          {isSearching ? (
            <>
              <span className="relative flex h-1.5 w-1.5">
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ backgroundColor: "var(--color-accent)" }}
                />
                <span
                  className="relative inline-flex rounded-full h-1.5 w-1.5"
                  style={{ backgroundColor: "var(--color-accent)" }}
                />
              </span>
              Searching...
            </>
          ) : (
            "Find Battle"
          )}
        </button>
      </div>
    </nav>
  );
}
