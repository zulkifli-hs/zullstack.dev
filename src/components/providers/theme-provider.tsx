"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      // `data-theme` rather than `class` so the theme never collides with
      // Tailwind classes and so adding a third theme touches only CSS.
      attribute="data-theme"
      defaultTheme="dark"
      enableSystem
      // Suppresses the cross-fade that otherwise animates every colour token
      // at once when switching themes.
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
