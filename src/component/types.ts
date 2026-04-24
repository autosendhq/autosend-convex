import { v, type Infer } from "convex/values";

export const emailStatusValidator = v.union(
  v.literal("queued"),
  v.literal("retrying"),
  v.literal("sending"),
  v.literal("sent"),
  v.literal("failed"),
  v.literal("canceled"),
);

export type EmailStatus = Infer<typeof emailStatusValidator>;

export const providerCompatibilityModeValidator = v.union(
  v.literal("strict"),
  v.literal("lenient"),
);

export type ProviderCompatibilityMode = Infer<
  typeof providerCompatibilityModeValidator
>;

export const emailRecipientValidator = v.object({
  email: v.string(),
  name: v.optional(v.string()),
});

export type EmailRecipient = Infer<typeof emailRecipientValidator>;

export const attachmentValidator = v.object({
  filename: v.string(),
  content: v.optional(v.string()),
  fileUrl: v.optional(v.string()),
  contentType: v.optional(v.string()),
  disposition: v.optional(v.string()),
  description: v.optional(v.string()),
});

export type Attachment = Infer<typeof attachmentValidator>;

export const sendEmailArgsValidator = v.object({
  to: v.array(v.string()),
  toName: v.optional(v.string()),
  from: v.optional(v.string()),
  fromName: v.optional(v.string()),
  replyTo: v.optional(v.string()),
  replyToName: v.optional(v.string()),
  cc: v.optional(v.array(emailRecipientValidator)),
  bcc: v.optional(v.array(emailRecipientValidator)),
  subject: v.optional(v.string()),
  html: v.optional(v.string()),
  text: v.optional(v.string()),
  templateId: v.optional(v.string()),
  dynamicData: v.optional(v.any()),
  attachments: v.optional(v.array(attachmentValidator)),
  metadata: v.optional(v.any()),
  idempotencyKey: v.optional(v.string()),
  unsubscribeGroupId: v.optional(v.string()),
});

export type SendEmailArgs = Infer<typeof sendEmailArgsValidator>;

export const sendBulkArgsValidator = v.object({
  recipients: v.array(v.string()),
  recipientData: v.optional(v.any()),
  from: v.optional(v.string()),
  fromName: v.optional(v.string()),
  replyTo: v.optional(v.string()),
  replyToName: v.optional(v.string()),
  cc: v.optional(v.array(emailRecipientValidator)),
  bcc: v.optional(v.array(emailRecipientValidator)),
  subject: v.optional(v.string()),
  html: v.optional(v.string()),
  text: v.optional(v.string()),
  templateId: v.optional(v.string()),
  dynamicData: v.optional(v.any()),
  attachments: v.optional(v.array(attachmentValidator)),
  metadata: v.optional(v.any()),
  idempotencyKeyPrefix: v.optional(v.string()),
  unsubscribeGroupId: v.optional(v.string()),
});

export type SendBulkArgs = Infer<typeof sendBulkArgsValidator>;

export const configUpdateValidator = v.object({
  autosendApiKey: v.optional(v.string()),
  webhookSecret: v.optional(v.string()),
  testMode: v.optional(v.boolean()),
  defaultFrom: v.optional(v.string()),
  defaultReplyTo: v.optional(v.string()),
  sandboxTo: v.optional(v.array(v.string())),
  rateLimitRps: v.optional(v.number()),
  retryDelaysMs: v.optional(v.array(v.number())),
  maxAttempts: v.optional(v.number()),
  sendBatchSize: v.optional(v.number()),
  cleanupBatchSize: v.optional(v.number()),
  cleanupOldEmailsMs: v.optional(v.number()),
  cleanupAbandonedMs: v.optional(v.number()),
  cleanupDeliveriesMs: v.optional(v.number()),
  providerCompatibilityMode: v.optional(providerCompatibilityModeValidator),
  autosendBaseUrl: v.optional(v.string()),
  projectId: v.optional(v.string()),
});

export type ConfigUpdate = Infer<typeof configUpdateValidator>;

export const safeConfigValidator = v.object({
  testMode: v.boolean(),
  defaultFrom: v.optional(v.string()),
  defaultReplyTo: v.optional(v.string()),
  sandboxTo: v.array(v.string()),
  rateLimitRps: v.number(),
  retryDelaysMs: v.array(v.number()),
  maxAttempts: v.number(),
  sendBatchSize: v.number(),
  cleanupBatchSize: v.number(),
  cleanupOldEmailsMs: v.number(),
  cleanupAbandonedMs: v.number(),
  cleanupDeliveriesMs: v.number(),
  providerCompatibilityMode: providerCompatibilityModeValidator,
  autosendBaseUrl: v.string(),
  projectId: v.optional(v.string()),
  hasApiKey: v.boolean(),
  hasWebhookSecret: v.boolean(),
});

export type SafeConfig = Infer<typeof safeConfigValidator>;

