import { httpActionGeneric } from "convex/server";
import type {
  GenericActionCtx,
  GenericDataModel,
  GenericMutationCtx,
  GenericQueryCtx,
  HttpRouter,
} from "convex/server";
import type { ComponentApi } from "../component/_generated/component.js";

export type { ComponentApi } from "../component/_generated/component.js";
export type {
  AddContactsToListResult,
  Attachment,
  BulkAddError,
  BulkUpdateContactsResult,
  ConfigUpdate,
  Contact,
  ContactList,
  ContactListType,
  Pagination,
  CreateContactArgs,
  CreateContactListResult,
  CreateContactResult,
  CreateProjectArgs,
  CreateProjectResult,
  DeleteContactByUserIdResult,
  DeleteContactListResult,
  DeleteContactResult,
  DeleteProjectResult,
  DeliveryCleanupResult,
  EmailRecipient,
  EmailStatus,
  GetContactListContactsResult,
  GetContactListResult,
  GetContactResult,
  GetUnsubscribeGroupsResult,
  ListContactListsResult,
  ListProjectsResult,
  Project,
  ProjectDomain,
  ProviderCompatibilityMode,
  RemoveContactsByEmailsResult,
  RemoveContactsFromListResult,
  SafeConfig,
  SearchContactsResult,
  SendBulkArgs,
  SendEmailArgs,
  UnsubscribeGroup,
  UpsertContactResult,
} from "../component/types.js";
export {
  abandonedCleanupResultValidator,
  addContactsToListArgsValidator,
  addContactsToListResultValidator,
  attachmentValidator,
  bulkAddErrorValidator,
  bulkUpdateContactsArgsValidator,
  bulkUpdateContactsResultValidator,
  cancelResultValidator,
  cleanupResultValidator,
  configUpdateValidator,
  contactListTypeValidator,
  contactListValidator,
  contactValidator,
  paginationValidator,
  createContactArgsValidator,
  createContactListArgsValidator,
  createContactListResultValidator,
  createContactResultValidator,
  createProjectArgsValidator,
  createProjectResultValidator,
  deleteContactArgsValidator,
  deleteContactByUserIdArgsValidator,
  deleteContactByUserIdResultValidator,
  deleteContactListArgsValidator,
  deleteContactListResultValidator,
  deleteContactResultValidator,
  deleteProjectResultValidator,
  deliveryCleanupResultValidator,
  emailRecipientValidator,
  emailStatusValidator,
  getContactArgsValidator,
  getContactListArgsValidator,
  getContactListContactsArgsValidator,
  getContactListContactsResultValidator,
  getContactListResultValidator,
  getContactResultValidator,
  getUnsubscribeGroupsArgsValidator,
  getUnsubscribeGroupsResultValidator,
  listContactListsArgsValidator,
  listContactListsResultValidator,
  listProjectsResultValidator,
  processQueueResultValidator,
  projectDomainValidator,
  projectValidator,
  providerCompatibilityModeValidator,
  removeContactsByEmailsArgsValidator,
  removeContactsByEmailsResultValidator,
  removeContactsFromListArgsValidator,
  removeContactsFromListResultValidator,
  safeConfigValidator,
  searchContactsArgsValidator,
  searchContactsResultValidator,
  sendBulkArgsValidator,
  sendBulkResultValidator,
  sendEmailArgsValidator,
  sendResultValidator,
  unsubscribeGroupValidator,
  upsertContactArgsValidator,
  upsertContactResultValidator,
  webhookHandleResultValidator,
} from "../component/types.js";

type QueryCtx = Pick<GenericQueryCtx<GenericDataModel>, "runQuery">;
type MutationCtx = Pick<
  GenericMutationCtx<GenericDataModel>,
  "runQuery" | "runMutation"
>;
type ActionCtx = Pick<
  GenericActionCtx<GenericDataModel>,
  "runQuery" | "runMutation" | "runAction"
>;

export class AutoSend {
  public component: ComponentApi;

  constructor(component: ComponentApi) {
    this.component = component;
  }

  async sendEmail(
    ctx: MutationCtx,
    args: {
      to: string[];
      toName?: string;
      from?: string;
      fromName?: string;
      replyTo?: string;
      replyToName?: string;
      cc?: Array<{ email: string; name?: string }>;
      bcc?: Array<{ email: string; name?: string }>;
      subject?: string;
      html?: string;
      text?: string;
      templateId?: string;
      dynamicData?: unknown;
      attachments?: Array<{
        filename: string;
        content?: string;
        fileUrl?: string;
        contentType?: string;
        disposition?: string;
        description?: string;
      }>;
      metadata?: unknown;
      idempotencyKey?: string;
      unsubscribeGroupId?: string;
    },
  ) {
    return await ctx.runMutation(this.component.emails.sendEmail, args);
  }

