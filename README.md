# @mzedstudio/autosend

[![npm version](https://img.shields.io/npm/v/@mzedstudio/autosend)](https://www.npmjs.com/package/@mzedstudio/autosend)
[![npm downloads](https://img.shields.io/npm/dw/@mzedstudio/autosend)](https://www.npmjs.com/package/@mzedstudio/autosend)

A [Convex component](https://docs.convex.dev/components) for transactional email delivery on top of AutoSend, including queueing, retries, idempotency, webhook verification, and delivery lifecycle tracking.

[Live Demo](https://convex-autosend.vercel.app/)

## Features

- Queue-first sending: `sendEmail` and `sendBulk` enqueue email jobs and automatically trigger queue processing.
- Deterministic idempotency: duplicate requests resolve to the same `emailId`.
- Retry handling: retryable failures (network, `429`, `5xx`) are retried with configurable backoff.
- Delivery lifecycle: full status model (`queued`, `sending`, `retrying`, `sent`, `failed`, `canceled`).
- CC/BCC and recipient names: supports `cc`, `bcc`, `toName`, `fromName`, and `replyToName`.
- Attachments: inline base64 content or URL-referenced file attachments.
- Templates: send via `templateId` with `dynamicData` for dynamic content.
- Unsubscribe groups: optional `unsubscribeGroupId` for suppression list management.
- Webhook security: HMAC SHA-256 signature validation and timestamp skew protection.
- Webhook dedupe: duplicate callback deliveries are ignored by `deliveryId`.
- Status/event persistence: stores webhook events and provider identifiers.
- Batch status queries: fetch status for multiple emails in a single call via `statusBatch`.
- Event listing: query webhook events per email via `listEvents`.
- Safe config reads: `getConfig` returns all non-secret config values (never exposes API key or webhook secret).
- Test sandbox mode: optional recipient rewriting via `sandboxTo`.
- Maintenance actions: cleanup for old terminal emails, abandoned sending jobs, and stale webhook delivery records. Supports dry-run preview before executing.
- Project management: create, list, and delete projects programmatically via Account API Keys (`ASA_` prefix).
- Contacts management: create, get, upsert, delete, search, and bulk update contacts via provider API.
- Contact lists: create, list, delete lists; add/remove contacts by ID or email; view list membership.

## Installation

```bash
npm install @mzedstudio/autosend convex
```

## Setup

### 1. Register the component

```ts
// convex/convex.config.ts
import { defineApp } from "convex/server";
import autosend from "@mzedstudio/autosend/convex.config.js";

const app = defineApp();
app.use(autosend, { name: "autosend" });
export default app;
```

### 2. Create a client wrapper

```ts
// convex/email.ts
import { AutoSend } from "@mzedstudio/autosend";
import { components } from "./_generated/api";

export const autosend = new AutoSend(components.autosend);
```

### 3. Configure secrets and runtime settings

Set your environment values in Convex:

```bash
npx convex env set AUTOSEND_API_KEY <api-key>
npx convex env set AUTOSEND_WEBHOOK_SECRET <webhook-secret>
```

Then persist component config:

```ts
// convex/admin.ts
import { mutation } from "./_generated/server";
import { autosend } from "./email";

export const configureAutosend = mutation({
  args: {},
  handler: async (ctx) => {
    await autosend.setConfig(ctx, {
      config: {
        autosendApiKey: "replace-with-your-key",
        webhookSecret: "replace-with-your-webhook-secret",
        defaultFrom: "noreply@example.com",
        testMode: true,
        sandboxTo: ["sandbox@example.com"],
      },
    });
  },
});
```

### 4. Mount webhook route

```ts
// convex/http.ts
import { httpRouter } from "convex/server";
import { registerRoutes } from "@mzedstudio/autosend";
import { components } from "./_generated/api";

const http = httpRouter();
registerRoutes(http, components.autosend);
export default http;
```

Default webhook path: `/webhooks/autosend`.

## Usage

### Send an email

```ts
import { mutation } from "./_generated/server";
import { autosend } from "./email";

export const sendWelcome = mutation({
  args: {},
  handler: async (ctx) => {
    return await autosend.sendEmail(ctx, {
      to: ["user@example.com"],
      toName: "Jane Doe",
      subject: "Welcome",
      html: "<p>Hello</p>",
    });
  },
});
```

`sendEmail` and `sendBulk` enqueue emails and automatically trigger queue processing. The `processQueue` action is available for manual recovery or cron-based sweep, but is not required for normal operation.

### Bulk send

```ts
await autosend.sendBulk(ctx, {
  recipients: ["a@example.com", "b@example.com"],
  subject: "Update",
  html: "<p>News</p>",
});
```

### Bulk send with per-recipient data

Use `recipientData` to interpolate `{{placeholders}}` in `subject`, `html`, and `text` per recipient:

```ts
await autosend.sendBulk(ctx, {
  recipients: ["alice@example.com", "bob@example.com"],
  recipientData: {
    "alice@example.com": { name: "Alice", role: "admin" },
    "bob@example.com": { name: "Bob", role: "member" },
  },
  subject: "Welcome, {{name}}",
  html: "<p>Hi {{name}}, you are now a {{role}}.</p>",
  text: "Hi {{name}}, you are now a {{role}}.",
});
```

When `recipientData` is provided, per-recipient data is also used as `dynamicData` for that recipient (overriding the shared `dynamicData` if both are set).

### CC, BCC, and attachments

```ts
await autosend.sendEmail(ctx, {
  to: ["user@example.com"],
  cc: [{ email: "team@example.com", name: "Team" }],
  bcc: [{ email: "archive@example.com" }],
  subject: "Report",
  html: "<p>See attached.</p>",
  attachments: [
    { filename: "report.pdf", fileUrl: "https://example.com/report.pdf" },
    { filename: "data.csv", content: "base64-encoded-content", contentType: "text/csv" },
  ],
  unsubscribeGroupId: "marketing",
});
```

### Templates

```ts
await autosend.sendEmail(ctx, {
  to: ["user@example.com"],
  templateId: "welcome-template-id",
  dynamicData: { firstName: "Jane", plan: "Pro" },
});
```

### Status, batch status, and events

```ts
// Single email status
const email = await autosend.status(ctx, { emailId });

// Batch status for multiple emails
const statuses = await autosend.statusBatch(ctx, {
  emailIds: [emailId1, emailId2, emailId3],
});

// List webhook events for an email
const events = await autosend.listEvents(ctx, { emailId, limit: 20 });

// Cancel a queued or retrying email
const { canceled } = await autosend.cancelEmail(ctx, { emailId });
```

### Cleanup

```ts
// Dry-run preview (no deletions)
const preview = await autosend.cleanupOldEmails(ctx, { dryRun: true });

// Delete old terminal emails (default: older than 7 days)
await autosend.cleanupOldEmails(ctx, { olderThanMs: 7 * 24 * 60 * 60 * 1000 });

// Recover abandoned sending jobs (default: stale after 15 min)
await autosend.cleanupAbandonedEmails(ctx, { staleAfterMs: 15 * 60 * 1000 });

// Prune old webhook delivery records (default: older than 7 days)
await autosend.cleanupOldDeliveries(ctx, { olderThanMs: 7 * 24 * 60 * 60 * 1000 });
```

## API Reference

### `AutoSend` class

| Method | Context | Returns | Notes |
|---|---|---|---|
| `sendEmail(ctx, args)` | mutation | `{ emailId, deduped }` | Enqueues and auto-processes one email |
| `sendBulk(ctx, args)` | mutation | `{ emailIds, acceptedCount }` | Enqueues and auto-processes up to 100 recipients |
| `status(ctx, { emailId })` | query | `EmailDoc \| null` | Reads current email state |
| `statusBatch(ctx, { emailIds })` | query | `(EmailDoc \| null)[]` | Batch status for multiple emails |
| `listEvents(ctx, { emailId, limit? })` | query | `EmailEvent[]` | Webhook events for an email (newest first, default limit 50, max 200) |
| `cancelEmail(ctx, { emailId })` | mutation | `{ canceled }` | Allowed only from `queued` or `retrying` |
| `setConfig(ctx, { config, replace? })` | mutation | `{ created }` | Merge by default, full replace when `replace: true` |
| `getConfig(ctx)` | query | `SafeConfig` | All non-secret config plus `hasApiKey`/`hasWebhookSecret` booleans |
| `processQueue(ctx, { batchSize? })` | action | `{ processedCount, sentCount, retriedCount, failedCount, hasMoreDue }` | Sends due queued/retrying emails |
| `cleanupOldEmails(ctx, args)` | action | `{ deletedCount, emailIds, hasMore }` | Removes old terminal emails. Supports `dryRun` |
| `cleanupAbandonedEmails(ctx, args)` | action | `{ recoveredCount, failedCount, emailIds, hasMore }` | Recovers stale `sending` jobs. Supports `dryRun` |
| `cleanupOldDeliveries(ctx, args)` | action | `{ deletedCount, hasMore }` | Removes old webhook delivery dedup records |
| `handleCallback(ctx, args)` | action | `{ ok, eventType, emailId?, duplicate?, error? }` | Verifies and applies webhook callback |
| `contacts.create(ctx, args)` | action | `{ contact }` | Create a new contact |
| `contacts.get(ctx, args)` | action | `{ contact }` | Get contact by ID |
| `contacts.upsert(ctx, args)` | action | `{ contact }` | Create or update contact by email |
| `contacts.delete(ctx, args)` | action | `{ success, message? }` | Delete contact by ID |
| `contacts.deleteByUserId(ctx, args)` | action | `{ success, message? }` | Delete contact by user ID |
| `contacts.removeByEmails(ctx, args)` | action | `{ success, message? }` | Remove contacts by email addresses |
| `contacts.search(ctx, args)` | action | `{ contacts }` | Search contacts by email addresses |
| `contacts.getUnsubscribeGroups(ctx, args)` | action | `{ groups }` | Get unsubscribe groups for a contact |
| `contacts.bulkUpdate(ctx, args)` | action | `{ successCount, failedCount, totalCount }` | Bulk update up to 500 contacts |
| `lists.list(ctx, args?)` | action | `{ contactLists }` | List all contact lists |
| `lists.get(ctx, args)` | action | `{ contactList }` | Get contact list by ID |
| `lists.create(ctx, args)` | action | `{ contactList }` | Create a new contact list |
| `lists.delete(ctx, args)` | action | `{ success, message }` | Delete a contact list |
| `lists.getContacts(ctx, args)` | action | `{ contacts, pagination }` | Get paginated contacts in a list |
| `lists.addContacts(ctx, args)` | action | `{ success, added, created, ... }` | Add contacts to a list |
| `lists.removeContacts(ctx, args)` | action | `{ success, removed, ... }` | Remove contacts from a list |

### `sendEmail` arguments

| Field | Type | Required | Notes |
|---|---|---|---|
| `to` | `string[]` | yes | Must contain exactly one recipient |
| `toName` | `string` | no | Display name for the recipient |
| `from` | `string` | no | Sender address (falls back to `defaultFrom` in config) |
| `fromName` | `string` | no | Display name for the sender |
| `replyTo` | `string` | no | Reply-to address (falls back to `defaultReplyTo` in config) |
| `replyToName` | `string` | no | Display name for reply-to |
| `cc` | `{ email, name? }[]` | no | Carbon copy recipients |
| `bcc` | `{ email, name? }[]` | no | Blind carbon copy recipients |
| `subject` | `string` | conditional | Required unless `templateId` is provided |
| `html` | `string` | conditional | HTML body; required unless `templateId` or `text` is provided |
| `text` | `string` | conditional | Plain text body |
| `templateId` | `string` | no | Provider template identifier |
| `dynamicData` | `any` | no | Template variables/merge fields |
| `attachments` | `Attachment[]` | no | File attachments (see below) |
| `metadata` | `any` | no | Arbitrary metadata stored with the email |
| `idempotencyKey` | `string` | no | Explicit dedup key (auto-generated from payload if omitted) |
| `unsubscribeGroupId` | `string` | no | Suppression group identifier |

### `sendBulk` arguments

Same as `sendEmail` except:
- `recipients: string[]` replaces `to` (up to 100 recipients)
- `recipientData?: Record<string, Record<string, unknown>>` — per-recipient merge fields keyed by email address; interpolates `{{placeholders}}` in `subject`, `html`, and `text`
- `idempotencyKeyPrefix: string` replaces `idempotencyKey`
- No `toName` (one email per recipient)

### `Attachment` format

| Field | Type | Required | Notes |
|---|---|---|---|
| `filename` | `string` | yes | Name of the attached file |
| `content` | `string` | conditional | Base64-encoded content (provide `content` or `fileUrl`, not both) |
| `fileUrl` | `string` | conditional | URL to fetch the file from |
| `contentType` | `string` | no | MIME type (e.g., `application/pdf`) |
| `disposition` | `string` | no | `attachment` or `inline` |
| `description` | `string` | no | File description |

### `registerRoutes(http, component, options?)`

Mounts webhook route handling:

- Default path: `/webhooks/autosend`
- Optional override: `options.path`
- Optional secret override: `options.webhookSecret`

Required headers:

- `x-webhook-signature`
- `x-webhook-event`
- `x-webhook-delivery-id`
- `x-webhook-timestamp`

## Config Reference

| Field | Type | Default | Description |
|---|---|---|---|
| `autosendApiKey` | `string` | unset | Bearer token for AutoSend API |
| `webhookSecret` | `string` | unset | HMAC secret for webhook verification |
| `testMode` | `boolean` | `true` | Rewrites recipients to `sandboxTo` |
| `defaultFrom` | `string` | unset | Fallback sender address |
| `defaultReplyTo` | `string` | unset | Fallback reply-to address |
| `sandboxTo` | `string[]` | `[]` | Target recipients used in test mode |
| `rateLimitRps` | `number` | `2` | Max sends per queue run |
| `retryDelaysMs` | `number[]` | `[5000,10000,20000]` | Retry delay schedule (ms) |
| `maxAttempts` | `number` | `4` | Total attempts including first try |
| `sendBatchSize` | `number` | `25` | Max queue items selected per run |
| `cleanupBatchSize` | `number` | `100` | Max items per cleanup batch |
| `cleanupOldEmailsMs` | `number` | `604800000` (7 days) | Age threshold for deleting terminal emails |
| `cleanupAbandonedMs` | `number` | `900000` (15 min) | Stale threshold for recovering abandoned `sending` jobs |
| `cleanupDeliveriesMs` | `number` | `604800000` (7 days) | Age threshold for pruning webhook delivery records |
| `providerCompatibilityMode` | `"strict" \| "lenient"` | `"strict"` | Response parsing strictness for provider variance |
| `autosendBaseUrl` | `string` | `https://api.autosend.com` | Base URL for provider API |
| `projectId` | `string` | unset | Project ID for Account API Keys (required with `ASA_` prefix keys) |

### Multi-Project Support

AutoSend supports two API key types:

- **Project API Key** (`AS_` prefix): Scoped to a single project. No additional configuration needed.
- **Account API Key** (`ASA_` prefix): Cross-project scope. Requires `projectId` to be set.

When `projectId` is configured, every API request includes an `x-project-id` header. If you use an Account API Key without setting `projectId`, the component throws a clear error at send time.

```ts
// Single-project setup (Project API Key) — no projectId needed
await autosend.setConfig(ctx, {
  config: {
    autosendApiKey: "AS_your_project_key",
    defaultFrom: "noreply@example.com",
  },
});

// Multi-project setup (Account API Key) — projectId required
await autosend.setConfig(ctx, {
  config: {
    autosendApiKey: "ASA_your_account_key",
    projectId: "proj_abc123",
    defaultFrom: "noreply@example.com",
  },
});
```

For multiple projects from a single Convex deployment, mount the component once per project:

```ts
// convex/convex.config.ts
const app = defineApp();
app.use(autosend, { name: "marketing" });
app.use(autosend, { name: "transactional" });
export default app;
```

Each instance gets its own config with its own `projectId`.

### Projects API

Manage projects programmatically using an Account API Key (`ASA_` prefix). These methods call the AutoSend Projects API and require admin-level access.

```ts
// List all projects in your organization
const { projects } = await autosend.listProjects(ctx);

// Create a new project
const { project } = await autosend.createProject(ctx, {
  name: "Marketing Emails",
  domain: "mail.example.com",     // optional
  regionKey: "us-east-1",         // optional: us-east-1, us-east-2, ap-south-1
});

// Use the new project's ID for email sending
await autosend.setConfig(ctx, {
  config: {
    projectId: project.id,
  },
});

// Delete a project (irreversible — removes all associated resources)
await autosend.deleteProject(ctx, {
  projectId: "60d5ec49f1b2c72d9c8b1234",
});
```

All three methods read the API key from config by default. You can also pass an `apiKey` override:

```ts
const { projects } = await autosend.listProjects(ctx, {
  apiKey: "ASA_your_account_key",
});
```

Project-scoped API keys (`AS_` prefix) cannot call these endpoints — only Account API Keys (`ASA_` prefix) are accepted.

### Contacts API

Manage contacts in your AutoSend project. All methods are available under `autosend.contacts`.

```ts
// Create a contact
const { contact } = await autosend.contacts.create(ctx, {
  email: "jane@example.com",
  firstName: "Jane",
  lastName: "Doe",
  listIds: ["list_abc123"],        // optional: add to lists on creation
  customFields: { plan: "pro" },   // optional
});

// Get a contact by ID
const { contact } = await autosend.contacts.get(ctx, {
  contactId: "ct_abc123",
});

// Upsert — create or update by email
const { contact } = await autosend.contacts.upsert(ctx, {
  email: "jane@example.com",
  firstName: "Jane",
  lastName: "Doe",
});

// Search contacts by email addresses
const { contacts } = await autosend.contacts.search(ctx, {
  emails: ["jane@example.com", "bob@example.com"],
});

// Bulk update contacts (up to 500)
const result = await autosend.contacts.bulkUpdate(ctx, {
  contacts: [
    { email: "jane@example.com", firstName: "Jane" },
    { email: "bob@example.com", firstName: "Bob" },
  ],
  runWorkflow: true, // optional: trigger automations
});

// Delete a contact
await autosend.contacts.delete(ctx, { contactId: "ct_abc123" });

// Delete by user ID
await autosend.contacts.deleteByUserId(ctx, { userId: "user_123" });

// Remove contacts by email addresses
await autosend.contacts.removeByEmails(ctx, {
  emails: ["jane@example.com"],
});

// Get unsubscribe groups for a contact
const { groups } = await autosend.contacts.getUnsubscribeGroups(ctx, {
  contactId: "ct_abc123",
});
```

All contacts methods accept optional `apiKey` and `projectId` overrides.

### Contact Lists API

Manage contact lists and their membership. All methods are available under `autosend.lists`.

```ts
// Create a list
const { contactList } = await autosend.lists.create(ctx, {
  name: "Newsletter Subscribers",
  description: "Monthly newsletter recipients",
});

// List all lists (optionally filter by type)
const { contactLists } = await autosend.lists.list(ctx, { type: "list" });

// Get a list by ID
const { contactList } = await autosend.lists.get(ctx, {
  listId: "cl_abc123",
});

// View contacts in a list (paginated)
const { contacts, pagination } = await autosend.lists.getContacts(ctx, {
  listId: "cl_abc123",
  page: 1,
  limit: 50,
  email: "jane@",  // optional: filter by email
});

// Add contacts to a list (by email or contact ID)
const result = await autosend.lists.addContacts(ctx, {
  listId: "cl_abc123",
  emails: ["jane@example.com", "bob@example.com"],
});
// Or by contact IDs:
await autosend.lists.addContacts(ctx, {
  listId: "cl_abc123",
  contactIds: ["ct_abc123", "ct_def456"],
});

// Remove contacts from a list
await autosend.lists.removeContacts(ctx, {
  listId: "cl_abc123",
  emails: ["jane@example.com"],
});

// Delete a list (contacts are not deleted)
await autosend.lists.delete(ctx, { listId: "cl_abc123" });
```

All list methods accept optional `apiKey` and `projectId` overrides.

### `getConfig` return value

`getConfig` returns a `SafeConfig` object containing all non-secret configuration values plus two booleans indicating whether secrets are set:

- All fields above except `autosendApiKey` and `webhookSecret`
- `hasApiKey: boolean` — whether `autosendApiKey` is configured
- `hasWebhookSecret: boolean` — whether `webhookSecret` is configured

## Email Lifecycle

### Statuses

- `queued`: accepted and waiting to be claimed by processor.
- `sending`: currently claimed by queue processor.
- `retrying`: previous attempt failed and next retry is scheduled.
- `sent`: successfully accepted by provider.
- `failed`: terminal failure (retries exhausted or non-retryable).
- `canceled`: canceled before send.

### Retry policy

- Retries on network failures, HTTP `429`, and HTTP `5xx`.
- Default delays: `5000`, `10000`, `20000` ms.
- Default `maxAttempts`: `4` total attempts.

## Webhook Behavior

- Signature: HMAC SHA-256 over raw body.
- Timestamp skew limit: 2 minutes.
- Dedupe key: `deliveryId`.
- All callback payloads are recorded to `emailEvents`.

Event mapping:

| Event type | Effect |
|---|---|
| `email.sent`, `email.delivered` | Mark/keep as sent, update provider status |
| `email.deferred` | Provider status update only |
| `email.bounced`, `email.spam_reported` | Mark failed if not already terminal |
| `email.opened`, `email.clicked`, `email.unsubscribed` | Event recorded, provider status update only |

## Direct Component Functions

If you do not use the `AutoSend` wrapper, the component exposes:

- `config.setConfig`
- `config.getConfig`
- `emails.sendEmail`
- `emails.sendBulk`
- `emails.cancelEmail`
- `queries.status`
- `queries.statusBatch`
- `queries.listEvents`
- `queue.processQueue`
- `cleanup.cleanupOldEmails`
- `cleanup.cleanupAbandonedEmails`
- `cleanup.cleanupOldDeliveries`
- `webhooks.handleCallback`
- `projects.listProjects`
- `projects.createProject`
- `projects.deleteProject`
- `contacts.createContact`
- `contacts.getContact`
- `contacts.upsertContact`
- `contacts.deleteContact`
- `contacts.deleteContactByUserId`
- `contacts.removeContactsByEmails`
- `contacts.searchContactsByEmails`
- `contacts.getUnsubscribeGroups`
- `contacts.bulkUpdateContacts`
- `contactLists.listContactLists`
- `contactLists.getContactList`
- `contactLists.createContactList`
- `contactLists.deleteContactList`
- `contactLists.getContactListContacts`
- `contactLists.addContactsToList`
- `contactLists.removeContactsFromList`

## Exported Types and Validators

The package exports TypeScript types and Convex validators for use in your own functions:

```ts
import type {
  // Email
  EmailStatus,           // "queued" | "retrying" | "sending" | "sent" | "failed" | "canceled"
  SendEmailArgs,         // Arguments for sendEmail
  SendBulkArgs,          // Arguments for sendBulk
  EmailRecipient,        // { email: string; name?: string }
  Attachment,            // Attachment object shape
  ConfigUpdate,          // Fields accepted by setConfig
  SafeConfig,            // Return type of getConfig
  DeliveryCleanupResult, // Return type of cleanupOldDeliveries
  ProviderCompatibilityMode, // "strict" | "lenient"
  // Projects
  Project,               // Project object shape
  ProjectDomain,         // Project domain with verification status
  CreateProjectResult,
  ListProjectsResult,
  DeleteProjectResult,
  // Contacts
  Contact,               // Contact object shape
  CreateContactArgs,
  CreateContactResult,
  GetContactResult,
  UpsertContactResult,
  DeleteContactResult,
  DeleteContactByUserIdResult,
  RemoveContactsByEmailsResult,
  SearchContactsResult,
  GetUnsubscribeGroupsResult,
  UnsubscribeGroup,
  BulkUpdateContactsResult,
  // Contact Lists
  ContactList,           // Contact list object shape
  ContactListType,       // "list" | "segment"
  Pagination,            // { page, limit, total, pages }
  ListContactListsResult,
  GetContactListResult,
  CreateContactListResult,
  DeleteContactListResult,
  GetContactListContactsResult,
  AddContactsToListResult,
  RemoveContactsFromListResult,
  BulkAddError,
} from "@mzedstudio/autosend";

// Convex validators (for use in your own function args/returns)
import {
  // Email
  emailStatusValidator,
  sendEmailArgsValidator,
  sendBulkArgsValidator,
  sendResultValidator,
  sendBulkResultValidator,
  cancelResultValidator,
  processQueueResultValidator,
  cleanupResultValidator,
  abandonedCleanupResultValidator,
  deliveryCleanupResultValidator,
  attachmentValidator,
  emailRecipientValidator,
  configUpdateValidator,
  safeConfigValidator,
  webhookHandleResultValidator,
  providerCompatibilityModeValidator,
  // Projects
  projectValidator,
  projectDomainValidator,
  createProjectArgsValidator,
  createProjectResultValidator,
  listProjectsResultValidator,
  deleteProjectResultValidator,
  // Contacts
  contactValidator,
  createContactArgsValidator,
  createContactResultValidator,
  getContactArgsValidator,
  getContactResultValidator,
  upsertContactArgsValidator,
  upsertContactResultValidator,
  deleteContactArgsValidator,
  deleteContactResultValidator,
  deleteContactByUserIdArgsValidator,
  deleteContactByUserIdResultValidator,
  removeContactsByEmailsArgsValidator,
  removeContactsByEmailsResultValidator,
  searchContactsArgsValidator,
  searchContactsResultValidator,
  getUnsubscribeGroupsArgsValidator,
  getUnsubscribeGroupsResultValidator,
  unsubscribeGroupValidator,
  bulkUpdateContactsArgsValidator,
  bulkUpdateContactsResultValidator,
  // Contact Lists
  contactListValidator,
  contactListTypeValidator,
  paginationValidator,
  listContactListsArgsValidator,
  listContactListsResultValidator,
  getContactListArgsValidator,
  getContactListResultValidator,
  createContactListArgsValidator,
  createContactListResultValidator,
  deleteContactListArgsValidator,
  deleteContactListResultValidator,
  getContactListContactsArgsValidator,
  getContactListContactsResultValidator,
  addContactsToListArgsValidator,
  addContactsToListResultValidator,
  removeContactsFromListArgsValidator,
  removeContactsFromListResultValidator,
  bulkAddErrorValidator,
} from "@mzedstudio/autosend";
```

## Testing

Use `@mzedstudio/autosend/test` with `convex-test`:

```ts
import { convexTest } from "convex-test";
import { register } from "@mzedstudio/autosend/test";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

const t = convexTest(schema, modules);
register(t, "autosend");
```

## License

Apache-2.0
