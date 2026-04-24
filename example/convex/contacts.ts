import { action } from "./_generated/server";
import { v } from "convex/values";
import { autosend } from "./email";

export const createContact = action({
  args: {
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    userId: v.optional(v.string()),
    listIds: v.optional(v.array(v.string())),
    customFields: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await autosend.contacts.create(ctx, args);
  },
});

export const getContact = action({
  args: {
    contactId: v.string(),
  },
  handler: async (ctx, args) => {
    return await autosend.contacts.get(ctx, args);
  },
});

export const upsertContact = action({
  args: {
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    userId: v.optional(v.string()),
    listIds: v.optional(v.array(v.string())),
    customFields: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await autosend.contacts.upsert(ctx, args);
  },
});

export const deleteContact = action({
  args: {
    contactId: v.string(),
  },
  handler: async (ctx, args) => {
    return await autosend.contacts.delete(ctx, args);
  },
});

export const deleteContactByUserId = action({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    return await autosend.contacts.deleteByUserId(ctx, args);
  },
});

export const removeContactsByEmails = action({
  args: {
    emails: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    return await autosend.contacts.removeByEmails(ctx, args);
  },
});

export const searchContacts = action({
  args: {
    emails: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    return await autosend.contacts.search(ctx, args);
  },
});

export const bulkUpdateContacts = action({
  args: {
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
  },
  handler: async (ctx, args) => {
    return await autosend.contacts.bulkUpdate(ctx, args);
  },
});

export const getUnsubscribeGroups = action({
  args: {
    contactId: v.string(),
  },
  handler: async (ctx, args) => {
    return await autosend.contacts.getUnsubscribeGroups(ctx, args);
  },
});
