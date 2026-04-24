import type {
  Attachment,
  Contact,
  EmailRecipient,
  Project,
  ProviderCompatibilityMode,
} from "./types";

export type ProviderSendPayload = {
  to: string[];
  toName?: string;
  from: string;
  fromName?: string;
  replyTo?: string;
  replyToName?: string;
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  subject?: string;
  html?: string;
  text?: string;
  templateId?: string;
  dynamicData?: unknown;
  attachments?: Attachment[];
  metadata?: unknown;
  unsubscribeGroupId?: string;
};

export type ProviderOptions = {
  apiKey: string;
  baseUrl: string;
  compatibilityMode: ProviderCompatibilityMode;
  projectId?: string;
};

export type ProviderSendResult =
  | {
      ok: true;
      providerMessageId: string;
      providerStatus?: string;
      responseBody?: unknown;
    }
  | {
      ok: false;
      retryable: boolean;
      error: string;
      statusCode?: number;
      responseBody?: unknown;
    };

export type ProviderBulkResult =
  | {
      ok: true;
      providerMessageIds: string[];
      responseBody?: unknown;
    }
  | {
      ok: false;
      retryable: boolean;
      error: string;
      statusCode?: number;
      responseBody?: unknown;
    };

function toEmailObject(address: string, name?: string): { email: string; name?: string } {
  if (name && name.trim().length > 0) {
    return { email: address, name: name.trim() };
  }
  return { email: address };
}

function buildBody(payload: ProviderSendPayload) {
  return {
    to: toEmailObject(payload.to[0]!, payload.toName),
    from: toEmailObject(payload.from, payload.fromName),
    ...(payload.replyTo !== undefined
      ? { replyTo: toEmailObject(payload.replyTo, payload.replyToName) }
      : {}),
    ...(payload.cc !== undefined && payload.cc.length > 0
      ? { cc: payload.cc.map((r) => toEmailObject(r.email, r.name)) }
      : {}),
    ...(payload.bcc !== undefined && payload.bcc.length > 0
      ? { bcc: payload.bcc.map((r) => toEmailObject(r.email, r.name)) }
      : {}),
    ...(payload.subject !== undefined ? { subject: payload.subject } : {}),
    ...(payload.html !== undefined ? { html: payload.html } : {}),
    ...(payload.text !== undefined ? { text: payload.text } : {}),
    ...(payload.templateId !== undefined ? { templateId: payload.templateId } : {}),
    ...(payload.dynamicData !== undefined ? { dynamicData: payload.dynamicData } : {}),
    ...(payload.attachments !== undefined
      ? {
          attachments: payload.attachments.map((a) => ({
            fileName: a.filename,
            ...(a.content !== undefined ? { content: a.content } : {}),
            ...(a.fileUrl !== undefined ? { fileUrl: a.fileUrl } : {}),
            ...(a.contentType !== undefined ? { contentType: a.contentType } : {}),
            ...(a.disposition !== undefined ? { disposition: a.disposition } : {}),
            ...(a.description !== undefined ? { description: a.description } : {}),
          })),
        }
      : {}),
    ...(payload.metadata !== undefined ? { metadata: payload.metadata } : {}),
    ...(payload.unsubscribeGroupId !== undefined
      ? { unsubscribeGroupId: payload.unsubscribeGroupId }
      : {}),
  };
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

function pickString(value: unknown): string | undefined {
  if (typeof value === "string" && value.length > 0) return value;
  return undefined;
}

function extractProviderId(
  body: unknown,
  compatibilityMode: ProviderCompatibilityMode,
): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const data = body as Record<string, unknown>;

  const strictCandidates = [
    pickString(data.emailId),
    pickString((data.data as Record<string, unknown> | undefined)?.emailId),
  ];

  for (const candidate of strictCandidates) {
    if (candidate) return candidate;
  }

  if (compatibilityMode === "strict") return undefined;

  const lenientCandidates = [
    pickString(data.id),
    pickString(data.messageId),
    pickString((data.data as Record<string, unknown> | undefined)?.id),
    pickString((data.data as Record<string, unknown> | undefined)?.messageId),
  ];

  for (const candidate of lenientCandidates) {
    if (candidate) return candidate;
  }

  return undefined;
}

async function safeParseJson(response: Response): Promise<unknown | undefined> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

