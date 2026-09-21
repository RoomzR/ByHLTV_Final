"use client";

import { CabinetShell } from "@/components/cabinet/cabinet-shell";

export default function ApplyLayout({ children }: { children: React.ReactNode }) {
  return <CabinetShell>{children}</CabinetShell>;
}