export const emailDocValidator = v.object({
  _id: v.id("emails"),
  _creationTime: v.number(),
  emailId: v.string(),
  idempotencyKey: v.string(),
  status: emailStatusValidator,
  to: v.array(v.string()),
  toName: v.optional(v.string()),
  from: v.string(),
  fromName: v.optional(v.string()),
  replyTo: v.optional(v.string()),
  replyToName: v.optional(v.string()),
  cc: v.optional(v.array(emailRecipientValidator)),
  bcc: v.optional(v.array(emailRecipientValidator)),
  subject: v.optional(v.string()),
  html: v.optional(v.string()),
  text: v.optional(v.string()),
  templateId: v.optional(v.string()),
  dynamicData: v.optional(v.any()),
  attachments: v.optional(v.array(attachmentValidator)),
  metadata: v.optional(v.any()),
  unsubscribeGroupId: v.optional(v.string()),
  attemptCount: v.number(),
  maxAttempts: v.number(),
  nextAttemptAt: v.number(),
  lastAttemptAt: v.optional(v.number()),
  lastError: v.optional(v.string()),
  providerMessageId: v.optional(v.string()),
  providerStatus: v.optional(v.string()),
  queuedAt: v.number(),
  sentAt: v.optional(v.number()),
  failedAt: v.optional(v.number()),
  canceledAt: v.optional(v.number()),
  updatedAt: v.number(),
});

export type EmailDoc = Infer<typeof emailDocValidator>;

export const sendResultValidator = v.object({
  emailId: v.string(),
  deduped: v.boolean(),
});
export type SendResult = Infer<typeof sendResultValidator>;

export const sendBulkResultValidator = v.object({
  emailIds: v.array(v.string()),
  acceptedCount: v.number(),
});
export type SendBulkResult = Infer<typeof sendBulkResultValidator>;

export const cancelResultValidator = v.object({
  canceled: v.boolean(),
});
export type CancelResult = Infer<typeof cancelResultValidator>;

export const processQueueResultValidator = v.object({
  processedCount: v.number(),
  sentCount: v.number(),
  retriedCount: v.number(),
  failedCount: v.number(),
  hasMoreDue: v.boolean(),
});
export type ProcessQueueResult = Infer<typeof processQueueResultValidator>;

export const webhookHandleResultValidator = v.object({
  ok: v.boolean(),
  eventType: v.string(),
  emailId: v.optional(v.string()),
  duplicate: v.optional(v.boolean()),
  error: v.optional(v.string()),
});
export type WebhookHandleResult = Infer<typeof webhookHandleResultValidator>;

export const cleanupResultValidator = v.object({
  deletedCount: v.number(),
  emailIds: v.array(v.string()),
  hasMore: v.boolean(),
});
export type CleanupResult = Infer<typeof cleanupResultValidator>;

export const abandonedCleanupResultValidator = v.object({
  recoveredCount: v.number(),
  failedCount: v.number(),
  emailIds: v.array(v.string()),
  hasMore: v.boolean(),
});
export type AbandonedCleanupResult = Infer<typeof abandonedCleanupResultValidator>;

export const deliveryCleanupResultValidator = v.object({
  deletedCount: v.number(),
  hasMore: v.boolean(),
});
export type DeliveryCleanupResult = Infer<typeof deliveryCleanupResultValidator>;

export const TERMINAL_STATUSES: EmailStatus[] = ["sent", "failed", "canceled"];

// ---------------------------------------------------------------------------
// Projects API types
// ---------------------------------------------------------------------------

export const projectDomainValidator = v.object({
  id: v.string(),
  domain: v.string(),
  verificationStatus: v.string(),
});

export type ProjectDomain = Infer<typeof projectDomainValidator>;

export const projectValidator = v.object({
  id: v.string(),
  name: v.string(),
  domain: v.union(v.string(), v.null()),
  domains: v.array(projectDomainValidator),
  regionKey: v.union(v.string(), v.null()),
  industry: v.union(v.string(), v.null()),
  logo: v.union(v.string(), v.null()),
  address: v.any(),
  trackingOpen: v.boolean(),
  trackingClick: v.boolean(),
});

export type Project = Infer<typeof projectValidator>;

export const createProjectArgsValidator = v.object({
  name: v.string(),
  domain: v.optional(v.string()),
  regionKey: v.optional(v.string()),
  apiKey: v.optional(v.string()),
});

export type CreateProjectArgs = Infer<typeof createProjectArgsValidator>;

export const listProjectsResultValidator = v.object({
  projects: v.array(projectValidator),
});

export type ListProjectsResult = Infer<typeof listProjectsResultValidator>;

export const createProjectResultValidator = v.object({
  project: projectValidator,
});

export type CreateProjectResult = Infer<typeof createProjectResultValidator>;

export const deleteProjectResultValidator = v.object({
  success: v.boolean(),
  message: v.string(),
});

export type DeleteProjectResult = Infer<typeof deleteProjectResultValidator>;

// ---------------------------------------------------------------------------
// Contacts API types
// ---------------------------------------------------------------------------

export const contactValidator = v.object({
  id: v.string(),
  email: v.string(),
  firstName: v.union(v.string(), v.null()),
  lastName: v.union(v.string(), v.null()),
  userId: v.union(v.string(), v.null()),
  customFields: v.any(),
  listIds: v.optional(v.array(v.string())),
  createdAt: v.string(),
  updatedAt: v.string(),
  projectId: v.optional(v.string()),
});

