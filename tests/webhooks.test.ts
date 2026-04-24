import { describe, expect, test } from "vitest";
import { makeTest, setMockFetch, sign } from "./helpers";

describe("webhooks", () => {
  test("webhook dedupes by delivery id", async () => {
    const t = makeTest();

    await t.mutation("config:setConfig", {
      config: {
        webhookSecret: "whsec_123",
      },
    });

    const payload = { emailId: "unknown_id", status: "delivered" };
    const rawBody = JSON.stringify(payload);

    const first = await t.action("webhooks:handleCallback", {
      rawBody,
      signature: sign(rawBody, "whsec_123"),
      event: "email.delivered",
      deliveryId: "delivery_1",
      timestamp: Date.now().toString(),
    });

    const second = await t.action("webhooks:handleCallback", {
      rawBody,
      signature: sign(rawBody, "whsec_123"),
      event: "email.delivered",
      deliveryId: "delivery_1",
      timestamp: Date.now().toString(),
    });

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(second.duplicate).toBe(true);
  });

  test("bounce webhook marks email failed", async () => {
    const t = makeTest();

    await t.mutation("config:setConfig", {
      config: {
        testMode: false,
        autosendApiKey: "as_test_key",
        webhookSecret: "whsec_456",
        defaultFrom: "noreply@example.com",
      },
    });

    setMockFetch(async () => {
      return new Response(JSON.stringify({ emailId: "provider_9" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    const sent = await t.mutation("emails:sendEmail", {
      to: ["user@example.com"],
      subject: "Webhook me",
      html: "<p>Hello</p>",
    });

    await t.action("queue:processQueue", {});

    const rawBody = JSON.stringify({
      providerMessageId: "provider_9",
      occurredAt: Date.now(),
    });

    const webhook = await t.action("webhooks:handleCallback", {
      rawBody,
      signature: sign(rawBody, "whsec_456"),
      event: "email.bounced",
      deliveryId: "delivery_bounce_1",
      timestamp: Date.now().toString(),
    });

    expect(webhook.ok).toBe(true);

    const status = await t.query("queries:status", { emailId: sent.emailId });
    expect(status?.status).toBe("failed");
    expect(status?.providerStatus).toBe("email.bounced");
  });
});
