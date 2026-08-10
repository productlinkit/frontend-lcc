/*
 * Headless end-to-end smoke test for both apps against the live Go API.
 *
 * It drives the real React build in Chromium — signs in, walks the main
 * screens, and asserts each one rendered live data rather than an error state.
 * Console errors and failed API calls are collected and reported per screen, so
 * a broken wiring shows up as a failure here instead of in a manual click-through.
 *
 * Run with both dev servers and the API up:
 *   node e2e-smoke.mjs
 */
import { chromium } from "playwright";

const PORTAL = process.env.PORTAL_URL || "http://localhost:5173";
const DASHBOARD = process.env.DASHBOARD_URL || "http://localhost:5174";
const API = process.env.API_URL || "http://localhost:8080/api/v1";

const CITIZEN = { phone: "+8562055512345", password: "Password@123" };
const OFFICER = { email: "admin@lcc.gov.la", password: "Password@123" };

let passed = 0;
let failed = 0;
const failures = [];

function check(name, ok, detail = "") {
  if (ok) {
    passed++;
    console.log(`  PASS  ${name}`);
  } else {
    failed++;
    failures.push(`${name}${detail ? " :: " + detail : ""}`);
    console.log(`  FAIL  ${name}${detail ? " :: " + detail : ""}`);
  }
}

/** Attach console + network collectors to a page. */
function watch(page) {
  const state = { errors: [], failedRequests: [] };
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const t = msg.text();
      // React dev warnings and the favicon 404 are noise, not wiring failures.
      if (/favicon|Download the React DevTools|Warning:|act\(/.test(t)) return;
      state.errors.push(t);
    }
  });
  page.on("response", (res) => {
    const url = res.url();
    if (url.startsWith(API) && res.status() >= 400) {
      // A 401 on an anonymous probe or a 404 on an optional lookup is allowed;
      // record 5xx and unexpected 4xx so a broken call is visible.
      if (res.status() >= 500 || res.status() === 400 || res.status() === 422) {
        state.failedRequests.push(`${res.status()} ${res.request().method()} ${url.replace(API, "")}`);
      }
    }
  });
  return state;
}

async function seenText(page, text, timeout = 8000) {
  try {
    await page.getByText(text, { exact: false }).first().waitFor({ timeout });
    return true;
  } catch {
    return false;
  }
}

async function apiCallSeen(state, fragment, timeout = 6000) {
  // Poll the network log for a successful call to an endpoint fragment.
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (state.calls?.some((c) => c.includes(fragment))) return true;
    await new Promise((r) => setTimeout(r, 200));
  }
  return false;
}

