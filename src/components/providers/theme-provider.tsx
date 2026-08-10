"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      // `data-theme` rather than `class` so the theme never collides with
      // Tailwind classes and so adding a third theme touches only CSS.
      attribute="data-theme"
      // The material is built for dark: light mode tints the glass half again
      // as heavily to hold text contrast, so refraction reads far more faintly
      // there. Following the OS would hand half of all visitors the weaker of
      // the two on arrival, so the site states a preference instead.
      defaultTheme="dark"
      enableSystem={false}
      // Suppresses the cross-fade that otherwise animates every colour token
      // at once when switching themes.
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
