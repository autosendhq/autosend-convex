import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import {
  listContactLists as providerListContactLists,
  getContactList as providerGetContactList,
  createContactList as providerCreateContactList,
  deleteContactList as providerDeleteContactList,
  getContactListContacts as providerGetContactListContacts,
  bulkAddContactsToList as providerBulkAddContactsToList,
  removeContactsFromList as providerRemoveContactsFromList,
  resolveOptions,
} from "./provider";
import {
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
  type ListContactListsResult,
  type GetContactListResult,
  type CreateContactListResult,
  type DeleteContactListResult,
  type GetContactListContactsResult,
  type AddContactsToListResult,
  type RemoveContactsFromListResult,
} from "./types";

export const listContactLists = action({
  args: listContactListsArgsValidator,
  returns: listContactListsResultValidator,
  handler: async (ctx, args): Promise<ListContactListsResult> => {
    const globals = await ctx.runQuery(internal.config.getGlobalsInternal, {});
    const options = resolveOptions(globals, args);

    const contactLists = await providerListContactLists(
      { type: args.type },
      options,
    );

    return { contactLists };
  },
});

export const getContactList = action({
  args: getContactListArgsValidator,
  returns: getContactListResultValidator,
  handler: async (ctx, args): Promise<GetContactListResult> => {
    const globals = await ctx.runQuery(internal.config.getGlobalsInternal, {});
    const options = resolveOptions(globals, args);

    const contactList = await providerGetContactList(args.listId, options);

    return { contactList };
  },
});

export const createContactList = action({
  args: createContactListArgsValidator,
  returns: createContactListResultValidator,
  handler: async (ctx, args): Promise<CreateContactListResult> => {
    const globals = await ctx.runQuery(internal.config.getGlobalsInternal, {});
    const options = resolveOptions(globals, args);

    const contactList = await providerCreateContactList(
      {
        name: args.name,
        description: args.description,
      },
      options,
    );

    return { contactList };
  },
});

export const deleteContactList = action({
  args: deleteContactListArgsValidator,
  returns: deleteContactListResultValidator,
  handler: async (ctx, args): Promise<DeleteContactListResult> => {
    const globals = await ctx.runQuery(internal.config.getGlobalsInternal, {});
    const options = resolveOptions(globals, args);

    return await providerDeleteContactList(args.listId, options);
  },
});

export const getContactListContacts = action({
  args: getContactListContactsArgsValidator,
  returns: getContactListContactsResultValidator,
  handler: async (ctx, args): Promise<GetContactListContactsResult> => {
    const globals = await ctx.runQuery(internal.config.getGlobalsInternal, {});
    const options = resolveOptions(globals, args);

    return await providerGetContactListContacts(
      args.listId,
      { page: args.page, limit: args.limit, email: args.email },
      options,
    );
  },
});

export const addContactsToList = action({
  args: addContactsToListArgsValidator,
  returns: addContactsToListResultValidator,
  handler: async (ctx, args): Promise<AddContactsToListResult> => {
    const globals = await ctx.runQuery(internal.config.getGlobalsInternal, {});
    const options = resolveOptions(globals, args);

    return await providerBulkAddContactsToList(
      args.listId,
      { contactIds: args.contactIds, emails: args.emails },
      options,
    );
  },
});

export const removeContactsFromList = action({
  args: removeContactsFromListArgsValidator,
  returns: removeContactsFromListResultValidator,
  handler: async (ctx, args): Promise<RemoveContactsFromListResult> => {
    const globals = await ctx.runQuery(internal.config.getGlobalsInternal, {});
    const options = resolveOptions(globals, args);

    return await providerRemoveContactsFromList(
      args.listId,
      { contactIds: args.contactIds, emails: args.emails },
      options,
    );
  },
});
