/*
 * Accessibility audit — WCAG 2.2 AA.
 *
 *   npm run a11y            # audit against a running preview server
 *
 * Covers the findings the UI/UX evaluation left as "Review":
 *   • axe-core scan (2.1.1, 2.4.3, 3.3.1, 4.1.2, 1.4.3, 1.4.11, …) per route
 *   • 2.4.11 Focus Not Obscured — every focusable, at multiple scroll offsets
 *   • 2.5.8 Target Size Minimum — real measured hit areas (>= 24x24 CSS px)
 */
import { chromium } from "playwright";
import { AxeBuilder } from "@axe-core/playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:4173";

const ROUTES = [
  ["Home", "#/"],
  ["Service", "#/service"],
  ["Wallet", "#/wallet"],
  ["Help Center", "#/help"],
  ["Sign in / Register", "#/signin"],
];

const VIEWPORTS = [
  { name: "mobile", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 900 },
];

let failures = 0;

async function auditRoute(page, name, hash, viewport) {
  await page.goto(`${BASE}/${hash}`, { waitUntil: "networkidle" });
  // The first-run tutorial is a modal that legitimately covers the page; dismiss
  // it so we audit the actual screen underneath. (It is audited on its own via
  // the dialog checks in DialogShell.)
  await page.evaluate(() => localStorage.setItem("lcc_tutorial_seen", "1"));
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(250);

  const label = `${name} @${viewport.name}`;

  // ── axe-core ──
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();

  if (results.violations.length === 0) {
    console.log(`  ✅ ${label.padEnd(34)} axe: 0 violations`);
  } else {
    failures += results.violations.length;
    console.log(`  ❌ ${label.padEnd(34)} axe: ${results.violations.length} violation(s)`);
    for (const v of results.violations) {
      console.log(`       • [${v.impact}] ${v.id} — ${v.help}`);
      for (const node of v.nodes.slice(0, 3)) {
        console.log(`           ${node.target.join(" ")}`);
        const msg = (node.any[0]?.message ?? node.all[0]?.message ?? "").split("\n")[0];
        if (msg) console.log(`             ${msg}`);
      }
    }
  }

  // Note: 2.5.8 Target Size is covered by axe's `target-size` rule above, which
  // implements the spec's inline/spacing exceptions. A naive width/height check
  // produces false positives on inline text links, so we don't duplicate it.

  // ── 2.4.11 Focus Not Obscured, across scroll positions ──
  // The criterion is about a control WHEN IT RECEIVES FOCUS, so we actually
  // focus each control (which lets the browser scroll it into view) from several
  // starting scroll offsets, then check whether a sticky/fixed layer completely
  // covers it. Only fixed/sticky elements can obscure; a plain elementFromPoint
  // probe would just rediscover each element's own children.
  const obscured = await page.evaluate(() => {
    const out = [];
    const scroller = document.querySelector("main") ?? document.scrollingElement;
    const maxScroll = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
    const offsets = [0, maxScroll * 0.25, maxScroll * 0.5, maxScroll * 0.75, maxScroll];

    const stickies = [...document.querySelectorAll("*")].filter((el) => {
      const pos = getComputedStyle(el).position;
      if (pos !== "fixed" && pos !== "sticky") return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    });

    const seen = new Set();
    for (const off of offsets) {
      scroller.scrollTop = off;
      const els = [...document.querySelectorAll('a[href], button:not([disabled]), input, select')];
      for (const el of els) {
        const r0 = el.getBoundingClientRect();
        if (r0.width === 0 || r0.height === 0) continue;

        el.focus({ preventScroll: false }); // browser scrolls it into view
        const r = el.getBoundingClientRect();
        if (r.bottom <= 0 || r.top >= innerHeight) continue;

        for (const s of stickies) {
          if (s.contains(el)) continue; // the control lives inside the sticky bar
          const sr = s.getBoundingClientRect();
          // Entirely hidden behind a sticky/fixed layer => 2.4.11 failure.
          if (r.top >= sr.top && r.bottom <= sr.bottom && r.left >= sr.left && r.right <= sr.right) {
            const text = (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 28);
            const key = text + "|" + s.tagName;
            if (seen.has(key)) continue;
            seen.add(key);
            out.push({
              scroll: Math.round(off),
              text,
              covering: `${s.tagName.toLowerCase()}.${String(s.className ?? "").slice(0, 22)}`,
            });
          }
        }
      }
    }
    return out;
  });
  if (obscured.length === 0) {
    console.log(`  ✅ ${label.padEnd(34)} 2.4.11 focus not obscured @5 scroll positions`);
  } else {
    failures += obscured.length;
    console.log(`  ❌ ${label.padEnd(34)} 2.4.11: ${obscured.length} obscured`);
    obscured.slice(0, 5).forEach((o) =>
      console.log(`       • "${o.text}" covered by ${o.covering} @scroll ${o.scroll}`)
    );
  }
}

const browser = await chromium.launch();
console.log("=".repeat(78));
console.log(`WCAG 2.2 AA AUDIT — axe-core + target size + focus-not-obscured`);
console.log(`base: ${BASE}`);
console.log("=".repeat(78));

for (const viewport of VIEWPORTS) {
  // axe-core/playwright requires a real BrowserContext.
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  console.log(`\n── ${viewport.name} (${viewport.width}x${viewport.height}) ──`);
  for (const [name, hash] of ROUTES) {
    await auditRoute(page, name, hash, viewport);
  }
  await context.close();
}

await browser.close();
console.log("\n" + "=".repeat(78));
console.log(failures === 0 ? "RESULT: 0 failures — all checks pass" : `RESULT: ${failures} failure(s)`);
console.log("=".repeat(78));
process.exit(failures === 0 ? 0 : 1);
