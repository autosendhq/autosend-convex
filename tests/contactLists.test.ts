import { describe, expect, test } from "vitest";
import { makeTest, setMockFetch } from "./helpers";

const mockContactList = {
  id: "cl_abc123",
  name: "Newsletter Subscribers",
  description: "Monthly newsletter recipients",
  type: "list" as const,
  contactCount: 42,
  createdAt: "2025-01-15T10:00:00Z",
  updatedAt: "2025-01-15T10:00:00Z",
};

const mockSegment = {
  id: "seg_xyz789",
  name: "Active Users",
  description: "Users active in last 30 days",
  type: "segment" as const,
  contactCount: 128,
  createdAt: "2025-02-01T10:00:00Z",
  updatedAt: "2025-02-01T10:00:00Z",
};

const mockContact = {
  id: "ct_abc123",
  email: "user@example.com",
  firstName: "Jane",
  lastName: "Doe",
  userId: "usr_xyz",
  customFields: null,
  listIds: ["cl_abc123"],
  createdAt: "2025-01-15T10:00:00Z",
  updatedAt: "2025-01-15T10:00:00Z",
  projectId: "proj_123",
};

function configureApiKey(t: ReturnType<typeof makeTest>, apiKey = "AS_test_key") {
  return t.mutation("config:setConfig", {
    config: { autosendApiKey: apiKey },
  });
}