  async sendBulk(
    ctx: MutationCtx,
    args: {
      recipients: string[];
      recipientData?: Record<string, Record<string, unknown>>;
      from?: string;
      fromName?: string;
      replyTo?: string;
      replyToName?: string;
      cc?: Array<{ email: string; name?: string }>;
      bcc?: Array<{ email: string; name?: string }>;
      subject?: string;
      html?: string;
      text?: string;
      templateId?: string;
      dynamicData?: unknown;
      attachments?: Array<{
        filename: string;
        content?: string;
        fileUrl?: string;
        contentType?: string;
        disposition?: string;
        description?: string;
      }>;
      metadata?: unknown;
      idempotencyKeyPrefix?: string;
      unsubscribeGroupId?: string;
    },
  ) {
    return await ctx.runMutation(this.component.emails.sendBulk, args);
  }

  async status(ctx: QueryCtx, args: { emailId: string }) {
    return await ctx.runQuery(this.component.queries.status, args);
  }

  async statusBatch(ctx: QueryCtx, args: { emailIds: string[] }) {
    return await ctx.runQuery(this.component.queries.statusBatch, args);
  }

  async listEvents(
    ctx: QueryCtx,
    args: { emailId: string; limit?: number },
  ) {
    return await ctx.runQuery(this.component.queries.listEvents, args);
  }

  async cancelEmail(ctx: MutationCtx, args: { emailId: string }) {
    return await ctx.runMutation(this.component.emails.cancelEmail, args);
  }

  async setConfig(
    ctx: MutationCtx,
    args: {
      config: {
        autosendApiKey?: string;
        webhookSecret?: string;
        testMode?: boolean;
        defaultFrom?: string;
        defaultReplyTo?: string;
        sandboxTo?: string[];
        rateLimitRps?: number;
        retryDelaysMs?: number[];
        maxAttempts?: number;
        sendBatchSize?: number;
        cleanupBatchSize?: number;
        cleanupOldEmailsMs?: number;
        cleanupAbandonedMs?: number;
        cleanupDeliveriesMs?: number;
        providerCompatibilityMode?: "strict" | "lenient";
        autosendBaseUrl?: string;
        projectId?: string;
      };
      replace?: boolean;
    },
  ) {
    return await ctx.runMutation(this.component.config.setConfig, args);
  }

  async getConfig(ctx: QueryCtx) {
    return await ctx.runQuery(this.component.config.getConfig, {});
  }

  async processQueue(
    ctx: ActionCtx,
    args: {
      batchSize?: number;
    } = {},
  ) {
    return await ctx.runAction(this.component.queue.processQueue, args);
  }

  async cleanupOldEmails(
    ctx: ActionCtx,
    args: {
      olderThanMs?: number;
      batchSize?: number;
      dryRun?: boolean;
    } = {},
  ) {
    return await ctx.runAction(this.component.cleanup.cleanupOldEmails, args);
  }

  async cleanupAbandonedEmails(
    ctx: ActionCtx,
    args: {
      staleAfterMs?: number;
      batchSize?: number;
      dryRun?: boolean;
    } = {},
  ) {
    return await ctx.runAction(this.component.cleanup.cleanupAbandonedEmails, args);
  }

  async cleanupOldDeliveries(
    ctx: ActionCtx,
    args: {
      olderThanMs?: number;
      batchSize?: number;
    } = {},
  ) {
    return await ctx.runAction(this.component.cleanup.cleanupOldDeliveries, args);
  }

  async listProjects(
    ctx: ActionCtx,
    args: {
      apiKey?: string;
    } = {},
  ) {
    return await ctx.runAction(this.component.projects.listProjects, args);
  }

  async createProject(
    ctx: ActionCtx,
    args: {
      name: string;
      domain?: string;
      regionKey?: string;
      apiKey?: string;
    },
  ) {
    return await ctx.runAction(this.component.projects.createProject, args);
  }

  async deleteProject(
    ctx: ActionCtx,
    args: {
      projectId: string;
      apiKey?: string;
    },
  ) {
    return await ctx.runAction(this.component.projects.deleteProject, args);
  }

