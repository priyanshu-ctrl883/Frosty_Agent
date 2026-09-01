'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

// Suppress "Encountered a script tag while rendering React component" false positive from next-themes in React 19
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const orig = console.error;
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string') {
      if (args[0].includes('Encountered a script tag')) return;
      if (args[0].includes('WebGPU Device Lost')) return;
      if (args[0].includes('A valid external Instance reference no longer exists')) return;
    }
    orig.apply(console, args);
  };
}
 

export function ThemeProvider({ children }: { children: React.ReactNode }) {

  return (
    <NextThemesProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem={false} disableTransitionOnChange>
      {children}
    </NextThemesProvider>
  );
}
