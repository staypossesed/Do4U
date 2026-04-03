"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      {children}
      <Toaster
        position="top-center"
        richColors
        closeButton
        toastOptions={{
          duration: 4000,
          className:
            "rounded-xl border dark:border-white/10 border-black/10 shadow-lg dark:bg-popover bg-background",
          classNames: {
            title: "font-semibold text-sm",
            description: "text-muted-foreground text-sm",
            actionButton: "font-semibold",
            cancelButton: "font-medium",
          },
        }}
      />
    </ThemeProvider>
  );
}