  get contacts() {
    const component = this.component;
    return {
      async create(
        ctx: ActionCtx,
        args: {
          email: string;
          firstName?: string;
          lastName?: string;
          userId?: string;
          listIds?: string[];
          customFields?: unknown;
          apiKey?: string;
          projectId?: string;
        },
      ) {
        return await ctx.runAction(component.contacts.createContact, args);
      },

      async get(
        ctx: ActionCtx,
        args: {
          contactId: string;
          apiKey?: string;
          projectId?: string;
        },
      ) {
        return await ctx.runAction(component.contacts.getContact, args);
      },

      async upsert(
        ctx: ActionCtx,
        args: {
          email: string;
          firstName?: string;
          lastName?: string;
          userId?: string;
          listIds?: string[];
          customFields?: unknown;
          apiKey?: string;
          projectId?: string;
        },
      ) {
        return await ctx.runAction(component.contacts.upsertContact, args);
      },

      async delete(
        ctx: ActionCtx,
        args: {
          contactId: string;
          apiKey?: string;
          projectId?: string;
        },
      ) {
        return await ctx.runAction(component.contacts.deleteContact, args);
      },

      async deleteByUserId(
        ctx: ActionCtx,
        args: {
          userId: string;
          apiKey?: string;
          projectId?: string;
        },
      ) {
        return await ctx.runAction(
          component.contacts.deleteContactByUserId,
          args,
        );
      },

      async removeByEmails(
        ctx: ActionCtx,
        args: {
          emails: string[];
          apiKey?: string;
          projectId?: string;
        },
      ) {
        return await ctx.runAction(
          component.contacts.removeContactsByEmails,
          args,
        );
      },

      async search(
        ctx: ActionCtx,
        args: {
          emails: string[];
          apiKey?: string;
          projectId?: string;
        },
      ) {
        return await ctx.runAction(
          component.contacts.searchContactsByEmails,
          args,
        );
      },

      async getUnsubscribeGroups(
        ctx: ActionCtx,
        args: {
          contactId: string;
          apiKey?: string;
          projectId?: string;
        },
      ) {
        return await ctx.runAction(
          component.contacts.getUnsubscribeGroups,
          args,
        );
      },

      async bulkUpdate(
        ctx: ActionCtx,
        args: {
          contacts: Array<{
            email: string;
            firstName?: string;
            lastName?: string;
            userId?: string;
            customFields?: unknown;
          }>;
          runWorkflow?: boolean;
          apiKey?: string;
          projectId?: string;
        },
      ) {
        return await ctx.runAction(
          component.contacts.bulkUpdateContacts,
          args,
        );
      },
    };
  }

  get lists() {
    const component = this.component;
    return {
      async list(
        ctx: ActionCtx,
        args: {
          type?: "list" | "segment";
          apiKey?: string;
          projectId?: string;
        } = {},
      ) {
        return await ctx.runAction(component.contactLists.listContactLists, args);
      },

      async get(
        ctx: ActionCtx,
        args: {
          listId: string;
          apiKey?: string;
          projectId?: string;
        },
      ) {
        return await ctx.runAction(component.contactLists.getContactList, args);
      },

      async create(
        ctx: ActionCtx,
        args: {
          name: string;
          description?: string;
          apiKey?: string;
          projectId?: string;
        },
      ) {
        return await ctx.runAction(component.contactLists.createContactList, args);
      },

      async delete(
        ctx: ActionCtx,
        args: {
          listId: string;
          apiKey?: string;
          projectId?: string;
        },
      ) {
        return await ctx.runAction(component.contactLists.deleteContactList, args);
      },

      async getContacts(
        ctx: ActionCtx,
        args: {
          listId: string;
          page?: number;
          limit?: number;
          email?: string;
          apiKey?: string;
          projectId?: string;
        },
      ) {
        return await ctx.runAction(component.contactLists.getContactListContacts, args);
      },

      async addContacts(
        ctx: ActionCtx,
        args: {
          listId: string;
          contactIds?: string[];
          emails?: string[];
          apiKey?: string;
          projectId?: string;
        },
      ) {
        return await ctx.runAction(component.contactLists.addContactsToList, args);
      },

      async removeContacts(
        ctx: ActionCtx,
        args: {
          listId: string;
          contactIds?: string[];
          emails?: string[];
          apiKey?: string;
          projectId?: string;
        },
      ) {
        return await ctx.runAction(component.contactLists.removeContactsFromList, args);
      },
    };
  }

  async handleCallback(
    ctx: ActionCtx,
    args: {
      rawBody: string;
      signature: string;
      event: string;
      deliveryId: string;
      timestamp: string;
      webhookSecret?: string;
    },
  ) {
    return await ctx.runAction(this.component.webhooks.handleCallback, args);
  }
}

export function registerRoutes(
  http: HttpRouter,
  component: ComponentApi,
  options: {
    path?: string;
    webhookSecret?: string;
  } = {},
) {
  const path = options.path ?? "/webhooks/autosend";

  http.route({
    path,
    method: "POST",
    handler: httpActionGeneric(async (ctx, request) => {
      const signature = request.headers.get("x-webhook-signature");
      const event = request.headers.get("x-webhook-event");
      const deliveryId = request.headers.get("x-webhook-delivery-id");
      const timestamp = request.headers.get("x-webhook-timestamp");

      if (!signature || !event || !deliveryId || !timestamp) {
        return new Response("Missing webhook headers", { status: 400 });
      }

      const rawBody = await request.text();

      const result = await ctx.runAction(component.webhooks.handleCallback, {
        rawBody,
        signature,
        event,
        deliveryId,
        timestamp,
        webhookSecret: options.webhookSecret,
      });

      if (!result.ok) {
        return new Response(JSON.stringify({ error: result.error }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response("ok", { status: 200 });
    }),
  });
}
