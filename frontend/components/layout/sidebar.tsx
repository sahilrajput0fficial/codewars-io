"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Trophy,
  User,
  Swords,
  Code2,
  Flag,
  Settings,
  X,
  Home,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { BASE_URL } from "@/proxy";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

// Static items array outside the component to prevent reallocation on every render
const SECTIONS: NavSection[] = [
  {
    title: "Core",
    items: [
      { label: "Home",        href: "/",            icon: Home },
      { label: "Battle",      href: "/dashboard",   icon: Swords },
    ]
  },
  {
    title: "Competitive",
    items: [
      { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
      { label: "Kata / Code", href: "/problems",    icon: Code2 },
      { label: "Quests",      href: "/quests",      icon: Flag },
    ]
  },
  {
    title: "Account",
    items: [
      { label: "Profile",     href: "/u/me",     icon: User },
      { label: "Settings",    href: "/settings",    icon: Settings },
    ]
  },
];

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(true); // Controls showing/hiding completely or minimizing
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Retrieve state settings on mount
  useEffect(() => {
    const storedOpen = localStorage.getItem("sidebar-open");
    if (storedOpen !== null) {
      setIsOpen(storedOpen === "true");
    } else {
      // Default to open on desktop, collapsed on mobile
      setIsOpen(window.innerWidth >= 768);
    }
    setMounted(true);
  }, []);

  // Listen to toggle-sidebar events emitted by other components (e.g. Hamburger in Navbar)
  useEffect(() => {
    const handleToggle = () => {
      setIsOpen((prev) => {
        const next = !prev;
        localStorage.setItem("sidebar-open", String(next));
        return next;
      });
    };
    window.addEventListener("toggle-sidebar", handleToggle);
    return () => window.removeEventListener("toggle-sidebar", handleToggle);
  }, []);

  const closeSidebar = () => {
    setIsOpen(false);
    localStorage.setItem("sidebar-open", "false");
  };

  // Sync the CSS variable for layout alignment of other sticky/fixed elements
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      const widthVal = isMobile ? "0px" : (isOpen ? "240px" : "64px");
      
      const currentVal = document.documentElement.style.getPropertyValue("--sidebar-width");
      if (currentVal !== widthVal) {
        document.documentElement.style.setProperty("--sidebar-width", widthVal);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen]);

  const handleLogout = async () => {
    // 1. Sign out of Supabase
    const supabase = createClient();
    await supabase.auth.signOut();

    // 2. Call FastAPI backend logout to delete the access_token cookie
    try {
      await fetch(`${BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Backend logout failed:", err);
    }

    // 3. Redirect to login page
    router.push("/auth/login");
  };

  if (!mounted) {
    return (
      <div
        className="w-60 flex-shrink-0 border-r h-screen sticky top-0 hidden md:block"
        style={{
          borderColor: "var(--color-border)",
          background: "var(--color-surface)",
        }}
      />
    );
  }

  return (
    <>
      {/* Mobile backdrop shadow when sidebar is opened as drawer */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden transition-opacity duration-300
          ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
        onClick={closeSidebar}
      />

      <div
        className={`flex-shrink-0 h-screen sticky top-0 flex flex-col justify-between border-r transition-all duration-300 z-50
          fixed top-0 bottom-0 left-0 h-full
          md:sticky md:top-0 md:h-screen md:relative
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
        style={{
          width: isOpen ? "240px" : "64px",
          background: "var(--color-surface)",
          borderColor: "var(--color-border)",
        }}
      >
        {/* Top brand portion & navigation */}
        <div>
          <div
            className="h-14 flex items-center justify-between px-4 border-b"
            style={{ borderColor: "var(--color-border)" }}
          >
            <Link
              href="/"
              className="flex items-center gap-1 font-bold text-sm overflow-hidden whitespace-nowrap px-1"
            >
              <span style={{ color: "var(--color-text-primary)" }}>
                {isOpen ? "CODEWARS" : "<"}
              </span>
              <span style={{ color: "var(--color-accent)" }}>{">"}</span>
            </Link>

            {/* Mobile close overlay trigger */}
            <button
              onClick={closeSidebar}
              className="p-1.5 md:hidden hover:bg-[var(--color-surface-2)] rounded-full transition-colors"
              style={{ color: "var(--color-text-secondary)" }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Sections */}
          <nav className="p-3 flex flex-col gap-4">
            {SECTIONS.map((section, sIdx) => (
              <div key={section.title} className="flex flex-col gap-1">
                {/* Horizontal line divider between sections (only when collapsed) */}
                {sIdx > 0 && !isOpen && (
                  <hr className="border-t mb-2 mx-1" style={{ borderColor: "var(--color-border)" }} />
                )}

                {/* Section title (Visible only when expanded) */}
                {isOpen && (
                  <div
                    className="text-[10px] font-extrabold tracking-widest uppercase px-3 mb-1"
                    style={{ color: "var(--color-text-tertiary)" }}
                  >
                    {section.title}
                  </div>
                )}

                {/* Section Items */}
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center transition-all duration-200 group relative
                        ${isOpen 
                          ? "gap-3 px-4 h-10 rounded-md" 
                          : "justify-center w-10 h-10 rounded-full mx-auto"
                        }
                        ${active 
                          ? "" 
                          : "hover:bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                        }
                      `}
                      style={{
                        background: active ? "var(--color-accent-muted)" : "transparent",
                        color:      active ? "var(--color-accent)" : undefined,
                      }}
                      title={!isOpen ? item.label : undefined}
                    >
                      {/* Left indicator line for active item when expanded */}
                      {active && isOpen && (
                        <span 
                          className="absolute left-0 top-0.5 bottom-0.5 w-0.5 rounded-r-lg"
                          style={{ background: "var(--color-accent)" }}
                        />
                      )}
                      
                      <Icon
                        className="w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
                        style={{ color: active ? "var(--color-accent)" : undefined }}
                      />
                      {isOpen && (
                        <span className="text-balance tracking-wide font-mono text-sm">{item.label}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom portion: Sign Out button */}
        <div className="p-3 border-t" style={{ borderColor: "var(--color-border)" }}>
          <button
            onClick={handleLogout}
            className={`flex items-center transition-all duration-200 group relative w-full
              ${isOpen 
                ? "gap-3 px-4 h-10 rounded-md" 
                : "justify-center w-10 h-10 rounded-full mx-auto"
              }
              hover:bg-red-500/10 text-[var(--color-text-secondary)] hover:text-red-500
            `}
            title={!isOpen ? "Sign Out" : undefined}
          >
            <LogOut
              className="w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
            />
            {isOpen && (
              <span className="text-balance tracking-wide font-mono text-sm">Sign Out</span>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
