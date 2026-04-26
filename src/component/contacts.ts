import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import {
  createContact as providerCreateContact,
  getContact as providerGetContact,
  upsertContact as providerUpsertContact,
  deleteContact as providerDeleteContact,
  deleteContactByUserId as providerDeleteContactByUserId,
  removeContactsByEmails as providerRemoveContactsByEmails,
  searchContactsByEmails as providerSearchContactsByEmails,
  getContactUnsubscribeGroups as providerGetContactUnsubscribeGroups,
  bulkUpdateContacts as providerBulkUpdateContacts,
  resolveOptions,
} from "./provider";
import {
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
  bulkUpdateContactsArgsValidator,
  bulkUpdateContactsResultValidator,
  type CreateContactResult,
  type GetContactResult,
  type UpsertContactResult,
  type DeleteContactResult,
  type DeleteContactByUserIdResult,
  type RemoveContactsByEmailsResult,
  type SearchContactsResult,
  type GetUnsubscribeGroupsResult,
  type BulkUpdateContactsResult,
} from "./types";

export const createContact = action({
  args: createContactArgsValidator,
  returns: createContactResultValidator,
  handler: async (ctx, args): Promise<CreateContactResult> => {
    const globals = await ctx.runQuery(internal.config.getGlobalsInternal, {});
    const options = resolveOptions(globals, args);

    const contact = await providerCreateContact(
      {
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
        userId: args.userId,
        listIds: args.listIds,
        customFields: args.customFields,
      },
      options,
    );

    return { contact };
  },
});

export const getContact = action({
  args: getContactArgsValidator,
  returns: getContactResultValidator,
  handler: async (ctx, args): Promise<GetContactResult> => {
    const globals = await ctx.runQuery(internal.config.getGlobalsInternal, {});
    const options = resolveOptions(globals, args);

    const contact = await providerGetContact(args.contactId, options);

    return { contact };
  },
});

export const upsertContact = action({
  args: upsertContactArgsValidator,
  returns: upsertContactResultValidator,
  handler: async (ctx, args): Promise<UpsertContactResult> => {
    const globals = await ctx.runQuery(internal.config.getGlobalsInternal, {});
    const options = resolveOptions(globals, args);

    const contact = await providerUpsertContact(
      {
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
        userId: args.userId,
        listIds: args.listIds,
        customFields: args.customFields,
      },
      options,
    );

    return { contact };
  },
});

export const deleteContact = action({
  args: deleteContactArgsValidator,
  returns: deleteContactResultValidator,
  handler: async (ctx, args): Promise<DeleteContactResult> => {
    const globals = await ctx.runQuery(internal.config.getGlobalsInternal, {});
    const options = resolveOptions(globals, args);

    return await providerDeleteContact(args.contactId, options);
  },
});

export const deleteContactByUserId = action({
  args: deleteContactByUserIdArgsValidator,
  returns: deleteContactByUserIdResultValidator,
  handler: async (ctx, args): Promise<DeleteContactByUserIdResult> => {
    const globals = await ctx.runQuery(internal.config.getGlobalsInternal, {});
    const options = resolveOptions(globals, args);

    return await providerDeleteContactByUserId(args.userId, options);
  },
});

export const removeContactsByEmails = action({
  args: removeContactsByEmailsArgsValidator,
  returns: removeContactsByEmailsResultValidator,
  handler: async (ctx, args): Promise<RemoveContactsByEmailsResult> => {
    const globals = await ctx.runQuery(internal.config.getGlobalsInternal, {});
    const options = resolveOptions(globals, args);

    return await providerRemoveContactsByEmails(args.emails, options);
  },
});

export const searchContactsByEmails = action({
  args: searchContactsArgsValidator,
  returns: searchContactsResultValidator,
  handler: async (ctx, args): Promise<SearchContactsResult> => {
    const globals = await ctx.runQuery(internal.config.getGlobalsInternal, {});
    const options = resolveOptions(globals, args);

    const contacts = await providerSearchContactsByEmails(args.emails, options);

    return { contacts };
  },
});

export const getUnsubscribeGroups = action({
  args: getUnsubscribeGroupsArgsValidator,
  returns: getUnsubscribeGroupsResultValidator,
  handler: async (ctx, args): Promise<GetUnsubscribeGroupsResult> => {
    const globals = await ctx.runQuery(internal.config.getGlobalsInternal, {});
    const options = resolveOptions(globals, args);

    const groups = await providerGetContactUnsubscribeGroups(args.contactId, options);

    return { groups };
  },
});

export const bulkUpdateContacts = action({
  args: bulkUpdateContactsArgsValidator,
  returns: bulkUpdateContactsResultValidator,
  handler: async (ctx, args): Promise<BulkUpdateContactsResult> => {
    const globals = await ctx.runQuery(internal.config.getGlobalsInternal, {});
    const options = resolveOptions(globals, args);

    return await providerBulkUpdateContacts(
      {
        contacts: args.contacts,
        runWorkflow: args.runWorkflow,
      },
      options,
    );
  },
});
