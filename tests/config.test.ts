import { describe, expect, test } from "vitest";
import { makeTest } from "./helpers";

describe("config", () => {
  test("config merge and replace semantics", async () => {
    const t = makeTest();

    await t.mutation("config:setConfig", {
      config: {
        testMode: false,
        defaultFrom: "one@example.com",
        rateLimitRps: 5,
      },
    });

    await t.mutation("config:setConfig", {
      config: {
        rateLimitRps: 7,
      },
    });

    let config = await t.query("config:getConfig", {});
    expect(config.testMode).toBe(false);
    expect(config.defaultFrom).toBe("one@example.com");
    expect(config.rateLimitRps).toBe(7);

    await t.mutation("config:setConfig", {
      config: {
        defaultFrom: "two@example.com",
      },
      replace: true,
    });

    config = await t.query("config:getConfig", {});
    expect(config.defaultFrom).toBe("two@example.com");
    expect(config.testMode).toBe(true);
  });
});