export async function normalizeError(
  response: Response,
  parsedBody?: unknown,
): Promise<string> {
  if (parsedBody && typeof parsedBody === "object") {
    const data = parsedBody as Record<string, unknown>;
    const fromFields = [
      pickString(data.error),
      pickString(data.message),
      pickString((data.error as Record<string, unknown> | undefined)?.message),
    ].find(Boolean);

    if (fromFields) {
      return `AutoSend ${response.status}: ${fromFields}`;
    }
  }

  try {
    const text = await response.text();
    if (text.trim().length > 0) {
      return `AutoSend ${response.status}: ${text}`;
    }
  } catch {
    // ignore
  }

  return `AutoSend ${response.status}: request failed`;
}

const PROVIDER_TIMEOUT_MS = 30_000;

function buildHeaders(options: ProviderOptions): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${options.apiKey}`,
  };
  if (options.projectId) {
    headers["x-project-id"] = options.projectId;
  }
  return headers;
}

function validateProjectConfig(options: ProviderOptions): void {
  if (options.apiKey.startsWith("ASA_") && !options.projectId) {
    throw new Error(
      "Account-scoped API keys (ASA_ prefix) require a projectId. " +
      "Set projectId via setConfig() or use a project-scoped API key (AS_ prefix).",
    );
  }
}

export async function sendOne(
  payload: ProviderSendPayload,
  options: ProviderOptions,
): Promise<ProviderSendResult> {
  validateProjectConfig(options);
  const baseUrl = normalizeBaseUrl(options.baseUrl);
  const endpoint = `${baseUrl}/v1/mails/send`;

  let response: Response;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: buildHeaders(options),
        body: JSON.stringify(buildBody(payload)),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    const isTimeout = error instanceof DOMException && error.name === "AbortError";
    return {
      ok: false,
      retryable: true,
      error: isTimeout
        ? `AutoSend request timed out after ${PROVIDER_TIMEOUT_MS}ms`
        : `AutoSend request failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }

  const parsedBody = await safeParseJson(response);

  if (!response.ok) {
    return {
      ok: false,
      retryable: isRetryableStatus(response.status),
      error: await normalizeError(response, parsedBody),
      statusCode: response.status,
      responseBody: parsedBody,
    };
  }

  const providerMessageId =
    extractProviderId(parsedBody, options.compatibilityMode) ??
    pickString(response.headers.get("x-message-id") ?? undefined);

  if (!providerMessageId) {
    return {
      ok: false,
      retryable: false,
      error:
        "AutoSend success response missing email identifier (enable lenient mode if provider payload varies).",
      statusCode: response.status,
      responseBody: parsedBody,
    };
  }

  const providerStatus =
    parsedBody && typeof parsedBody === "object"
      ? pickString((parsedBody as Record<string, unknown>).status)
      : undefined;

  return {
    ok: true,
    providerMessageId,
    providerStatus,
    responseBody: parsedBody,
  };
}

