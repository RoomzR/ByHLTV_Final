"use client";

import { useEffect, useMemo, useState } from "react";
import { UserRole, canAssignRole, canBanTarget } from "@byhltv/shared";

import { CmsBackLink } from "@/components/admin/cms-back-link";
import { PageTransition } from "@/components/effects/page-transition";
import { RequireCapability } from "@/features/auth/require-capability";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminCard } from "@/components/admin/shell/admin-card";
import { fieldInputClass } from "@/components/ui/form-field";
import { useAuth } from "@/features/auth/auth-provider";
import { useI18n } from "@/i18n/provider";
import { apiClient, type AuthUser } from "@/shared/api/client";

const ROLES = Object.values(UserRole);

type UserRow = AuthUser & { isBanned?: boolean };

export default function AdminUsersPage() {
  return (
    <RequireCapability capability="admin.panel">
      <UsersInner />
    </RequireCapability>
  );
}

function UsersInner() {
  const { user: actor } = useAuth();
  const { t } = useI18n();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const load = () =>
    apiClient
      .adminUsers()
      .then((list) => setUsers(list as UserRow[]))
      .catch((e) => setError((e as { message?: string }).message ?? t("common.error")));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
      if (!needle) return true;
      return (
        u.username.toLowerCase().includes(needle) ||
        (u.email ?? "").toLowerCase().includes(needle) ||
        (u.displayName ?? "").toLowerCase().includes(needle)
      );
    });
  }, [users, q, roleFilter]);

  async function ban(id: string, banned: boolean) {
    await apiClient.adminBanUser(id, banned);
    load();
  }

  async function setRole(id: string, role: string) {
    await apiClient.setUserRole(id, role);
    load();
  }

  if (!actor) return null;

  return (
    <PageTransition className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">{t("admin.usersTitle")}</h1>
          <p className="mt-1 text-sm text-zinc-500">{t("admin.usersHint")}</p>
        </div>
        <CmsBackLink />
      </div>
      {error ? <p className="text-rose-400">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <input
          className={`${fieldInputClass} max-w-xs`}
          placeholder={t("admin.usersSearch")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className={`${fieldInputClass} max-w-[12rem]`}
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="ALL">{t("admin.usersAllRoles")}</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <AdminCard className="overflow-hidden p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-800 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">{t("admin.usersColUser")}</th>
              <th className="px-4 py-3">{t("admin.usersColRole")}</th>
              <th className="px-4 py-3">{t("admin.usersColBan")}</th>
              <th className="px-4 py-3">{t("admin.action")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => {
              const assignable = ROLES.filter((r) =>
                canAssignRole(
                  { id: actor.id, role: actor.role },
                  { id: u.id, role: u.role },
                  r,
                ),
              );
              const canToggleBan = canBanTarget(actor.role, u.role, "full");
              return (
                <tr key={u.id} className="border-b border-zinc-900">
                  <td className="px-4 py-3">
                    <div className="font-medium text-zinc-100">{u.displayName || u.username}</div>
                    <div className="text-xs text-zinc-500">@{u.username}</div>
                    <div className="text-xs text-zinc-600">{u.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className="border border-[var(--border)] bg-[#111] px-2 py-1 text-xs"
                      value={u.role}
                      disabled={assignable.length === 0}
                      onChange={(e) => void setRole(u.id, e.target.value)}
                    >
                      <option value={u.role}>{u.role}</option>
                      {assignable
                        .filter((r) => r !== u.role)
                        .map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={u.isBanned ? "live" : "default"}>
                      {u.isBanned ? t("admin.usersBanned") : t("admin.usersOk")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {canToggleBan ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void ban(u.id, !u.isBanned)}
                      >
                        {u.isBanned ? t("admin.usersUnban") : t("admin.usersBan")}
                      </Button>
                    ) : (
                      <span className="text-xs text-zinc-600">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-zinc-600">
                  {t("admin.usersEmpty")}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </AdminCard>
    </PageTransition>
  );
}
