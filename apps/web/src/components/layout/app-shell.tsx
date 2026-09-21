"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { NewsTicker } from "@/components/news/news-ticker";
import { AuthProvider } from "@/features/auth/auth-provider";
import { I18nProvider } from "@/i18n/provider";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin") ?? false;
  const isCabinet =
    (pathname?.startsWith("/profile") ||
      pathname?.startsWith("/ops") ||
      pathname?.startsWith("/mod") ||
      pathname?.startsWith("/apply")) ??
    false;
  const isAuth = pathname === "/login" || pathname === "/register";
  const bareChrome = isAdmin || isCabinet || isAuth;

  return (
    <I18nProvider>
      <AuthProvider>
        {bareChrome ? (
          <div className="relative min-h-screen bg-[var(--background)]">{children}</div>
        ) : (
          <div className="relative flex min-h-screen flex-col bg-[var(--background)]">
            <NewsTicker />
            <SiteHeader />
            <main className="min-w-0 flex-1">{children}</main>
            <SiteFooter />
          </div>
        )}
      </AuthProvider>
    </I18nProvider>
  );
}
