import {
  BookOpen,
  Briefcase,
  Building2,
  FileText,
  FlaskConical,
  GitBranch,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  Quote,
  Settings,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Logo } from "@/components/brand/logo";
import { SignOutButton } from "@/components/admin/sign-out-button";

export const ADMIN_NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/projects", label: "Projects", icon: FlaskConical },
  { href: "/admin/experience", label: "Experience", icon: Briefcase },
  // The company directory behind both the project credits and the experience
  // timeline. It had a full resource but no way to reach it.
  { href: "/admin/partners", label: "Partners", icon: Building2 },
  { href: "/admin/mentoring", label: "Mentoring", icon: GraduationCap },
  { href: "/admin/articles", label: "Articles", icon: FileText },
  { href: "/admin/comments", label: "Comments", icon: MessageSquare },
  { href: "/admin/testimonials", label: "Testimonials", icon: Quote },
  { href: "/admin/resources", label: "Resources", icon: BookOpen },
  { href: "/admin/open-source", label: "Open Source", icon: GitBranch },
  { href: "/admin/snippets", label: "Snippets", icon: FlaskConical },
  { href: "/admin/config", label: "Site config", icon: Settings },
  { href: "/admin/design", label: "Liquid Glass", icon: Sparkles },
] as const;

export function AdminShell({ children, email }: { children: ReactNode; email?: string }) {
  return (
    <div className="flex min-h-dvh">
      {/* Pinned to the viewport rather than scrolling with the page. `h-dvh`
          plus `sticky top-0` is what makes the column a fixed frame: the nav
          inside it gets its own scrollbar, so a long edit form no longer drags
          the navigation out of reach. */}
      <aside className="border-hairline bg-card/40 sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r lg:flex">
        <div className="border-hairline flex h-16 shrink-0 items-center gap-3 border-b px-5">
          <Logo className="h-7" />
          <span className="lab-label text-muted-foreground">admin</span>
        </div>

        <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-3">
          {ADMIN_NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="text-muted-foreground hover:bg-secondary/60 hover:text-foreground flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors"
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="border-hairline shrink-0 border-t p-3">
          {email && (
            <p className="text-muted-foreground truncate px-3 pb-2 font-mono text-xs">{email}</p>
          )}
          <SignOutButton />
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Mobile nav: the sidebar is hidden below lg, so the sections need
            a reachable entry point rather than being unreachable on phones. */}
        {/* Deliberately not sticky: the edit forms pin their own save bar to
            the top, and two competing sticky bars on a phone leaves almost no
            room for the form itself. */}
        <div className="border-hairline flex gap-1 overflow-x-auto border-b p-2 lg:hidden">
          {ADMIN_NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-muted-foreground hover:text-foreground shrink-0 rounded-md px-3 py-1.5 text-xs whitespace-nowrap"
            >
              {label}
            </Link>
          ))}
        </div>

        <main className="p-6 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
