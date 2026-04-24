import { describe, expect, test } from "vitest";
import { makeTest, setMockFetch } from "./helpers";

const mockContact = {
  id: "ct_abc123",
  email: "user@example.com",
  firstName: "Jane",
  lastName: "Doe",
  userId: "usr_xyz",
  customFields: { plan: "pro" },
  listIds: ["list_1"],
  createdAt: "2025-01-15T10:00:00Z",
  updatedAt: "2025-01-15T10:00:00Z",
  projectId: "proj_123",
};

function configureApiKey(t: ReturnType<typeof makeTest>, apiKey = "AS_test_key") {
  return t.mutation("config:setConfig", {
    config: { autosendApiKey: apiKey },
  });
}

describe("contacts CRUD", () => {
  test("createContact sends POST to /v1/contacts with correct body", async () => {
    const t = makeTest();
    await configureApiKey(t);

    const requests: Array<{ url: string; method: string; body?: unknown }> = [];
    setMockFetch(async (input, init) => {
      const url = String(input);
      const method = init?.method ?? "GET";
      const body = init?.body ? JSON.parse(init.body as string) : undefined;
      requests.push({ url, method, body });

      // Return appropriate responses for custom-fields and contacts endpoints
      if (url.includes("/v1/custom-fields")) {
        return new Response(
          JSON.stringify({ success: true, data: { customFields: [] } }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify({ success: true, data: mockContact }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      );
    });

    const result = await t.action("contacts:createContact", {
      email: "user@example.com",
      firstName: "Jane",
      lastName: "Doe",
      userId: "usr_xyz",
      listIds: ["list_1"],
      customFields: { plan: "pro" },
    });

    // ensureCustomFields should list fields then create the missing "plan" field
    const fieldListReq = requests.find((r) => r.url.includes("/v1/custom-fields") && r.method === "GET");
    expect(fieldListReq).toBeDefined();

    const fieldCreateReq = requests.find((r) => r.url.includes("/v1/custom-fields") && r.method === "POST");
    expect(fieldCreateReq).toBeDefined();
    expect(fieldCreateReq!.body).toMatchObject({ fieldName: "plan", fieldType: "string" });

    // The actual contact creation request
    const createReq = requests.find((r) => r.url.includes("/v1/contacts") && !r.url.includes("custom-fields") && r.method === "POST");
    expect(createReq).toBeDefined();
    expect(createReq!.body).toMatchObject({
      email: "user@example.com",
      firstName: "Jane",
      lastName: "Doe",
      userId: "usr_xyz",
      listIds: ["list_1"],
      customFields: { plan: "pro" },
    });
    expect(result.contact.id).toBe("ct_abc123");
    expect(result.contact.email).toBe("user@example.com");
  });

  test("getContact sends GET to /v1/contacts/:id", async () => {
    const t = makeTest();
    await configureApiKey(t);

    let capturedUrl = "";
    let capturedMethod = "";
    setMockFetch(async (input, init) => {
      capturedUrl = String(input);
      capturedMethod = init?.method ?? "GET";
      return new Response(
        JSON.stringify({ success: true, data: mockContact }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });

    const result = await t.action("contacts:getContact", {
      contactId: "ct_abc123",
    });

    expect(capturedMethod).toBe("GET");
    expect(capturedUrl).toContain("/v1/contacts/ct_abc123");
    expect(result.contact.id).toBe("ct_abc123");
    expect(result.contact.firstName).toBe("Jane");
  });

  test("upsertContact sends POST to /v1/contacts/email", async () => {
    const t = makeTest();
    await configureApiKey(t);

    let capturedUrl = "";
    let capturedMethod = "";
    let capturedBody: any;
    setMockFetch(async (input, init) => {
      capturedUrl = String(input);
      capturedMethod = init?.method ?? "";
      capturedBody = JSON.parse(init?.body as string);
      return new Response(
        JSON.stringify({ success: true, data: mockContact }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });

    const result = await t.action("contacts:upsertContact", {
      email: "user@example.com",
      firstName: "Jane",
    });

    expect(capturedMethod).toBe("POST");
    expect(capturedUrl).toContain("/v1/contacts/email");
    expect(capturedBody.email).toBe("user@example.com");
    expect(capturedBody.firstName).toBe("Jane");
    expect(result.contact.id).toBe("ct_abc123");
  });

  test("deleteContact sends DELETE to /v1/contacts/:id", async () => {
    const t = makeTest();
    await configureApiKey(t);

    let capturedUrl = "";
    let capturedMethod = "";
    setMockFetch(async (input, init) => {
      capturedUrl = String(input);
      capturedMethod = init?.method ?? "";
      return new Response(
        JSON.stringify({ success: true, message: "Contact deleted successfully" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });

    const result = await t.action("contacts:deleteContact", {
      contactId: "ct_abc123",
    });

    expect(capturedMethod).toBe("DELETE");
    expect(capturedUrl).toContain("/v1/contacts/ct_abc123");
    expect(result.success).toBe(true);
    expect(result.message).toBe("Contact deleted successfully");
  });

  test("deleteContact encodes URL-unsafe contactId", async () => {
    const t = makeTest();
    await configureApiKey(t);

    let capturedUrl = "";
    setMockFetch(async (input) => {
      capturedUrl = String(input);
      return new Response(
        JSON.stringify({ success: true, message: "Deleted" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });

    await t.action("contacts:deleteContact", {
      contactId: "id/with spaces&special=chars",
    });

    expect(capturedUrl).toContain(
      "/v1/contacts/id%2Fwith%20spaces%26special%3Dchars",
    );
  });

  test("deleteContactByUserId sends DELETE to /v1/contacts/email/userId/:userId", async () => {
    const t = makeTest();
    await configureApiKey(t);

    let capturedUrl = "";
    let capturedMethod = "";
    setMockFetch(async (input, init) => {
      capturedUrl = String(input);
      capturedMethod = init?.method ?? "";
      return new Response(
        JSON.stringify({ success: true, message: "Contact deleted successfully" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });

    const result = await t.action("contacts:deleteContactByUserId", {
      userId: "usr_xyz",
    });

    expect(capturedMethod).toBe("DELETE");
    expect(capturedUrl).toContain("/v1/contacts/email/userId/usr_xyz");
    expect(result.success).toBe(true);
  });

  test("deleteContactByUserId encodes URL-unsafe userId", async () => {
    const t = makeTest();
    await configureApiKey(t);

    let capturedUrl = "";
    setMockFetch(async (input) => {
      capturedUrl = String(input);
      return new Response(
        JSON.stringify({ success: true, message: "Deleted" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });

    await t.action("contacts:deleteContactByUserId", {
      userId: "user/with spaces",
    });

    expect(capturedUrl).toContain(
      "/v1/contacts/email/userId/user%2Fwith%20spaces",
    );
  });

  test("deleteContactByUserId rejects empty userId", async () => {
    const t = makeTest();
    await configureApiKey(t);

    await expect(
      t.action("contacts:deleteContactByUserId", { userId: "" }),
    ).rejects.toThrow(/userId is required/);
  });

  test("removeContactsByEmails sends POST to /v1/contacts/remove", async () => {
    const t = makeTest();
    await configureApiKey(t);

    let capturedUrl = "";
    let capturedMethod = "";
    let capturedBody: Record<string, unknown> | undefined;
    setMockFetch(async (input, init) => {
      capturedUrl = String(input);
      capturedMethod = init?.method ?? "";
      capturedBody = JSON.parse(init?.body as string);
      return new Response(
        JSON.stringify({ success: true, message: "Contacts removed successfully" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });

    const result = await t.action("contacts:removeContactsByEmails", {
      emails: ["a@example.com", "b@example.com"],
    });

    expect(capturedMethod).toBe("POST");
    expect(capturedUrl).toContain("/v1/contacts/remove");
    expect(capturedBody!.emails).toEqual(["a@example.com", "b@example.com"]);
    expect(result.success).toBe(true);
  });

  test("removeContactsByEmails rejects empty emails array", async () => {
    const t = makeTest();
    await configureApiKey(t);

    await expect(
      t.action("contacts:removeContactsByEmails", { emails: [] }),
    ).rejects.toThrow(/At least one email/);
  });

  test("removeContactsByEmails rejects invalid emails", async () => {
    const t = makeTest();
    await configureApiKey(t);

    await expect(
      t.action("contacts:removeContactsByEmails", { emails: ["bad-email"] }),
    ).rejects.toThrow(/Invalid email address/);
  });
});

describe("contacts headers and auth", () => {
  test("x-project-id header is sent when projectId is configured", async () => {
    const t = makeTest();
    await t.mutation("config:setConfig", {
      config: {
        autosendApiKey: "AS_test_key",
        projectId: "proj_abc123",
      },
    });

    let capturedHeaders: Record<string, string> = {};
    setMockFetch(async (_input, init) => {
      capturedHeaders = { ...(init?.headers as Record<string, string>) };
      return new Response(
        JSON.stringify({ success: true, data: mockContact }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });

    await t.action("contacts:createContact", {
      email: "user@example.com",
    });

    expect(capturedHeaders["x-project-id"]).toBe("proj_abc123");
    expect(capturedHeaders["Authorization"]).toBe("Bearer AS_test_key");
  });

  test("per-call projectId override works", async () => {
    const t = makeTest();
    await t.mutation("config:setConfig", {
      config: {
        autosendApiKey: "AS_test_key",
        projectId: "proj_global",
      },
    });

    let capturedHeaders: Record<string, string> = {};
    setMockFetch(async (_input, init) => {
      capturedHeaders = { ...(init?.headers as Record<string, string>) };
      return new Response(
        JSON.stringify({ success: true, data: mockContact }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });

    await t.action("contacts:getContact", {
      contactId: "ct_abc123",
      projectId: "proj_override",
    });

    expect(capturedHeaders["x-project-id"]).toBe("proj_override");
  });

  test("per-call apiKey override works", async () => {
    const t = makeTest();
    await configureApiKey(t, "AS_global_key");

    let capturedHeaders: Record<string, string> = {};
    setMockFetch(async (_input, init) => {
      capturedHeaders = { ...(init?.headers as Record<string, string>) };
      return new Response(
        JSON.stringify({ success: true, data: mockContact }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });

    await t.action("contacts:createContact", {
      email: "user@example.com",
      apiKey: "AS_override_key",
    });

    expect(capturedHeaders["Authorization"]).toBe("Bearer AS_override_key");
  });

  test("rejects when no API key is configured", async () => {
    const t = makeTest();

    await expect(
      t.action("contacts:createContact", { email: "user@example.com" }),
    ).rejects.toThrow(/API key not configured/);
  });

  test("ASA_ key without projectId throws error", async () => {
    const t = makeTest();
    await configureApiKey(t, "ASA_account_key");

    setMockFetch(async () => {
      return new Response(
        JSON.stringify({ success: true, data: mockContact }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });

    await expect(
      t.action("contacts:createContact", { email: "user@example.com" }),
    ).rejects.toThrow(/ASA_/);
  });

  test("API error is propagated", async () => {
    const t = makeTest();
    await configureApiKey(t);

    setMockFetch(async () => {
      return new Response(
        JSON.stringify({ success: false, error: "Contact not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    });

    await expect(
      t.action("contacts:getContact", { contactId: "ct_nonexistent" }),
    ).rejects.toThrow(/Contact not found/);
  });
});

describe("contacts validation", () => {
  test("rejects invalid email format on createContact", async () => {
    const t = makeTest();
    await configureApiKey(t);

    await expect(
      t.action("contacts:createContact", { email: "not-an-email" }),
    ).rejects.toThrow(/Invalid email address/);
  });

  test("rejects invalid email format on upsertContact", async () => {
    const t = makeTest();
    await configureApiKey(t);

    await expect(
      t.action("contacts:upsertContact", { email: "missing-at-sign" }),
    ).rejects.toThrow(/Invalid email address/);
  });

  test("bulkUpdateContacts rejects more than 100 contacts", async () => {
    const t = makeTest();
    await configureApiKey(t);

    const contacts = Array.from({ length: 101 }, (_, i) => ({
      email: `user${i}@example.com`,
    }));

    await expect(
      t.action("contacts:bulkUpdateContacts", { contacts }),
    ).rejects.toThrow(/maximum of 100/);
  });

  test("bulkUpdateContacts rejects empty contacts array", async () => {
    const t = makeTest();
    await configureApiKey(t);

    await expect(
      t.action("contacts:bulkUpdateContacts", { contacts: [] }),
    ).rejects.toThrow(/At least one contact/);
  });

  test("bulkUpdateContacts rejects invalid email in contacts", async () => {
    const t = makeTest();
    await configureApiKey(t);

    await expect(
      t.action("contacts:bulkUpdateContacts", {
        contacts: [{ email: "bad" }],
      }),
    ).rejects.toThrow(/Invalid email address/);
  });

  test("searchContactsByEmails rejects invalid email", async () => {
    const t = makeTest();
    await configureApiKey(t);

    await expect(
      t.action("contacts:searchContactsByEmails", { emails: ["not-valid"] }),
    ).rejects.toThrow(/Invalid email address/);
  });
});

describe("contact search", () => {
  test("searchContactsByEmails sends POST to /v1/contacts/search/emails", async () => {
    const t = makeTest();
    await configureApiKey(t);

    let capturedUrl = "";
    let capturedMethod = "";
    let capturedBody: any;
    setMockFetch(async (input, init) => {
      capturedUrl = String(input);
      capturedMethod = init?.method ?? "";
      capturedBody = JSON.parse(init?.body as string);
      return new Response(
        JSON.stringify({
          success: true,
          data: { contacts: [mockContact] },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });

    const result = await t.action("contacts:searchContactsByEmails", {
      emails: ["user@example.com", "other@example.com"],
    });

    expect(capturedMethod).toBe("POST");
    expect(capturedUrl).toContain("/v1/contacts/search/emails");
    expect(capturedBody.emails).toEqual(["user@example.com", "other@example.com"]);
    expect(result.contacts).toHaveLength(1);
    expect(result.contacts[0].email).toBe("user@example.com");
  });
});

describe("contact bulk update", () => {
  test("bulkUpdateContacts sends POST to /v1/contacts/bulk-update", async () => {
    const t = makeTest();
    await configureApiKey(t);

    let capturedUrl = "";
    let capturedMethod = "";
    let capturedBody: any;
    setMockFetch(async (input, init) => {
      capturedUrl = String(input);
      capturedMethod = init?.method ?? "";
      capturedBody = JSON.parse(init?.body as string);
      return new Response(
        JSON.stringify({
          success: true,
          data: { successCount: 2, failedCount: 0, totalCount: 2 },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });

    const result = await t.action("contacts:bulkUpdateContacts", {
      contacts: [
        { email: "a@example.com", firstName: "Alice" },
        { email: "b@example.com", firstName: "Bob" },
      ],
      runWorkflow: true,
    });

    expect(capturedMethod).toBe("POST");
    expect(capturedUrl).toContain("/v1/contacts/bulk-update");
    expect(capturedBody.contacts).toHaveLength(2);
    expect(capturedBody.runWorkflow).toBe(true);
    expect(result.successCount).toBe(2);
    expect(result.failedCount).toBe(0);
    expect(result.totalCount).toBe(2);
  });

  test("bulkUpdateContacts omits runWorkflow when not specified", async () => {
    const t = makeTest();
    await configureApiKey(t);

    let capturedBody: any;
    setMockFetch(async (_input, init) => {
      capturedBody = JSON.parse(init?.body as string);
      return new Response(
        JSON.stringify({
          success: true,
          data: { successCount: 1, failedCount: 0, totalCount: 1 },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });

    await t.action("contacts:bulkUpdateContacts", {
      contacts: [{ email: "a@example.com" }],
    });

    expect(capturedBody.runWorkflow).toBeUndefined();
  });
});

describe("contact unsubscribe groups", () => {
  test("getUnsubscribeGroups sends GET to /v1/contacts/:id/unsubscribe-groups", async () => {
    const t = makeTest();
    await configureApiKey(t);

    let capturedUrl = "";
    let capturedMethod = "";
    setMockFetch(async (input, init) => {
      capturedUrl = String(input);
      capturedMethod = init?.method ?? "GET";
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            groups: [
              { groupId: "grp_1", name: "Marketing" },
              { groupId: "grp_2", name: "Product Updates" },
            ],
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });

    const result = await t.action("contacts:getUnsubscribeGroups", {
      contactId: "ct_abc123",
    });

    expect(capturedMethod).toBe("GET");
    expect(capturedUrl).toContain("/v1/contacts/ct_abc123/unsubscribe-groups");
    expect(result.groups).toHaveLength(2);
    expect(result.groups[0].groupId).toBe("grp_1");
    expect(result.groups[0].name).toBe("Marketing");
    expect(result.groups[1].groupId).toBe("grp_2");
  });
});
