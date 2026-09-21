/** Never expose GSI secrets on public match payloads. */
export function sanitizeMatch<T extends { gsiToken?: string | null }>(
  match: T,
): Omit<T, "gsiToken"> {
  const { gsiToken: _secret, ...safe } = match;
  return safe;
}

export const GSI_ONLINE_MS = 45_000;

export function isGsiOnline(gsiLastAt?: Date | string | null): boolean {
  if (!gsiLastAt) return false;
  const t = typeof gsiLastAt === "string" ? Date.parse(gsiLastAt) : gsiLastAt.getTime();
  return Number.isFinite(t) && Date.now() - t < GSI_ONLINE_MS;
}