describe("contact lists CRUD", () => {
  test("listContactLists sends GET to /v1/contact-lists", async () => {
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
          data: { lists: [mockContactList, mockSegment] },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });

    const result = await t.action("contactLists:listContactLists", {});

    expect(capturedMethod).toBe("GET");
    expect(capturedUrl).toContain("/v1/contact-lists");
    expect(result.contactLists).toHaveLength(2);
    expect(result.contactLists[0].id).toBe("cl_abc123");
    expect(result.contactLists[0].name).toBe("Newsletter Subscribers");
    expect(result.contactLists[1].type).toBe("segment");
  });

  test("listContactLists with type filter appends query param", async () => {
    const t = makeTest();
    await configureApiKey(t);

    let capturedUrl = "";
    setMockFetch(async (input) => {
      capturedUrl = String(input);
      return new Response(
        JSON.stringify({
          success: true,
          data: { lists: [mockContactList] },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });

    await t.action("contactLists:listContactLists", { type: "list" });

    expect(capturedUrl).toContain("/v1/contact-lists?type=list");
  });

  test("listContactLists with segment type filter", async () => {
    const t = makeTest();
    await configureApiKey(t);

    let capturedUrl = "";
    setMockFetch(async (input) => {
      capturedUrl = String(input);
      return new Response(
        JSON.stringify({
          success: true,
          data: { lists: [mockSegment] },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });

    await t.action("contactLists:listContactLists", { type: "segment" });

    expect(capturedUrl).toContain("/v1/contact-lists?type=segment");
  });

  test("getContactList sends GET to /v1/contact-lists/:id", async () => {
    const t = makeTest();
    await configureApiKey(t);

    let capturedUrl = "";
    let capturedMethod = "";
    setMockFetch(async (input, init) => {
      capturedUrl = String(input);
      capturedMethod = init?.method ?? "GET";
      return new Response(
        JSON.stringify({ success: true, data: mockContactList }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });

    const result = await t.action("contactLists:getContactList", {
      listId: "cl_abc123",
    });

    expect(capturedMethod).toBe("GET");
    expect(capturedUrl).toContain("/v1/contact-lists/cl_abc123");
    expect(result.contactList.id).toBe("cl_abc123");
    expect(result.contactList.name).toBe("Newsletter Subscribers");
    expect(result.contactList.description).toBe("Monthly newsletter recipients");
  });

  test("getContactList encodes URL-unsafe listId", async () => {
    const t = makeTest();
    await configureApiKey(t);

    let capturedUrl = "";
    setMockFetch(async (input) => {
      capturedUrl = String(input);
      return new Response(
        JSON.stringify({ success: true, data: mockContactList }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });

    await t.action("contactLists:getContactList", {
      listId: "id/with spaces",
    });

    expect(capturedUrl).toContain("/v1/contact-lists/id%2Fwith%20spaces");
  });

  test("createContactList sends POST to /v1/contact-lists", async () => {
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
        JSON.stringify({ success: true, data: mockContactList }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      );
    });

    const result = await t.action("contactLists:createContactList", {
      name: "Newsletter Subscribers",
      description: "Monthly newsletter recipients",
    });

    expect(capturedMethod).toBe("POST");
    expect(capturedUrl).toContain("/v1/contact-lists");
    expect(capturedBody.name).toBe("Newsletter Subscribers");
    expect(capturedBody.description).toBe("Monthly newsletter recipients");
    expect(result.contactList.id).toBe("cl_abc123");
  });

  test("createContactList with name only", async () => {
    const t = makeTest();
    await configureApiKey(t);

    let capturedBody: any;
    setMockFetch(async (_input, init) => {
      capturedBody = JSON.parse(init?.body as string);
      return new Response(
        JSON.stringify({ success: true, data: mockContactList }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      );
    });

    await t.action("contactLists:createContactList", {
      name: "My List",
    });

    expect(capturedBody.name).toBe("My List");
    expect(capturedBody.description).toBeUndefined();
  });

  test("deleteContactList sends DELETE to /v1/contact-lists/:id", async () => {
    const t = makeTest();
    await configureApiKey(t);

    let capturedUrl = "";
    let capturedMethod = "";
    setMockFetch(async (input, init) => {
      capturedUrl = String(input);
      capturedMethod = init?.method ?? "";
      return new Response(
        JSON.stringify({ success: true, message: "Contact list deleted successfully" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });

    const result = await t.action("contactLists:deleteContactList", {
      listId: "cl_abc123",
    });

    expect(capturedMethod).toBe("DELETE");
    expect(capturedUrl).toContain("/v1/contact-lists/cl_abc123");
    expect(result.success).toBe(true);
    expect(result.message).toBe("Contact list deleted successfully");
  });
});

describe("contact list membership", () => {
  test("getContactListContacts sends POST to /v1/contact-lists/contacts/search", async () => {
    const t = makeTest();
    await configureApiKey(t);

    let capturedUrl = "";
    let capturedMethod = "";
    let capturedBody: any;
    setMockFetch(async (input, init) => {
      capturedUrl = String(input);
      capturedMethod = init?.method ?? "GET";
      capturedBody = JSON.parse(init?.body as string);
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            contacts: [mockContact],
            pagination: { page: 1, limit: 20, total: 1, pages: 1 },
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });

    const result = await t.action("contactLists:getContactListContacts", {
      listId: "cl_abc123",
    });

    expect(capturedMethod).toBe("POST");
    expect(capturedUrl).toContain("/v1/contact-lists/contacts/search");
    expect(capturedBody.contactListId).toBe("cl_abc123");
    expect(result.contacts).toHaveLength(1);
    expect(result.contacts[0].id).toBe("ct_abc123");
    expect(result.contacts[0].email).toBe("user@example.com");
    expect(result.pagination.total).toBe(1);
  });

  test("getContactListContacts with pagination params", async () => {
    const t = makeTest();
    await configureApiKey(t);

    let capturedBody: any;
    setMockFetch(async (_input, init) => {
      capturedBody = JSON.parse(init?.body as string);
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            contacts: [],
            pagination: { page: 2, limit: 25, total: 50, pages: 2 },
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });

    await t.action("contactLists:getContactListContacts", {
      listId: "cl_abc123",
      page: 2,
      limit: 25,
    });

    expect(capturedBody.page).toBe(2);
    expect(capturedBody.limit).toBe(25);
  });

  test("addContactsToList sends POST to /v1/contact-lists/:id/bulk-add with contactIds", async () => {
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
          data: { added: 3, created: 0, alreadyInList: 0, errors: [], totalContactsInList: 45 },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });

    const result = await t.action("contactLists:addContactsToList", {
      listId: "cl_abc123",
      contactIds: ["ct_1", "ct_2", "ct_3"],
    });

    expect(capturedMethod).toBe("POST");
    expect(capturedUrl).toContain("/v1/contact-lists/contacts/bulk-add");
    expect(capturedBody.contactListId).toBe("cl_abc123");
    expect(capturedBody.contactIds).toEqual(["ct_1", "ct_2", "ct_3"]);
    expect(result.success).toBe(true);
    expect(result.added).toBe(3);
    expect(result.totalContactsInList).toBe(45);
  });

  test("addContactsToList sends POST with emails", async () => {
    const t = makeTest();
    await configureApiKey(t);

    let capturedBody: any;
    setMockFetch(async (_input, init) => {
      capturedBody = JSON.parse(init?.body as string);
      return new Response(
        JSON.stringify({
          success: true,
          data: { added: 2, created: 2, alreadyInList: 0, errors: [], totalContactsInList: 44 },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });

    await t.action("contactLists:addContactsToList", {
      listId: "cl_abc123",
      emails: ["a@example.com", "b@example.com"],
    });

    expect(capturedBody.emails).toEqual(["a@example.com", "b@example.com"]);
  });

  test("addContactsToList rejects when no contactIds or emails provided", async () => {
    const t = makeTest();
    await configureApiKey(t);

    await expect(
      t.action("contactLists:addContactsToList", {
        listId: "cl_abc123",
      }),
    ).rejects.toThrow(/At least one contactId or email/);
  });

  test("addContactsToList rejects invalid emails", async () => {
    const t = makeTest();
    await configureApiKey(t);

    await expect(
      t.action("contactLists:addContactsToList", {
        listId: "cl_abc123",
        emails: ["not-valid"],
      }),
    ).rejects.toThrow(/Invalid email address/);
  });

  test("removeContactsFromList sends POST to /v1/contact-lists/:id/remove-contacts", async () => {
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
          data: { removed: 2, notInList: 0, errors: [] },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });

    const result = await t.action("contactLists:removeContactsFromList", {
      listId: "cl_abc123",
      contactIds: ["ct_1", "ct_2"],
    });

    expect(capturedMethod).toBe("POST");
    expect(capturedUrl).toContain("/v1/contact-lists/cl_abc123/contacts/remove");
    expect(capturedBody.contactIds).toEqual(["ct_1", "ct_2"]);
    expect(result.success).toBe(true);
    expect(result.removed).toBe(2);
    expect(result.notInList).toBe(0);
  });

  test("removeContactsFromList with emails", async () => {
    const t = makeTest();
    await configureApiKey(t);

    let capturedBody: any;
    setMockFetch(async (_input, init) => {
      capturedBody = JSON.parse(init?.body as string);
      return new Response(
        JSON.stringify({
          success: true,
          data: { removed: 1, notInList: 1, errors: [] },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });

    const result = await t.action("contactLists:removeContactsFromList", {
      listId: "cl_abc123",
      emails: ["a@example.com", "b@example.com"],
    });

    expect(capturedBody.emails).toEqual(["a@example.com", "b@example.com"]);
    expect(result.removed).toBe(1);
    expect(result.notInList).toBe(1);
  });

  test("removeContactsFromList rejects when no contactIds or emails provided", async () => {
    const t = makeTest();
    await configureApiKey(t);

    await expect(
      t.action("contactLists:removeContactsFromList", {
        listId: "cl_abc123",
      }),
    ).rejects.toThrow(/At least one contactId or email/);
  });
});

describe("contact lists headers and auth", () => {
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
        JSON.stringify({
          success: true,
          data: { lists: [] },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });

    await t.action("contactLists:listContactLists", {});

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
        JSON.stringify({ success: true, data: mockContactList }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });

    await t.action("contactLists:getContactList", {
      listId: "cl_abc123",
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
        JSON.stringify({ success: true, data: mockContactList }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      );
    });

    await t.action("contactLists:createContactList", {
      name: "Test List",
      apiKey: "AS_override_key",
    });

    expect(capturedHeaders["Authorization"]).toBe("Bearer AS_override_key");
  });

  test("rejects when no API key is configured", async () => {
    const t = makeTest();

    await expect(
      t.action("contactLists:listContactLists", {}),
    ).rejects.toThrow(/API key not configured/);
  });

  test("ASA_ key without projectId throws error", async () => {
    const t = makeTest();
    await configureApiKey(t, "ASA_account_key");

    setMockFetch(async () => {
      return new Response(
        JSON.stringify({
          success: true,
          data: { lists: [] },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });

    await expect(
      t.action("contactLists:listContactLists", {}),
    ).rejects.toThrow(/ASA_/);
  });

  test("API error is propagated", async () => {
    const t = makeTest();
    await configureApiKey(t);

    setMockFetch(async () => {
      return new Response(
        JSON.stringify({ success: false, error: "List not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    });

    await expect(
      t.action("contactLists:getContactList", { listId: "cl_nonexistent" }),
    ).rejects.toThrow(/List not found/);
  });
});
