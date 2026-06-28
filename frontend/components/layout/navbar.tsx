"use client";

import Link from "next/link";
import { ThemeSwitcher } from "@/components/theme-switcher";
import SidebarIcon from '@/components/menu'
export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface NavbarProps {
  breadcrumbs?: BreadcrumbItem[];
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

export function Navbar({ breadcrumbs }: NavbarProps) {
  return (
    <nav
      className="sticky top-0 z-40 h-14 flex items-center justify-between px-6 border-b backdrop-blur-md"
      style={{
        background:  "var(--color-surface)",
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

      {/* Right Section: Theme switcher & Battle CTA */}
      <div className="flex items-center gap-4">
        <ThemeSwitcher />

        {/* Find Battle CTA — angular corner per DESIGN.md §7 */}
        <button
          id="find-battle-btn"
          className="px-4 h-8 text-xs font-bold transition-colors hover:opacity-90"
          style={{
            background: "var(--color-accent)",
            color:      "var(--color-text-on-accent)",
            clipPath:   "polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)",
          }}
        >
          Find Battle
        </button>
      </div>
    </nav>
  );
}
