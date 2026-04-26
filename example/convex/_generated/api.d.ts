/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as autosendDemo from "../autosendDemo.js";
import type * as contactLists from "../contactLists.js";
import type * as contacts from "../contacts.js";
import type * as crons from "../crons.js";
import type * as email from "../email.js";
import type * as envSetup from "../envSetup.js";
import type * as http from "../http.js";
import type * as mailtm from "../mailtm.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  autosendDemo: typeof autosendDemo;
  contactLists: typeof contactLists;
  contacts: typeof contacts;
  crons: typeof crons;
  email: typeof email;
  envSetup: typeof envSetup;
  http: typeof http;
  mailtm: typeof mailtm;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  autosend: {
    cleanup: {
      cleanupAbandonedEmails: FunctionReference<
        "action",
        "internal",
        { batchSize?: number; dryRun?: boolean; staleAfterMs?: number },
        {
          emailIds: Array<string>;
          failedCount: number;
          hasMore: boolean;
          recoveredCount: number;
        }
      >;
      cleanupOldDeliveries: FunctionReference<
        "action",
        "internal",
        { batchSize?: number; olderThanMs?: number },
        { deletedCount: number; hasMore: boolean }
      >;
      cleanupOldEmails: FunctionReference<
        "action",
        "internal",
        { batchSize?: number; dryRun?: boolean; olderThanMs?: number },
        { deletedCount: number; emailIds: Array<string>; hasMore: boolean }
      >;
    };
    config: {
      getConfig: FunctionReference<
        "query",
        "internal",
        {},
        {
          autosendBaseUrl: string;
          cleanupAbandonedMs: number;
          cleanupBatchSize: number;
          cleanupDeliveriesMs: number;
          cleanupOldEmailsMs: number;
          defaultFrom?: string;
          defaultReplyTo?: string;
          hasApiKey: boolean;
          hasWebhookSecret: boolean;
          maxAttempts: number;
          projectId?: string;
          providerCompatibilityMode: "strict" | "lenient";
          rateLimitRps: number;
          retryDelaysMs: Array<number>;
          sandboxTo: Array<string>;
          sendBatchSize: number;
          testMode: boolean;
        }
      >;
      setConfig: FunctionReference<
        "mutation",
        "internal",
        {
          config: {
            autosendApiKey?: string;
            autosendBaseUrl?: string;
            cleanupAbandonedMs?: number;
            cleanupBatchSize?: number;
            cleanupDeliveriesMs?: number;
            cleanupOldEmailsMs?: number;
            defaultFrom?: string;
            defaultReplyTo?: string;
            maxAttempts?: number;
            projectId?: string;
            providerCompatibilityMode?: "strict" | "lenient";
            rateLimitRps?: number;
            retryDelaysMs?: Array<number>;
            sandboxTo?: Array<string>;
            sendBatchSize?: number;
            testMode?: boolean;
            webhookSecret?: string;
          };
          replace?: boolean;
        },
        { created: boolean }
      >;
    };
    contactLists: {
      addContactsToList: FunctionReference<
        "action",
        "internal",
        {
          apiKey?: string;
          contactIds?: Array<string>;
          emails?: Array<string>;
          listId: string;
          projectId?: string;
        },
        {
          added: number;
          alreadyInList: number;
          created: number;
          success: boolean;
          totalContactsInList: number;
        }
      >;
      createContactList: FunctionReference<
        "action",
        "internal",
        {
          apiKey?: string;
          description?: string;
          name: string;
          projectId?: string;
        },
        {
          contactList: {
            contactCount?: number;
            createdAt: string;
            description: string | null;
            id: string;
            name: string;
            type: "list" | "segment";
            updatedAt: string;
          };
        }
      >;
      deleteContactList: FunctionReference<
        "action",
        "internal",
        { apiKey?: string; listId: string; projectId?: string },
        { message: string; success: boolean }
      >;
      getContactList: FunctionReference<
        "action",
        "internal",
        { apiKey?: string; listId: string; projectId?: string },
        {
          contactList: {
            contactCount?: number;
            createdAt: string;
            description: string | null;
            id: string;
            name: string;
            type: "list" | "segment";
            updatedAt: string;
          };
        }
      >;
      getContactListContacts: FunctionReference<
        "action",
        "internal",
        {
          apiKey?: string;
          email?: string;
          limit?: number;
          listId: string;
          page?: number;
          projectId?: string;
        },
        {
          contacts: Array<{
            createdAt: string;
            customFields: any;
            email: string;
            firstName: string | null;
            id: string;
            lastName: string | null;
            listIds?: Array<string>;
            projectId?: string;
            updatedAt: string;
            userId: string | null;
          }>;
          pagination: {
            limit: number;
            page: number;
            pages: number;
            total: number;
          };
        }
      >;
      listContactLists: FunctionReference<
        "action",
        "internal",
        { apiKey?: string; projectId?: string; type?: "list" | "segment" },
        {
          contactLists: Array<{
            contactCount?: number;
            createdAt: string;
            description: string | null;
            id: string;
            name: string;
            type: "list" | "segment";
            updatedAt: string;
          }>;
        }
      >;
      removeContactsFromList: FunctionReference<
        "action",
        "internal",
        {
          apiKey?: string;
          contactIds?: Array<string>;
          emails?: Array<string>;
          listId: string;
          projectId?: string;
        },
        { notInList: number; removed: number; success: boolean }
      >;
    };
    contacts: {
      bulkUpdateContacts: FunctionReference<
        "action",
        "internal",
        {
          apiKey?: string;
          contacts: Array<{
            customFields?: any;
            email: string;
            firstName?: string;
            lastName?: string;
            userId?: string;
          }>;
          projectId?: string;
          runWorkflow?: boolean;
        },
        { failedCount: number; successCount: number; totalCount: number }
      >;
      createContact: FunctionReference<
        "action",
        "internal",
        {
          apiKey?: string;
          customFields?: any;
          email: string;
          firstName?: string;
          lastName?: string;
          listIds?: Array<string>;
          projectId?: string;
          userId?: string;
        },
        {
          contact: {
            createdAt: string;
            customFields: any;
            email: string;
            firstName: string | null;
            id: string;
            lastName: string | null;
            listIds?: Array<string>;
            projectId?: string;
            updatedAt: string;
            userId: string | null;
          };
        }
      >;
      deleteContact: FunctionReference<
        "action",
        "internal",
        { apiKey?: string; contactId: string; projectId?: string },
        { message: string; success: boolean }
      >;
      deleteContactByUserId: FunctionReference<
        "action",
        "internal",
        { apiKey?: string; projectId?: string; userId: string },
        { message: string; success: boolean }
      >;
      getContact: FunctionReference<
        "action",
        "internal",
        { apiKey?: string; contactId: string; projectId?: string },
        {
          contact: {
            createdAt: string;
            customFields: any;
            email: string;
            firstName: string | null;
            id: string;
            lastName: string | null;
            listIds?: Array<string>;
            projectId?: string;
            updatedAt: string;
            userId: string | null;
          };
        }
      >;
      getUnsubscribeGroups: FunctionReference<
        "action",
        "internal",
        { apiKey?: string; contactId: string; projectId?: string },
        { groups: Array<{ groupId: string; name: string }> }
      >;
      removeContactsByEmails: FunctionReference<
        "action",
        "internal",
        { apiKey?: string; emails: Array<string>; projectId?: string },
        { message: string; success: boolean }
      >;
      searchContactsByEmails: FunctionReference<
        "action",
        "internal",
        { apiKey?: string; emails: Array<string>; projectId?: string },
        {
          contacts: Array<{
            createdAt: string;
            customFields: any;
            email: string;
            firstName: string | null;
            id: string;
            lastName: string | null;
            listIds?: Array<string>;
            projectId?: string;
            updatedAt: string;
            userId: string | null;
          }>;
        }
      >;
      upsertContact: FunctionReference<
        "action",
        "internal",
        {
          apiKey?: string;
          customFields?: any;
          email: string;
          firstName?: string;
          lastName?: string;
          listIds?: Array<string>;
          projectId?: string;
          userId?: string;
        },
        {
          contact: {
            createdAt: string;
            customFields: any;
            email: string;
            firstName: string | null;
            id: string;
            lastName: string | null;
            listIds?: Array<string>;
            projectId?: string;
            updatedAt: string;
            userId: string | null;
          };
        }
      >;
    };
    emails: {
      cancelEmail: FunctionReference<
        "mutation",
        "internal",
        { emailId: string },
        { canceled: boolean }
      >;
      sendBulk: FunctionReference<
        "mutation",
        "internal",
        {
          attachments?: Array<{
            content?: string;
            contentType?: string;
            description?: string;
            disposition?: string;
            fileUrl?: string;
            filename: string;
          }>;
          bcc?: Array<{ email: string; name?: string }>;
          cc?: Array<{ email: string; name?: string }>;
          dynamicData?: any;
          from?: string;
          fromName?: string;
          html?: string;
          idempotencyKeyPrefix?: string;
          metadata?: any;
          recipientData?: any;
          recipients: Array<string>;
          replyTo?: string;
          replyToName?: string;
          subject?: string;
          templateId?: string;
          text?: string;
          unsubscribeGroupId?: string;
        },
        { acceptedCount: number; emailIds: Array<string> }
      >;
      sendEmail: FunctionReference<
        "mutation",
        "internal",
        {
          attachments?: Array<{
            content?: string;
            contentType?: string;
            description?: string;
            disposition?: string;
            fileUrl?: string;
            filename: string;
          }>;
          bcc?: Array<{ email: string; name?: string }>;
          cc?: Array<{ email: string; name?: string }>;
          dynamicData?: any;
          from?: string;
          fromName?: string;
          html?: string;
          idempotencyKey?: string;
          metadata?: any;
          replyTo?: string;
          replyToName?: string;
          subject?: string;
          templateId?: string;
          text?: string;
          to: Array<string>;
          toName?: string;
          unsubscribeGroupId?: string;
        },
        { deduped: boolean; emailId: string }
      >;
    };
    projects: {
      createProject: FunctionReference<
        "action",
        "internal",
        { apiKey?: string; domain?: string; name: string; regionKey?: string },
        {
          project: {
            address: any;
            domain: string | null;
            domains: Array<{
              domain: string;
              id: string;
              verificationStatus: string;
            }>;
            id: string;
            industry: string | null;
            logo: string | null;
            name: string;
            regionKey: string | null;
            trackingClick: boolean;
            trackingOpen: boolean;
          };
        }
      >;
      deleteProject: FunctionReference<
        "action",
        "internal",
        { apiKey?: string; projectId: string },
        { message: string; success: boolean }
      >;
      listProjects: FunctionReference<
        "action",
        "internal",
        { apiKey?: string },
        {
          projects: Array<{
            address: any;
            domain: string | null;
            domains: Array<{
              domain: string;
              id: string;
              verificationStatus: string;
            }>;
            id: string;
            industry: string | null;
            logo: string | null;
            name: string;
            regionKey: string | null;
            trackingClick: boolean;
            trackingOpen: boolean;
          }>;
        }
      >;
    };
    queries: {
      listEvents: FunctionReference<
        "query",
        "internal",
        { emailId: string; limit?: number },
        Array<{
          emailId: string;
          eventType: string;
          occurredAt: number;
          payload: any;
          providerMessageId?: string;
          receivedAt: number;
        }>
      >;
      status: FunctionReference<
        "query",
        "internal",
        { emailId: string },
        {
          _creationTime: number;
          _id: string;
          attachments?: Array<{
            content?: string;
            contentType?: string;
            description?: string;
            disposition?: string;
            fileUrl?: string;
            filename: string;
          }>;
          attemptCount: number;
          bcc?: Array<{ email: string; name?: string }>;
          canceledAt?: number;
          cc?: Array<{ email: string; name?: string }>;
          dynamicData?: any;
          emailId: string;
          failedAt?: number;
          from: string;
          fromName?: string;
          html?: string;
          idempotencyKey: string;
          lastAttemptAt?: number;
          lastError?: string;
          maxAttempts: number;
          metadata?: any;
          nextAttemptAt: number;
          providerMessageId?: string;
          providerStatus?: string;
          queuedAt: number;
          replyTo?: string;
          replyToName?: string;
          sentAt?: number;
          status:
            | "queued"
            | "retrying"
            | "sending"
            | "sent"
            | "failed"
            | "canceled";
          subject?: string;
          templateId?: string;
          text?: string;
          to: Array<string>;
          toName?: string;
          unsubscribeGroupId?: string;
          updatedAt: number;
        } | null
      >;
      statusBatch: FunctionReference<
        "query",
        "internal",
        { emailIds: Array<string> },
        Array<{
          _creationTime: number;
          _id: string;
          attachments?: Array<{
            content?: string;
            contentType?: string;
            description?: string;
            disposition?: string;
            fileUrl?: string;
            filename: string;
          }>;
          attemptCount: number;
          bcc?: Array<{ email: string; name?: string }>;
          canceledAt?: number;
          cc?: Array<{ email: string; name?: string }>;
          dynamicData?: any;
          emailId: string;
          failedAt?: number;
          from: string;
          fromName?: string;
          html?: string;
          idempotencyKey: string;
          lastAttemptAt?: number;
          lastError?: string;
          maxAttempts: number;
          metadata?: any;
          nextAttemptAt: number;
          providerMessageId?: string;
          providerStatus?: string;
          queuedAt: number;
          replyTo?: string;
          replyToName?: string;
          sentAt?: number;
          status:
            | "queued"
            | "retrying"
            | "sending"
            | "sent"
            | "failed"
            | "canceled";
          subject?: string;
          templateId?: string;
          text?: string;
          to: Array<string>;
          toName?: string;
          unsubscribeGroupId?: string;
          updatedAt: number;
        } | null>
      >;
    };
    queue: {
      processQueue: FunctionReference<
        "action",
        "internal",
        { batchSize?: number },
        {
          failedCount: number;
          hasMoreDue: boolean;
          processedCount: number;
          retriedCount: number;
          sentCount: number;
        }
      >;
    };
    webhooks: {
      handleCallback: FunctionReference<
        "action",
        "internal",
        {
          deliveryId: string;
          event: string;
          rawBody: string;
          signature: string;
          timestamp: string;
          webhookSecret?: string;
        },
        {
          duplicate?: boolean;
          emailId?: string;
          error?: string;
          eventType: string;
          ok: boolean;
        }
      >;
    };
  };
};
