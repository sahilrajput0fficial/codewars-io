"use client"

import { ThemeProvider } from "next-themes"
import React, { ReactNode } from "react"

// Workaround for next-themes + React 19 compatibility warning:
// "Encountered a script tag while rendering React component. Scripts inside React components are never executed when rendering on the client."
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const origError = console.error;
  console.error = (...args: any[]) => {
    if (typeof args[0] === "string" && args[0].includes("Encountered a script tag")) {
      return;
    }
    origError.apply(console, args);
  };
}

interface Props { children: ReactNode }

export default function ThemeProviderWrapper({ children }: Props) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  )
}
