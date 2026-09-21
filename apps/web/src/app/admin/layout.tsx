"use client";

import { CabinetShell } from "@/components/cabinet/cabinet-shell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <CabinetShell>{children}</CabinetShell>;
}
