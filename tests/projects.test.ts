import { describe, expect, test } from "vitest";
import { makeTest, setMockFetch } from "./helpers";

describe("multi-project support", () => {
  test("x-project-id header is sent when projectId is configured", async () => {
    const t = makeTest();

    await t.mutation("config:setConfig", {
      config: {
        testMode: false,
        autosendApiKey: "AS_test_key",
        defaultFrom: "noreply@example.com",
        projectId: "proj_abc123",
      },
    });

    let capturedHeaders: Record<string, string> = {};
    setMockFetch(async (_input, init) => {
      const headers = init?.headers as Record<string, string>;
      capturedHeaders = { ...headers };
      return new Response(
        JSON.stringify({ emailId: "provider_1", status: "queued" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });

    await t.mutation("emails:sendEmail", {
      to: ["user@example.com"],
      subject: "Hello",
      html: "<p>Hi</p>",
    });

    await t.action("queue:processQueue", {});

    expect(capturedHeaders["x-project-id"]).toBe("proj_abc123");
    expect(capturedHeaders["Authorization"]).toBe("Bearer AS_test_key");
  });

  test("x-project-id header is absent when projectId is not set", async () => {
    const t = makeTest();

    await t.mutation("config:setConfig", {
      config: {
        testMode: false,
        autosendApiKey: "AS_test_key",
        defaultFrom: "noreply@example.com",
      },
    });

    let capturedHeaders: Record<string, string> = {};
    setMockFetch(async (_input, init) => {
      const headers = init?.headers as Record<string, string>;
      capturedHeaders = { ...headers };
      return new Response(
        JSON.stringify({ emailId: "provider_1", status: "queued" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });

    await t.mutation("emails:sendEmail", {
      to: ["user@example.com"],
      subject: "Hello",
      html: "<p>Hi</p>",
    });

    await t.action("queue:processQueue", {});

    expect(capturedHeaders["x-project-id"]).toBeUndefined();
    expect(capturedHeaders["Authorization"]).toBe("Bearer AS_test_key");
  });

  test("ASA_ key with projectId sends successfully", async () => {
    const t = makeTest();

    await t.mutation("config:setConfig", {
      config: {
        testMode: false,
        autosendApiKey: "ASA_account_key",
        defaultFrom: "noreply@example.com",
        projectId: "proj_multi123",
      },
    });

    let capturedHeaders: Record<string, string> = {};
    setMockFetch(async (_input, init) => {
      const headers = init?.headers as Record<string, string>;
      capturedHeaders = { ...headers };
      return new Response(
        JSON.stringify({ emailId: "provider_multi", status: "queued" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });

    await t.mutation("emails:sendEmail", {
      to: ["user@example.com"],
      subject: "Multi-project",
      html: "<p>Hi</p>",
    });

    const result = await t.action("queue:processQueue", {});
    expect(result.sentCount).toBe(1);
    expect(result.failedCount).toBe(0);
    expect(capturedHeaders["x-project-id"]).toBe("proj_multi123");
    expect(capturedHeaders["Authorization"]).toBe("Bearer ASA_account_key");
  });

  test("ASA_ key without projectId throws error during queue processing", async () => {
    const t = makeTest();

    await t.mutation("config:setConfig", {
      config: {
        testMode: false,
        autosendApiKey: "ASA_account_key",
        defaultFrom: "noreply@example.com",
        maxAttempts: 1,
      },
    });

    setMockFetch(async () => {
      return new Response(
        JSON.stringify({ emailId: "provider_1", status: "queued" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });

    const sent = await t.mutation("emails:sendEmail", {
      to: ["user@example.com"],
      subject: "Hello",
      html: "<p>Hi</p>",
    });

    // Queue processing should fail because ASA_ key requires projectId.
    // The error is caught per-email in queueInternal, so it marks the email as failed.
    const result = await t.action("queue:processQueue", {});
    expect(result.processedCount).toBe(1);
    expect(result.failedCount).toBe(1);

    const status = await t.query("queries:status", { emailId: sent.emailId });
    expect(status?.status).toBe("failed");
    expect(status?.lastError).toContain("ASA_");
  });

  test("AS_ key without projectId works fine (backward compatible)", async () => {
    const t = makeTest();

    await t.mutation("config:setConfig", {
      config: {
        testMode: false,
        autosendApiKey: "AS_project_key",
        defaultFrom: "noreply@example.com",
      },
    });

    setMockFetch(async () => {
      return new Response(
        JSON.stringify({ emailId: "provider_1", status: "queued" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });

    await t.mutation("emails:sendEmail", {
      to: ["user@example.com"],
      subject: "Hello",
      html: "<p>Hi</p>",
    });

    const result = await t.action("queue:processQueue", {});
    expect(result.sentCount).toBe(1);
    expect(result.failedCount).toBe(0);
  });

  test("projectId persists via setConfig and appears in getConfig", async () => {
    const t = makeTest();

    await t.mutation("config:setConfig", {
      config: {
        projectId: "proj_xyz789",
      },
    });

    const config = await t.query("config:getConfig", {});
    expect(config.projectId).toBe("proj_xyz789");
  });
});

describe("projects API", () => {
  const mockProject = {
    id: "60d5ec49f1b2c72d9c8b1234",
    name: "My Project",
    domain: "example.com",
    domains: [
      { id: "dom_1", domain: "example.com", verificationStatus: "verified" },
    ],
    regionKey: "us-east-1",
    industry: null,
    logo: null,
    address: null,
    trackingOpen: true,
    trackingClick: false,
  };

  test("listProjects returns projects from API", async () => {
    const t = makeTest();

    await t.mutation("config:setConfig", {
      config: {
        autosendApiKey: "ASA_account_key",
      },
    });

    let capturedUrl = "";
    let capturedMethod = "";
    let capturedHeaders: Record<string, string> = {};
    setMockFetch(async (input, init) => {
      capturedUrl = String(input);
      capturedMethod = init?.method ?? "GET";
      capturedHeaders = { ...(init?.headers as Record<string, string>) };
      return new Response(
        JSON.stringify({
          success: true,
          data: { projects: [mockProject] },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });

    const result = await t.action("projects:listProjects", {});

    expect(capturedMethod).toBe("GET");
    expect(capturedUrl).toContain("/v1/account/projects");
    expect(capturedHeaders["Authorization"]).toBe("Bearer ASA_account_key");
    expect(result.projects).toHaveLength(1);
    expect(result.projects[0].id).toBe("60d5ec49f1b2c72d9c8b1234");
    expect(result.projects[0].name).toBe("My Project");
    expect(result.projects[0].domain).toBe("example.com");
    expect(result.projects[0].trackingOpen).toBe(true);
  });

  test("createProject sends name, domain, regionKey and returns project", async () => {
    const t = makeTest();

    await t.mutation("config:setConfig", {
      config: {
        autosendApiKey: "ASA_account_key",
      },
    });

    let capturedBody: any;
    let capturedMethod = "";
    setMockFetch(async (_input, init) => {
      capturedMethod = init?.method ?? "";
      capturedBody = JSON.parse(init?.body as string);
      return new Response(
        JSON.stringify({ success: true, data: mockProject }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      );
    });

    const result = await t.action("projects:createProject", {
      name: "My Project",
      domain: "example.com",
      regionKey: "us-east-1",
    });

    expect(capturedMethod).toBe("POST");
    expect(capturedBody.name).toBe("My Project");
    expect(capturedBody.domain).toBe("example.com");
    expect(capturedBody.regionKey).toBe("us-east-1");
    expect(result.project.id).toBe("60d5ec49f1b2c72d9c8b1234");
    expect(result.project.name).toBe("My Project");
  });

  test("deleteProject sends DELETE to correct endpoint", async () => {
    const t = makeTest();

    await t.mutation("config:setConfig", {
      config: {
        autosendApiKey: "ASA_account_key",
      },
    });

    let capturedUrl = "";
    let capturedMethod = "";
    setMockFetch(async (input, init) => {
      capturedUrl = String(input);
      capturedMethod = init?.method ?? "";
      return new Response(
        JSON.stringify({ success: true, message: "Project deleted successfully" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });

    const result = await t.action("projects:deleteProject", {
      projectId: "60d5ec49f1b2c72d9c8b1234",
    });

    expect(capturedMethod).toBe("DELETE");
    expect(capturedUrl).toContain("/v1/account/projects/60d5ec49f1b2c72d9c8b1234");
    expect(result.success).toBe(true);
    expect(result.message).toBe("Project deleted successfully");
  });

  test("deleteProject encodes URL-unsafe projectId", async () => {
    const t = makeTest();

    await t.mutation("config:setConfig", {
      config: {
        autosendApiKey: "ASA_account_key",
      },
    });

    let capturedUrl = "";
    setMockFetch(async (input) => {
      capturedUrl = String(input);
      return new Response(
        JSON.stringify({ success: true, message: "Deleted" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });

    await t.action("projects:deleteProject", {
      projectId: "id/with spaces&special=chars",
    });

    expect(capturedUrl).toContain(
      "/v1/account/projects/id%2Fwith%20spaces%26special%3Dchars",
    );
  });

  test("projects API rejects AS_ key with clear error", async () => {
    const t = makeTest();

    await t.mutation("config:setConfig", {
      config: {
        autosendApiKey: "AS_project_key",
      },
    });

    await expect(
      t.action("projects:listProjects", {}),
    ).rejects.toThrow(/ASA_ prefix/);
  });

  test("projects API rejects when no API key is configured", async () => {
    const t = makeTest();

    await expect(
      t.action("projects:listProjects", {}),
    ).rejects.toThrow(/API key not configured/);
  });

  test("listProjects accepts apiKey override", async () => {
    const t = makeTest();

    // Config has AS_ key, but we override with ASA_
    await t.mutation("config:setConfig", {
      config: {
        autosendApiKey: "AS_project_key",
      },
    });

    let capturedHeaders: Record<string, string> = {};
    setMockFetch(async (_input, init) => {
      capturedHeaders = { ...(init?.headers as Record<string, string>) };
      return new Response(
        JSON.stringify({ success: true, data: { projects: [] } }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });

    const result = await t.action("projects:listProjects", {
      apiKey: "ASA_override_key",
    });

    expect(capturedHeaders["Authorization"]).toBe("Bearer ASA_override_key");
    expect(result.projects).toHaveLength(0);
  });

  test("createProject propagates API error", async () => {
    const t = makeTest();

    await t.mutation("config:setConfig", {
      config: {
        autosendApiKey: "ASA_account_key",
      },
    });

    setMockFetch(async () => {
      return new Response(
        JSON.stringify({
          success: false,
          error: { message: "Plan upgrade required" },
        }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    });

    await expect(
      t.action("projects:createProject", { name: "New Project" }),
    ).rejects.toThrow(/Plan upgrade required/);
  });
});
