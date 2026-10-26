"use client";

import { applyTheme, resolveTheme } from "@/lib/theme/apply-theme";
import { useEffect } from "react";

export function ThemeInit() {
  useEffect(() => {
    applyTheme(resolveTheme());
  }, []);

  return null;
}
