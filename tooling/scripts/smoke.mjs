/**
 * Smoke checks against a running API (http://localhost:4000/api/v1)
 * Covers public routes + role capabilities for seed accounts.
 */
const API = process.env.API_URL ?? "http://127.0.0.1:4000/api/v1";

async function check(path, init) {
  const res = await fetch(`${API}${path}`, init);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${path} -> ${res.status} ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

async function expectStatus(path, token, status, init = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      ...(init.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": "application/json",
    },
  });
  if (res.status !== status) {
    const text = await res.text();
    throw new Error(`${path} expected ${status} got ${res.status} ${text}`);
  }
  return res;
}

async function login(email, password) {
  const data = await check("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return data.accessToken;
}

async function authCheck(path, token, init = {}) {
  return check(path, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}

async function main() {
  await check("/health");
  await check("/teams");
  await check("/players");
  await check("/matches");
  await check("/matches/live");
  await check("/events");
  await check("/events/western-clash");
  await check("/events/western-clash/brackets");
  await check("/news?locale=en");
  await check("/rankings/teams");
  await check("/stats/overview");
  await check("/forums/categories");
  await check("/gallery");
  await check("/streams");
  await check("/fantasy");
  await check("/betting/odds");
  await check("/comments?newsId=noop").catch(() => null);

  const adminToken = await login("admin@byhltv.local", "Admin123!");
  const toToken = await login("to@byhltv.local", "ToAdmin123!");
  const editorToken = await login("editor@byhltv.local", "Editor123!");
  const modToken = await login("mod@byhltv.local", "Mod1234!");
  const userToken = await login("user@byhltv.local", "User1234!");

  await authCheck("/tournament-applications", adminToken);
  await authCheck("/tournament-applications/me", toToken);
  await authCheck("/submissions/mine", toToken);
  await authCheck("/submissions/my-events", toToken);
  await authCheck("/submissions/queue", editorToken);
  await authCheck("/matches/m-live-1", toToken);
  await authCheck("/admin/overview", adminToken);
  await authCheck("/news/admin/all", editorToken);
  await authCheck("/events/admin/all", editorToken);
  await authCheck("/reports?status=OPEN", modToken);
  await authCheck("/notifications", userToken);
  await authCheck("/notifications/favorites", userToken);

  await expectStatus("/admin/overview", userToken, 403);
  await expectStatus("/admin/overview", modToken, 403);
  await expectStatus("/reports", userToken, 403);
  await expectStatus("/news/admin/all", toToken, 403);
  await expectStatus("/submissions/queue", toToken, 403);

  console.log("Smoke OK (public + roles/capabilities)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
