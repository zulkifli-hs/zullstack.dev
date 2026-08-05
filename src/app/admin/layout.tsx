import { Geist, JetBrains_Mono } from "next/font/google";
import type { Metadata } from "next";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { ICONS } from "@/lib/brand";
import { cn } from "@/lib/utils";

import "../globals.css";

/**
 * A second root layout.
 *
 * There is no `app/layout.tsx`; `app/[locale]/layout.tsx` is the public site's
 * root and this is the admin's. Next supports multiple root layouts when no
 * layout sits above them, which is what lets the admin skip locale routing
 * entirely and render its own <html lang="en">.
 */
const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans", display: "swap" });
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Admin · Zullstack", template: "%s · Admin" },
  icons: ICONS,
  // The CMS must never be indexed, regardless of what robots.txt says.
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={cn(geistSans.variable, jetbrainsMono.variable)}>
      <body className="bg-background text-foreground min-h-dvh antialiased">
        {/* The CMS is a tool, not a showcase — no glass, no lab background.
            Forcing dark keeps it visually distinct from the public site. */}
        <ThemeProvider forcedTheme="dark">{children}</ThemeProvider>
      </body>
    </html>
  );
}
