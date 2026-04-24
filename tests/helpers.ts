import { afterEach, beforeEach, vi } from "vitest";
import { convexTest } from "convex-test";
import { createHmac } from "node:crypto";

import schema from "../src/component/schema";

const modules = import.meta.glob("../src/component/**/*.ts");

export function makeTest() {
  return convexTest(schema, modules);
}

const originalFetch = globalThis.fetch;

beforeEach(() => {
  // Fake timers prevent convex-test's setTimeout(0) from auto-firing
  // scheduled functions (e.g. the immediate processing trigger in sendEmail).
  // Tests that need queue processing call processQueue explicitly.
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  globalThis.fetch = originalFetch;
});

export function setMockFetch(
  handler: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>,
) {
  globalThis.fetch = handler as typeof fetch;
}

export function sign(rawBody: string, secret: string, withPrefix = true) {
  const signature = createHmac("sha256", secret).update(rawBody).digest("hex");
  return withPrefix ? `hmac-sha256=${signature}` : signature;
}
