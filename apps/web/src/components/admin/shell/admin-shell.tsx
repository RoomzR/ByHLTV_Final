"use client";

import { CabinetShell } from "@/components/cabinet/cabinet-shell";

/** @deprecated Prefer CabinetShell — kept as alias for a single desk chrome. */
export function AdminShell({
  children,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}) {
  return <CabinetShell>{children}</CabinetShell>;
}