export async function sendBulk(
  payloads: ProviderSendPayload[],
  options: ProviderOptions,
): Promise<ProviderBulkResult> {
  validateProjectConfig(options);
  const baseUrl = normalizeBaseUrl(options.baseUrl);
  const endpoint = `${baseUrl}/v1/mails/bulk`;

  let response: Response;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: buildHeaders(options),
        body: JSON.stringify({ mails: payloads.map((payload) => buildBody(payload)) }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    const isTimeout = error instanceof DOMException && error.name === "AbortError";
    return {
      ok: false,
      retryable: true,
      error: isTimeout
        ? `AutoSend bulk request timed out after ${PROVIDER_TIMEOUT_MS}ms`
        : `AutoSend bulk request failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }

  const parsedBody = await safeParseJson(response);
  if (!response.ok) {
    return {
      ok: false,
      retryable: isRetryableStatus(response.status),
      error: await normalizeError(response, parsedBody),
      statusCode: response.status,
      responseBody: parsedBody,
    };
  }

  const providerMessageIds: string[] = [];

  if (Array.isArray((parsedBody as Record<string, unknown> | undefined)?.results)) {
    const results = (parsedBody as Record<string, unknown>).results as unknown[];
    for (const item of results) {
      const id = extractProviderId(item, options.compatibilityMode);
      if (id) providerMessageIds.push(id);
    }
  }

  if (providerMessageIds.length === 0) {
    const singleId = extractProviderId(parsedBody, options.compatibilityMode);
    if (singleId) providerMessageIds.push(singleId);
  }

  if (providerMessageIds.length === 0) {
    return {
      ok: false,
      retryable: false,
      error: "AutoSend bulk response missing email identifiers.",
      statusCode: response.status,
      responseBody: parsedBody,
    };
  }

  return {
    ok: true,
    providerMessageIds,
    responseBody: parsedBody,
  };
}

// ---------------------------------------------------------------------------
// Projects API
// ---------------------------------------------------------------------------

export type ProjectsApiOptions = {
  apiKey: string;
  baseUrl: string;
};

function validateAccountKey(apiKey: string): void {
  if (!apiKey.startsWith("ASA_")) {
    throw new Error(
      "Projects API requires an Account API key (ASA_ prefix). " +
        "Project-scoped API keys (AS_ prefix) cannot manage projects.",
    );
  }
}

function buildAccountHeaders(apiKey: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
}

function parseProject(data: unknown): Project {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid project data in API response");
  }
  const obj = data as Record<string, unknown>;
  const id = typeof obj.id === "string" && obj.id.length > 0 ? obj.id : null;
  const name = typeof obj.name === "string" && obj.name.length > 0 ? obj.name : null;
  if (!id) {
    throw new Error("Project response missing required 'id' field");
  }
  if (!name) {
    throw new Error("Project response missing required 'name' field");
  }
  return {
    id,
    name,
    domain: typeof obj.domain === "string" ? obj.domain : null,
    domains: Array.isArray(obj.domains)
      ? obj.domains.map((d: unknown) => {
          const item = d as Record<string, unknown>;
          return {
            id: String(item.id ?? ""),
            domain: String(item.domain ?? ""),
            verificationStatus: String(item.verificationStatus ?? ""),
          };
        })
      : [],
    regionKey: typeof obj.regionKey === "string" ? obj.regionKey : null,
    industry: typeof obj.industry === "string" ? obj.industry : null,
    logo: typeof obj.logo === "string" ? obj.logo : null,
    address: obj.address ?? null,
    trackingOpen: Boolean(obj.trackingOpen),
    trackingClick: Boolean(obj.trackingClick),
  };
}

export async function listProjects(options: ProjectsApiOptions): Promise<Project[]> {
  validateAccountKey(options.apiKey);
  const baseUrl = normalizeBaseUrl(options.baseUrl);
  const endpoint = `${baseUrl}/v1/account/projects`;

  let response: Response;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
    try {
      response = await fetch(endpoint, {
        method: "GET",
        headers: buildAccountHeaders(options.apiKey),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    const isTimeout = error instanceof DOMException && error.name === "AbortError";
    throw new Error(
      isTimeout
        ? `AutoSend request timed out after ${PROVIDER_TIMEOUT_MS}ms`
        : `AutoSend request failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const parsedBody = await safeParseJson(response);
  if (!response.ok) {
    throw new Error(await normalizeError(response, parsedBody));
  }

  const data = parsedBody as Record<string, unknown> | undefined;
  const projects = (data?.data as Record<string, unknown> | undefined)?.projects;
  if (!Array.isArray(projects)) {
    throw new Error("AutoSend list projects response missing projects array");
  }

  return projects.map(parseProject);
}

export async function createProject(
  args: { name: string; domain?: string; regionKey?: string },
  options: ProjectsApiOptions,
): Promise<Project> {
  validateAccountKey(options.apiKey);
  const baseUrl = normalizeBaseUrl(options.baseUrl);
  const endpoint = `${baseUrl}/v1/account/projects`;

  const body: Record<string, string> = { name: args.name };
  if (args.domain) body.domain = args.domain;
  if (args.regionKey) body.regionKey = args.regionKey;

  let response: Response;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: buildAccountHeaders(options.apiKey),
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    const isTimeout = error instanceof DOMException && error.name === "AbortError";
    throw new Error(
      isTimeout
        ? `AutoSend request timed out after ${PROVIDER_TIMEOUT_MS}ms`
        : `AutoSend request failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const parsedBody = await safeParseJson(response);
  if (!response.ok) {
    throw new Error(await normalizeError(response, parsedBody));
  }

  const data = (parsedBody as Record<string, unknown> | undefined)?.data;
  return parseProject(data);
}

export async function deleteProject(
  projectId: string,
  options: ProjectsApiOptions,
): Promise<{ success: boolean; message: string }> {
  validateAccountKey(options.apiKey);
  const baseUrl = normalizeBaseUrl(options.baseUrl);
  const endpoint = `${baseUrl}/v1/account/projects/${encodeURIComponent(projectId)}`;

  let response: Response;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
    try {
      response = await fetch(endpoint, {
        method: "DELETE",
        headers: buildAccountHeaders(options.apiKey),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    const isTimeout = error instanceof DOMException && error.name === "AbortError";
    throw new Error(
      isTimeout
        ? `AutoSend request timed out after ${PROVIDER_TIMEOUT_MS}ms`
        : `AutoSend request failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const parsedBody = await safeParseJson(response);
  if (!response.ok) {
    throw new Error(await normalizeError(response, parsedBody));
  }

  const data = parsedBody as Record<string, unknown> | undefined;
  return {
    success: Boolean(data?.success),
    message: typeof data?.message === "string" ? data.message : "Project deleted successfully",
  };
}

// ---------------------------------------------------------------------------
// Contacts API
// ---------------------------------------------------------------------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email: string): void {
  if (!EMAIL_RE.test(email)) {
    throw new Error(`Invalid email address: "${email}"`);
  }
}

function parseContact(data: unknown): Contact {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid contact data in API response");
  }
  const obj = data as Record<string, unknown>;
  const id = typeof obj.id === "string" && obj.id.length > 0 ? obj.id : null;
  const email = typeof obj.email === "string" && obj.email.length > 0 ? obj.email : null;
  if (!id) {
    throw new Error("Contact response missing required 'id' field");
  }
  if (!email) {
    throw new Error("Contact response missing required 'email' field");
  }
  return {
    id,
    email,
    firstName: typeof obj.firstName === "string" ? obj.firstName : null,
    lastName: typeof obj.lastName === "string" ? obj.lastName : null,
    userId: typeof obj.userId === "string" ? obj.userId : null,
    customFields: obj.customFields ?? null,
    listIds: Array.isArray(obj.listIds) ? obj.listIds.map(String) : undefined,
    createdAt: typeof obj.createdAt === "string" ? obj.createdAt : "",
    updatedAt: typeof obj.updatedAt === "string" ? obj.updatedAt : "",
    projectId: typeof obj.projectId === "string" ? obj.projectId : undefined,
  };
}

export async function createContact(
  args: {
    email: string;
    firstName?: string;
    lastName?: string;
    userId?: string;
    listIds?: string[];
    customFields?: unknown;
  },
  options: ProviderOptions,
): Promise<Contact> {
  validateEmail(args.email);
  validateProjectConfig(options);

  if (args.customFields !== undefined) {
    await ensureCustomFields(args.customFields, options);
  }

  const baseUrl = normalizeBaseUrl(options.baseUrl);
  const endpoint = `${baseUrl}/v1/contacts`;

  const body: Record<string, unknown> = { email: args.email };
  if (args.firstName !== undefined) body.firstName = args.firstName;
  if (args.lastName !== undefined) body.lastName = args.lastName;
  if (args.userId !== undefined) body.userId = args.userId;
  if (args.listIds !== undefined) body.listIds = args.listIds;
  if (args.customFields !== undefined) body.customFields = args.customFields;

  let response: Response;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: buildHeaders(options),
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    const isTimeout = error instanceof DOMException && error.name === "AbortError";
    throw new Error(
      isTimeout
        ? `AutoSend request timed out after ${PROVIDER_TIMEOUT_MS}ms`
        : `AutoSend request failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const parsedBody = await safeParseJson(response);
  if (!response.ok) {
    throw new Error(await normalizeError(response, parsedBody));
  }

  const data = (parsedBody as Record<string, unknown> | undefined)?.data;
  return parseContact(data);
}

export async function getContact(
  contactId: string,
  options: ProviderOptions,
): Promise<Contact> {
  validateProjectConfig(options);
  const baseUrl = normalizeBaseUrl(options.baseUrl);
  const endpoint = `${baseUrl}/v1/contacts/${encodeURIComponent(contactId)}`;

  let response: Response;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
    try {
      response = await fetch(endpoint, {
        method: "GET",
        headers: buildHeaders(options),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    const isTimeout = error instanceof DOMException && error.name === "AbortError";
    throw new Error(
      isTimeout
        ? `AutoSend request timed out after ${PROVIDER_TIMEOUT_MS}ms`
        : `AutoSend request failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const parsedBody = await safeParseJson(response);
  if (!response.ok) {
    throw new Error(await normalizeError(response, parsedBody));
  }

  const data = (parsedBody as Record<string, unknown> | undefined)?.data;
  return parseContact(data);
}

export async function upsertContact(
  args: {
    email: string;
    firstName?: string;
    lastName?: string;
    userId?: string;
    listIds?: string[];
    customFields?: unknown;
  },
  options: ProviderOptions,
): Promise<Contact> {
  validateEmail(args.email);
  validateProjectConfig(options);

  if (args.customFields !== undefined) {
    await ensureCustomFields(args.customFields, options);
  }

  const baseUrl = normalizeBaseUrl(options.baseUrl);
  const endpoint = `${baseUrl}/v1/contacts/email`;

  const body: Record<string, unknown> = { email: args.email };
  if (args.firstName !== undefined) body.firstName = args.firstName;
  if (args.lastName !== undefined) body.lastName = args.lastName;
  if (args.userId !== undefined) body.userId = args.userId;
  if (args.listIds !== undefined) body.listIds = args.listIds;
  if (args.customFields !== undefined) body.customFields = args.customFields;

  let response: Response;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: buildHeaders(options),
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    const isTimeout = error instanceof DOMException && error.name === "AbortError";
    throw new Error(
      isTimeout
        ? `AutoSend request timed out after ${PROVIDER_TIMEOUT_MS}ms`
        : `AutoSend request failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const parsedBody = await safeParseJson(response);
  if (!response.ok) {
    throw new Error(await normalizeError(response, parsedBody));
  }

  const data = (parsedBody as Record<string, unknown> | undefined)?.data;
  return parseContact(data);
}

export async function deleteContact(
  contactId: string,
  options: ProviderOptions,
): Promise<{ success: boolean; message: string }> {
  validateProjectConfig(options);
  const baseUrl = normalizeBaseUrl(options.baseUrl);
  const endpoint = `${baseUrl}/v1/contacts/${encodeURIComponent(contactId)}`;

  let response: Response;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
    try {
      response = await fetch(endpoint, {
        method: "DELETE",
        headers: buildHeaders(options),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    const isTimeout = error instanceof DOMException && error.name === "AbortError";
    throw new Error(
      isTimeout
        ? `AutoSend request timed out after ${PROVIDER_TIMEOUT_MS}ms`
        : `AutoSend request failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const parsedBody = await safeParseJson(response);
  if (!response.ok) {
    throw new Error(await normalizeError(response, parsedBody));
  }

  const data = parsedBody as Record<string, unknown> | undefined;
  return {
    success: Boolean(data?.success),
    message: typeof data?.message === "string" ? data.message : "Contact deleted successfully",
  };
}

export async function deleteContactByUserId(
  userId: string,
  options: ProviderOptions,
): Promise<{ success: boolean; message: string }> {
  validateProjectConfig(options);
  if (!userId || userId.trim().length === 0) {
    throw new Error("userId is required for deleteContactByUserId.");
  }
  const baseUrl = normalizeBaseUrl(options.baseUrl);
  const endpoint = `${baseUrl}/v1/contacts/email/userId/${encodeURIComponent(userId)}`;

  let response: Response;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
    try {
      response = await fetch(endpoint, {
        method: "DELETE",
        headers: buildHeaders(options),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    const isTimeout = error instanceof DOMException && error.name === "AbortError";
    throw new Error(
      isTimeout
        ? `AutoSend request timed out after ${PROVIDER_TIMEOUT_MS}ms`
        : `AutoSend request failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const parsedBody = await safeParseJson(response);
  if (!response.ok) {
    throw new Error(await normalizeError(response, parsedBody));
  }

  const data = parsedBody as Record<string, unknown> | undefined;
  return {
    success: Boolean(data?.success),
    message: typeof data?.message === "string" ? data.message : "Contact deleted successfully",
  };
}

export async function removeContactsByEmails(
  emails: string[],
  options: ProviderOptions,
): Promise<{ success: boolean; message: string }> {
  if (emails.length === 0) {
    throw new Error("At least one email is required for removeContactsByEmails.");
  }
  for (const email of emails) {
    validateEmail(email);
  }
  validateProjectConfig(options);
  const baseUrl = normalizeBaseUrl(options.baseUrl);
  const endpoint = `${baseUrl}/v1/contacts/remove`;

  let response: Response;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: buildHeaders(options),
        body: JSON.stringify({ emails }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    const isTimeout = error instanceof DOMException && error.name === "AbortError";
    throw new Error(
      isTimeout
        ? `AutoSend request timed out after ${PROVIDER_TIMEOUT_MS}ms`
        : `AutoSend request failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const parsedBody = await safeParseJson(response);
  if (!response.ok) {
    throw new Error(await normalizeError(response, parsedBody));
  }

  const data = parsedBody as Record<string, unknown> | undefined;
  return {
    success: Boolean(data?.success),
    message: typeof data?.message === "string" ? data.message : "Contacts removed successfully",
  };
}

export async function searchContactsByEmails(
  emails: string[],
  options: ProviderOptions,
): Promise<Contact[]> {
  for (const email of emails) {
    validateEmail(email);
  }
  validateProjectConfig(options);
  const baseUrl = normalizeBaseUrl(options.baseUrl);
  const endpoint = `${baseUrl}/v1/contacts/search/emails`;

  let response: Response;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: buildHeaders(options),
        body: JSON.stringify({ emails }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    const isTimeout = error instanceof DOMException && error.name === "AbortError";
    throw new Error(
      isTimeout
        ? `AutoSend request timed out after ${PROVIDER_TIMEOUT_MS}ms`
        : `AutoSend request failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const parsedBody = await safeParseJson(response);
  if (!response.ok) {
    throw new Error(await normalizeError(response, parsedBody));
  }

  const data = parsedBody as Record<string, unknown> | undefined;
  const contacts = (data?.data as Record<string, unknown> | undefined)?.contacts;
  if (!Array.isArray(contacts)) {
    throw new Error("AutoSend search contacts response missing contacts array");
  }

  return contacts.map(parseContact);
}

export async function getContactUnsubscribeGroups(
  contactId: string,
  options: ProviderOptions,
): Promise<Array<{ groupId: string; name: string }>> {
  validateProjectConfig(options);
  const baseUrl = normalizeBaseUrl(options.baseUrl);
  const endpoint = `${baseUrl}/v1/contacts/${encodeURIComponent(contactId)}/unsubscribe-groups`;

  let response: Response;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
    try {
      response = await fetch(endpoint, {
        method: "GET",
        headers: buildHeaders(options),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    const isTimeout = error instanceof DOMException && error.name === "AbortError";
    throw new Error(
      isTimeout
        ? `AutoSend request timed out after ${PROVIDER_TIMEOUT_MS}ms`
        : `AutoSend request failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const parsedBody = await safeParseJson(response);
  if (!response.ok) {
    throw new Error(await normalizeError(response, parsedBody));
  }

  const data = parsedBody as Record<string, unknown> | undefined;
  const groups = (data?.data as Record<string, unknown> | undefined)?.groups;
  if (!Array.isArray(groups)) {
    throw new Error("AutoSend unsubscribe groups response missing groups array");
  }

  return groups.map((g: unknown) => {
    const item = g as Record<string, unknown>;
    return {
      groupId: String(item.groupId ?? ""),
      name: String(item.name ?? ""),
    };
  });
}

const BULK_UPDATE_MAX_CONTACTS = 100;

export async function bulkUpdateContacts(
  args: {
    contacts: Array<{
      email: string;
      firstName?: string;
      lastName?: string;
      userId?: string;
      customFields?: unknown;
    }>;
    runWorkflow?: boolean;
  },
  options: ProviderOptions,
): Promise<{ successCount: number; failedCount: number; totalCount: number }> {
  if (args.contacts.length === 0) {
    throw new Error("At least one contact is required for bulk update.");
  }
  if (args.contacts.length > BULK_UPDATE_MAX_CONTACTS) {
    throw new Error(
      `Bulk update supports a maximum of ${BULK_UPDATE_MAX_CONTACTS} contacts per call (got ${args.contacts.length}).`,
    );
  }
  for (const contact of args.contacts) {
    validateEmail(contact.email);
  }
  validateProjectConfig(options);

  // Collect all custom field keys across all contacts and ensure definitions exist
  const mergedFields: Record<string, unknown> = {};
  for (const contact of args.contacts) {
    if (contact.customFields && typeof contact.customFields === "object" && !Array.isArray(contact.customFields)) {
      Object.assign(mergedFields, contact.customFields);
    }
  }
  if (Object.keys(mergedFields).length > 0) {
    await ensureCustomFields(mergedFields, options);
  }

  const baseUrl = normalizeBaseUrl(options.baseUrl);
  const endpoint = `${baseUrl}/v1/contacts/bulk-update`;

  const body: Record<string, unknown> = { contacts: args.contacts };
  if (args.runWorkflow !== undefined) body.runWorkflow = args.runWorkflow;

  let response: Response;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: buildHeaders(options),
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    const isTimeout = error instanceof DOMException && error.name === "AbortError";
    throw new Error(
      isTimeout
        ? `AutoSend request timed out after ${PROVIDER_TIMEOUT_MS}ms`
        : `AutoSend request failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const parsedBody = await safeParseJson(response);
  if (!response.ok) {
    throw new Error(await normalizeError(response, parsedBody));
  }

  const data = (parsedBody as Record<string, unknown> | undefined)?.data as
    | Record<string, unknown>
    | undefined;
  return {
    successCount: typeof data?.successCount === "number" ? data.successCount : 0,
    failedCount: typeof data?.failedCount === "number" ? data.failedCount : 0,
    totalCount: typeof data?.totalCount === "number" ? data.totalCount : 0,
  };
}

// ---------------------------------------------------------------------------
// Custom field auto-creation
// ---------------------------------------------------------------------------

const RESERVED_FIELD_NAMES = new Set([
  "email",
  "firstName",
  "lastName",
  "userId",
  "mobile",
  "createdAt",
  "updatedAt",
]);

function inferFieldType(value: unknown): string {
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "number";
  if (typeof value === "string") {
    // ISO date-like strings → date
    if (/^\d{4}-\d{2}-\d{2}(T|\s)/.test(value)) return "date";
    return "string";
  }
  return "string";
}

/**
 * Ensures that every key in `customFields` has a corresponding custom field
 * definition in AutoSend. Creates any missing ones, inferring type from value.
 * Silently ignores 409 (already exists) so concurrent calls are safe.
 */
export async function ensureCustomFields(
  customFields: unknown,
  options: ProviderOptions,
): Promise<void> {
  if (
    !customFields ||
    typeof customFields !== "object" ||
    Array.isArray(customFields)
  ) {
    return;
  }

  const fields = customFields as Record<string, unknown>;
  const keys = Object.keys(fields).filter((k) => !RESERVED_FIELD_NAMES.has(k));
  if (keys.length === 0) return;

  validateProjectConfig(options);
  const baseUrl = normalizeBaseUrl(options.baseUrl);

  // Fetch existing field definitions
  const listEndpoint = `${baseUrl}/v1/custom-fields?includeReservedFields=false`;
  let existingNames = new Set<string>();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
  try {
    const response = await fetch(listEndpoint, {
      method: "GET",
      headers: buildHeaders(options),
      signal: controller.signal,
    });
    if (response.ok) {
      const body = await safeParseJson(response);
      const data = (body as Record<string, unknown> | undefined)?.data as
        | Record<string, unknown>
        | undefined;
      const fieldList = data?.customFields;
      if (Array.isArray(fieldList)) {
        existingNames = new Set(
          fieldList
            .filter(
              (f: unknown): f is Record<string, unknown> =>
                typeof f === "object" && f !== null && typeof (f as Record<string, unknown>).fieldName === "string",
            )
            .map((f) => f.fieldName as string),
        );
      }
    }
  } catch {
    // If listing fails, try to create all — 409s will be harmless
  } finally {
    clearTimeout(timeoutId);
  }

  const missing = keys.filter((k) => !existingNames.has(k));
  if (missing.length === 0) return;

  // Create missing fields in parallel
  const createEndpoint = `${baseUrl}/v1/custom-fields`;
  await Promise.all(
    missing.map(async (fieldName) => {
      const fieldType = inferFieldType(fields[fieldName]);
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
        try {
          const response = await fetch(createEndpoint, {
            method: "POST",
            headers: buildHeaders(options),
            body: JSON.stringify({ fieldName, fieldType }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          // 409 = already exists, perfectly fine
          if (!response.ok && response.status !== 409) {
            // Non-critical — log but don't throw
            await response.text();
          }
        } finally {
          clearTimeout(timeoutId);
        }
      } catch {
        // Non-critical — contact creation will still proceed
      }
    }),
  );
}