export type Contact = Infer<typeof contactValidator>;

export const unsubscribeGroupValidator = v.object({
  groupId: v.string(),
  name: v.string(),
});

export type UnsubscribeGroup = Infer<typeof unsubscribeGroupValidator>;

// --- Contact args validators ---

export const createContactArgsValidator = v.object({
  email: v.string(),
  firstName: v.optional(v.string()),
  lastName: v.optional(v.string()),
  userId: v.optional(v.string()),
  listIds: v.optional(v.array(v.string())),
  customFields: v.optional(v.any()),
  apiKey: v.optional(v.string()),
  projectId: v.optional(v.string()),
});

export type CreateContactArgs = Infer<typeof createContactArgsValidator>;

export const getContactArgsValidator = v.object({
  contactId: v.string(),
  apiKey: v.optional(v.string()),
  projectId: v.optional(v.string()),
});

export type GetContactArgs = Infer<typeof getContactArgsValidator>;

export const upsertContactArgsValidator = v.object({
  email: v.string(),
  firstName: v.optional(v.string()),
  lastName: v.optional(v.string()),
  userId: v.optional(v.string()),
  listIds: v.optional(v.array(v.string())),
  customFields: v.optional(v.any()),
  apiKey: v.optional(v.string()),
  projectId: v.optional(v.string()),
});

export type UpsertContactArgs = Infer<typeof upsertContactArgsValidator>;

export const deleteContactArgsValidator = v.object({
  contactId: v.string(),
  apiKey: v.optional(v.string()),
  projectId: v.optional(v.string()),
});

export type DeleteContactArgs = Infer<typeof deleteContactArgsValidator>;

export const deleteContactByUserIdArgsValidator = v.object({
  userId: v.string(),
  apiKey: v.optional(v.string()),
  projectId: v.optional(v.string()),
});

export type DeleteContactByUserIdArgs = Infer<typeof deleteContactByUserIdArgsValidator>;

export const removeContactsByEmailsArgsValidator = v.object({
  emails: v.array(v.string()),
  apiKey: v.optional(v.string()),
  projectId: v.optional(v.string()),
});

export type RemoveContactsByEmailsArgs = Infer<typeof removeContactsByEmailsArgsValidator>;

export const searchContactsArgsValidator = v.object({
  emails: v.array(v.string()),
  apiKey: v.optional(v.string()),
  projectId: v.optional(v.string()),
});

export type SearchContactsArgs = Infer<typeof searchContactsArgsValidator>;

export const getUnsubscribeGroupsArgsValidator = v.object({
  contactId: v.string(),
  apiKey: v.optional(v.string()),
  projectId: v.optional(v.string()),
});

export type GetUnsubscribeGroupsArgs = Infer<typeof getUnsubscribeGroupsArgsValidator>;

export const bulkUpdateContactsArgsValidator = v.object({
  contacts: v.array(
    v.object({
      email: v.string(),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      userId: v.optional(v.string()),
      customFields: v.optional(v.any()),
    }),
  ),
  runWorkflow: v.optional(v.boolean()),
  apiKey: v.optional(v.string()),
  projectId: v.optional(v.string()),
});

export type BulkUpdateContactsArgs = Infer<typeof bulkUpdateContactsArgsValidator>;

// --- Contact result validators ---

export const createContactResultValidator = v.object({
  contact: contactValidator,
});

export type CreateContactResult = Infer<typeof createContactResultValidator>;

export const getContactResultValidator = v.object({
  contact: contactValidator,
});

export type GetContactResult = Infer<typeof getContactResultValidator>;

export const upsertContactResultValidator = v.object({
  contact: contactValidator,
});

export type UpsertContactResult = Infer<typeof upsertContactResultValidator>;

export const deleteContactResultValidator = v.object({
  success: v.boolean(),
  message: v.string(),
});

export type DeleteContactResult = Infer<typeof deleteContactResultValidator>;

export const deleteContactByUserIdResultValidator = v.object({
  success: v.boolean(),
  message: v.string(),
});

export type DeleteContactByUserIdResult = Infer<typeof deleteContactByUserIdResultValidator>;

export const removeContactsByEmailsResultValidator = v.object({
  success: v.boolean(),
  message: v.string(),
});

export type RemoveContactsByEmailsResult = Infer<typeof removeContactsByEmailsResultValidator>;

export const searchContactsResultValidator = v.object({
  contacts: v.array(contactValidator),
});

export type SearchContactsResult = Infer<typeof searchContactsResultValidator>;

export const getUnsubscribeGroupsResultValidator = v.object({
  groups: v.array(unsubscribeGroupValidator),
});

export type GetUnsubscribeGroupsResult = Infer<typeof getUnsubscribeGroupsResultValidator>;

export const bulkUpdateContactsResultValidator = v.object({
  successCount: v.number(),
  failedCount: v.number(),
  totalCount: v.number(),
});

export type BulkUpdateContactsResult = Infer<typeof bulkUpdateContactsResultValidator>;
