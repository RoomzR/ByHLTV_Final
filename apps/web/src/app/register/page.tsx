"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { FormEvent, useState } from "react";

import { AuthShell, authInputClass } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { useAuth } from "@/features/auth/auth-provider";
import { useI18n } from "@/i18n/provider";

export default function RegisterPage() {
  const { register } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    displayName: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await register(form);
      router.push("/");
    } catch (err) {
      setError((err as { message?: string }).message ?? t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title={t("auth.registerTitle")}
      footer={
        <>
          {t("auth.haveAccount")}{" "}
          <Link
            href="/login"
            className="font-semibold text-[var(--hltv-green)] hover:underline"
          >
            {t("auth.signIn")}
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField label={t("auth.email")} htmlFor="reg-email" hint={t("auth.emailHint")}>
          <input
            id="reg-email"
            type="email"
            required
            autoComplete="email"
            className={authInputClass}
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label={t("auth.username")} hint={t("auth.usernameHint")} htmlFor="reg-user">
            <input
              id="reg-user"
              required
              minLength={3}
              maxLength={32}
              pattern="^[a-zA-Z0-9_]+$"
              autoComplete="username"
              className={authInputClass}
              placeholder="fanby"
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
            />
          </FormField>
          <FormField
            label={t("auth.displayName")}
            hint={t("auth.displayNameHint")}
            htmlFor="reg-display"
          >
            <input
              id="reg-display"
              className={authInputClass}
              placeholder="BY Fan"
              value={form.displayName}
              onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
            />
          </FormField>
        </div>
        <FormField label={t("auth.password")} hint={t("auth.passwordHint")} htmlFor="reg-pass">
          <div className="relative">
            <input
              id="reg-pass"
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              maxLength={128}
              pattern="^(?=.*[A-Za-z])(?=.*[0-9]).{8,}$"
              title={t("auth.passwordHint")}
              autoComplete="new-password"
              className={`${authInputClass} pr-11`}
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            />
            <button
              type="button"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-500 transition-colors hover:text-[var(--hltv-green)]"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </FormField>
        {error ? (
          <p className="border border-[#e35d5d]/35 bg-[#e35d5d]/10 px-3 py-2 text-sm text-[#f5a8a8]">
            {error}
          </p>
        ) : null}
        <Button type="submit" className="mt-1 h-11 w-full text-[13px]" disabled={loading}>
          {loading ? t("auth.creating") : t("auth.createAccount")}
        </Button>
      </form>
    </AuthShell>
  );
}