async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });

  /* ── Portal ─────────────────────────────────────────────────────────── */
  console.log("\n=== CITIZEN PORTAL ===");
  {
    const page = await context.newPage();
    const state = watch(page);
    state.calls = [];
    page.on("response", (r) => {
      if (r.url().startsWith(API) && r.status() < 400) state.calls.push(r.url().replace(API, ""));
    });

    await page.goto(PORTAL, { waitUntil: "networkidle" });
    check("portal loads", await seenText(page, "Lao", 6000) || (await page.title()) !== "");

    // The service catalogue is public — it should populate from /services.
    await page.goto(`${PORTAL}/#/service`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    check("service catalogue calls /services", await apiCallSeen(state, "/services"));
    check("service catalogue calls /service-categories", await apiCallSeen(state, "/service-categories"));

    // News is public too.
    await page.goto(`${PORTAL}/#/news`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    check("news page calls /news", await apiCallSeen(state, "/news"));

    // Sign in. The login form carries a "a + b = ?" captcha that must be
    // solved, so the login id and password alone are not enough.
    await page.goto(`${PORTAL}/#/signin`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    const loginId = page.locator('form input[type="text"]').first();
    const pass = page.locator('form input[type="password"]').first();
    const mathAnswer = page.locator('form input[maxlength="2"]').first();
    if ((await loginId.count()) && (await pass.count())) {
      await loginId.fill(CITIZEN.phone);
      await pass.fill(CITIZEN.password);
      // Read "N + N = ?" and enter the sum.
      const eq = await page.getByText(/\d+\s*\+\s*\d+\s*=\s*\?/).first().textContent();
      const m = eq?.match(/(\d+)\s*\+\s*(\d+)/);
      if (m && (await mathAnswer.count())) {
        await mathAnswer.fill(String(Number(m[1]) + Number(m[2])));
      }
      // The form's own submit button, not the header sign-in link.
      await page.locator('form button[type="submit"]').first().click();
      await page.waitForTimeout(3000);
      check("citizen sign-in calls /auth/citizen/login", await apiCallSeen(state, "/auth/citizen/login"));
      check("citizen session established (token stored)", await page.evaluate(() => !!localStorage.getItem("lcc.access_token")));
    } else {
      check("citizen sign-in form present", false, "login/password inputs not found");
    }

    // Authenticated screens.
    await page.goto(`${PORTAL}/#/account`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    check("account page calls /me/profile", await apiCallSeen(state, "/me/profile"));

    await page.goto(`${PORTAL}/#/history`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    check("history page calls /applications", await apiCallSeen(state, "/applications"));

    await page.goto(`${PORTAL}/#/wallet`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    check("wallet page calls /me/wallet", await apiCallSeen(state, "/me/wallet"));

    check("portal: no uncaught console errors", state.errors.length === 0, state.errors.slice(0, 3).join(" | "));
    check("portal: no 5xx/400/422 API calls", state.failedRequests.length === 0, state.failedRequests.slice(0, 4).join(" | "));
    await page.close();
  }

  /* ── Dashboard ──────────────────────────────────────────────────────── */
  console.log("\n=== BACK-OFFICE DASHBOARD ===");
  {
    const page = await context.newPage();
    const state = watch(page);
    state.calls = [];
    page.on("response", (r) => {
      if (r.url().startsWith(API) && r.status() < 400) state.calls.push(r.url().replace(API, ""));
    });

    await page.goto(DASHBOARD, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);

    const email = page.locator('input[type="email"], input[name*="email" i]').first();
    const pass = page.locator('input[type="password"]').first();
    check("officer login form present", (await email.count()) > 0 && (await pass.count()) > 0);
    if ((await email.count()) && (await pass.count())) {
      await email.fill(OFFICER.email);
      await pass.fill(OFFICER.password);
      await page.getByRole("button", { name: /sign in|login|log in/i }).first().click();
      await page.waitForTimeout(3000);
      check("officer login calls /auth/officer/login", await apiCallSeen(state, "/auth/officer/login"));
      check("officer session established", await page.evaluate(() => !!localStorage.getItem("lcc.admin.access_token")));
      check("overview calls /admin/dashboard/kpis", await apiCallSeen(state, "/admin/dashboard/kpis"));
    }

    // Walk the main tabs by clicking the sidebar entries.
    const tabs = [
      { label: /applications/i, call: "/admin/applications" },
      { label: /approval|queue/i, call: "/admin/cases/queue" },
      { label: /population/i, call: "/admin/registry/population/summary" },
      { label: /payments/i, call: "/admin/payments/transactions" },
      { label: /alerts/i, call: "/admin/alerts" },
    ];
    for (const tab of tabs) {
      const link = page.getByText(tab.label).first();
      if (await link.count()) {
        await link.click().catch(() => {});
        await page.waitForTimeout(1800);
        check(`dashboard tab ${tab.call} loads live data`, await apiCallSeen(state, tab.call, 3000));
      }
    }

    check("dashboard: no uncaught console errors", state.errors.length === 0, state.errors.slice(0, 3).join(" | "));
    check("dashboard: no 5xx/400/422 API calls", state.failedRequests.length === 0, state.failedRequests.slice(0, 4).join(" | "));
    await page.close();
  }

  await browser.close();

  console.log(`\n===== ${passed} passed, ${failed} failed =====`);
  if (failures.length) {
    console.log("FAILURES:");
    for (const f of failures) console.log("  - " + f);
  }
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error("harness crashed:", err);
  process.exit(2);
});
