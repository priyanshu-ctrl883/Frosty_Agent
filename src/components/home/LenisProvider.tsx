"use client";

import { ReactNode, useEffect } from "react";
import Lenis from "lenis";

export function LenisProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
