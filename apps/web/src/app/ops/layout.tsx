"use client";

import { CabinetShell } from "@/components/cabinet/cabinet-shell";

export default function OpsLayout({ children }: { children: React.ReactNode }) {
  return <CabinetShell>{children}</CabinetShell>;
}
