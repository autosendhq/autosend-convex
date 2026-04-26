import { action } from "./_generated/server";
import { v } from "convex/values";
import { autosend } from "./email";

export const listContactLists = action({
  args: {
    type: v.optional(v.union(v.literal("list"), v.literal("segment"))),
  },
  handler: async (ctx, args) => {
    return await autosend.lists.list(ctx, args);
  },
});

export const getContactList = action({
  args: {
    listId: v.string(),
  },
  handler: async (ctx, args) => {
    return await autosend.lists.get(ctx, args);
  },
});

export const createContactList = action({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await autosend.lists.create(ctx, args);
  },
});

export const deleteContactList = action({
  args: {
    listId: v.string(),
  },
  handler: async (ctx, args) => {
    return await autosend.lists.delete(ctx, args);
  },
});

export const getContactListContacts = action({
  args: {
    listId: v.string(),
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await autosend.lists.getContacts(ctx, args);
  },
});

export const addContactsToList = action({
  args: {
    listId: v.string(),
    contactIds: v.optional(v.array(v.string())),
    emails: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    return await autosend.lists.addContacts(ctx, args);
  },
});

export const removeContactsFromList = action({
  args: {
    listId: v.string(),
    contactIds: v.optional(v.array(v.string())),
    emails: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    return await autosend.lists.removeContacts(ctx, args);
  },
});
