import { describe, expect, test } from "vitest";
import { makeTest } from "./helpers";

describe("bulk sending", () => {
  test("sendBulk interpolates recipientData into subject, html, and text", async () => {
    const t = makeTest();

    await t.mutation("config:setConfig", {
      config: {
        testMode: false,
        autosendApiKey: "as_test_key",
        defaultFrom: "noreply@example.com",
      },
    });

    const result = await t.mutation("emails:sendBulk", {
      recipients: ["alice@example.com", "bob@example.com"],
      recipientData: {
        "alice@example.com": { name: "Alice", role: "admin" },
        "bob@example.com": { name: "Bob", role: "member" },
      },
      subject: "Welcome, {{name}}",
      html: "<p>Hi {{name}}, you are a {{role}}.</p>",
      text: "Hi {{name}}, you are a {{role}}.",
    });

    expect(result.acceptedCount).toBe(2);

    const alice = await t.query("queries:status", { emailId: result.emailIds[0]! });
    expect(alice?.subject).toBe("Welcome, Alice");
    expect(alice?.html).toBe("<p>Hi Alice, you are a admin.</p>");
    expect(alice?.text).toBe("Hi Alice, you are a admin.");

    const bob = await t.query("queries:status", { emailId: result.emailIds[1]! });
    expect(bob?.subject).toBe("Welcome, Bob");
    expect(bob?.html).toBe("<p>Hi Bob, you are a member.</p>");
    expect(bob?.text).toBe("Hi Bob, you are a member.");
  });

  test("sendBulk without recipientData leaves templates uninterpolated", async () => {
    const t = makeTest();

    await t.mutation("config:setConfig", {
      config: {
        testMode: false,
        defaultFrom: "noreply@example.com",
      },
    });

    const result = await t.mutation("emails:sendBulk", {
      recipients: ["user@example.com"],
      subject: "Hello {{name}}",
      html: "<p>Hi {{name}}</p>",
    });

    const status = await t.query("queries:status", { emailId: result.emailIds[0]! });
    expect(status?.subject).toBe("Hello {{name}}");
    expect(status?.html).toBe("<p>Hi {{name}}</p>");
  });

  test("sendBulk recipientData uses per-recipient data as dynamicData", async () => {
    const t = makeTest();

    await t.mutation("config:setConfig", {
      config: {
        testMode: false,
        defaultFrom: "noreply@example.com",
      },
    });

    const result = await t.mutation("emails:sendBulk", {
      recipients: ["alice@example.com"],
      recipientData: {
        "alice@example.com": { name: "Alice" },
      },
      subject: "Hi",
      html: "<p>Hi</p>",
      dynamicData: { name: "Default" },
    });

    const status = await t.query("queries:status", { emailId: result.emailIds[0]! });
    expect(status?.dynamicData).toEqual({ name: "Alice" });
  });
});
