"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { Send, Inbox, Settings2, Activity, Mail, Users, LayoutList } from "lucide-react";

import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

import type { AttachmentItem, QueueResult } from "./autosend-console/shared";
import { SendView } from "./autosend-console/send-view";
import { InboxView, useMailTmLiveSync } from "./autosend-console/inbox-view";
import { OpsView } from "./autosend-console/ops-view";
import { SetupView } from "./autosend-console/setup-view";
import { ContactsView } from "./autosend-console/contacts-view";
import { ListsView } from "./autosend-console/lists-view";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract a clean, user-friendly message from Convex errors.
 * Convex errors look like:
 *   "[CONVEX A(module:fn)] [Request ID: ...] Server Error Uncaught Error: Actual message at ..."
 * We strip all the boilerplate and return just the meaningful part.
 */
function friendlyError(err: unknown, fallback: string): string {
  if (!(err instanceof Error)) return fallback;
  let msg = err.message;

  // Strip Convex wrapper noise
  msg = msg
    .replace(/\[CONVEX [^\]]*\]\s*/g, "")
    .replace(/\[Request ID: [^\]]*\]\s*/g, "")
    .replace(/Server Error\s*/g, "");

  // Strip all "Uncaught Error:" prefixes (Convex can nest them)
  while (msg.startsWith("Uncaught Error:")) {
    msg = msg.slice("Uncaught Error:".length).trim();
  }

  // Take first line only (before stack traces)
  msg = msg.split("\n")[0]!.trim();
  msg = msg.replace(/\s+at\s+(async\s+)?[\w.]+\s*\(.*$/, "").trim();

  return msg || fallback;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type View = "send" | "inbox" | "contacts" | "lists" | "ops" | "setup";

const DEMO_DEFAULT_FROM = "ray@con.taskos.dev";
const DEMO_DEFAULT_REPLY_TO = "ray@con.taskos.dev";

// ---------------------------------------------------------------------------
// Main console
// ---------------------------------------------------------------------------

export default function AutoSendConsole() {
  const [view, setView] = useState<View>("send");

  // Data
  const config = useQuery(api.autosendDemo.getConfig, {});
  const demoEmails = useQuery(api.autosendDemo.listDemoEmails, { limit: 50 });
  const inboxes = useQuery(api.mailtm.listInboxes, {});
  const [selectedInboxId, setSelectedInboxId] = useState<Id<"mailtmInboxes"> | null>(null);
  const messages = useQuery(
    api.mailtm.listMessages,
    selectedInboxId ? { inboxId: selectedInboxId, limit: 100 } : "skip",
  );
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  // Mutations / Actions
  const syncSecretsFromEnv = useAction(api.envSetup.syncSecretsFromEnv);
  const setConfig = useMutation(api.autosendDemo.setConfig);
  const sendEmail = useMutation(api.autosendDemo.sendEmail);
  const sendBulk = useMutation(api.autosendDemo.sendBulk);
  const cancelEmail = useMutation(api.autosendDemo.cancelEmail);
  const processQueue = useAction(api.autosendDemo.processQueue);
  const cleanupOldEmails = useAction(api.autosendDemo.cleanupOldEmails);
  const cleanupAbandonedEmails = useAction(api.autosendDemo.cleanupAbandonedEmails);
  const executeCleanupOld = useAction(api.autosendDemo.executeCleanupOld);
  const executeCleanupAbandoned = useAction(api.autosendDemo.executeCleanupAbandoned);
  const cleanupOldDeliveries = useAction(api.autosendDemo.cleanupOldDeliveries);
  const createInbox = useAction(api.mailtm.createInbox);
  const syncInbox = useAction(api.mailtm.syncInbox);
  const syncAllInboxes = useAction(api.mailtm.syncAllInboxes);
  const fetchMessage = useAction(api.mailtm.fetchMessage);
  const deleteInbox = useMutation(api.mailtm.deleteInbox);
  const createContactAction = useAction(api.contacts.createContact);
  const getContactAction = useAction(api.contacts.getContact);
  const upsertContactAction = useAction(api.contacts.upsertContact);
  const deleteContactAction = useAction(api.contacts.deleteContact);
  const deleteContactByUserIdAction = useAction(api.contacts.deleteContactByUserId);
  const removeContactsByEmailsAction = useAction(api.contacts.removeContactsByEmails);
  const searchContactsAction = useAction(api.contacts.searchContacts);
  const bulkUpdateContactsAction = useAction(api.contacts.bulkUpdateContacts);
  const getUnsubscribeGroupsAction = useAction(api.contacts.getUnsubscribeGroups);
  const listContactListsAction = useAction(api.contactLists.listContactLists);
  const getContactListAction = useAction(api.contactLists.getContactList);
  const createContactListAction = useAction(api.contactLists.createContactList);
  const deleteContactListAction = useAction(api.contactLists.deleteContactList);
  const getContactListContactsAction = useAction(api.contactLists.getContactListContacts);
  const addContactsToListAction = useAction(api.contactLists.addContactsToList);
  const removeContactsFromListAction = useAction(api.contactLists.removeContactsFromList);

  // Form state — setup
  const [sandboxTo, setSandboxTo] = useState("");
  const [testMode, setTestMode] = useState(false);
  const [providerCompatibilityMode, setProviderCompatibilityMode] = useState<
    "strict" | "lenient"
  >("strict");
  const [fromConfigHydrated, setFromConfigHydrated] = useState(false);

  // Form state — send
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("Welcome to AutoSend");
  const [html, setHtml] = useState(
    "<h2>Welcome</h2><p>Your account setup is complete.</p>",
  );
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [bulkRecipients, setBulkRecipients] = useState("");
  const [idempotencyPrefix, setIdempotencyPrefix] = useState("");
  const [recipientDataField, setRecipientDataField] = useState("");
  const [sendMode, setSendMode] = useState<"single" | "bulk">("single");
  const [composeMode, setComposeMode] = useState<"content" | "template">("content");
  const [templateId, setTemplateId] = useState("");
  const [dynamicData, setDynamicData] = useState("");
  const [fromOverride, setFromOverride] = useState("");
  const [replyToOverride, setReplyToOverride] = useState("");
  const [toName, setToName] = useState("");
  const [fromName, setFromName] = useState("");
  const [replyToName, setReplyToName] = useState("");
  const [ccField, setCcField] = useState("");
  const [bccField, setBccField] = useState("");
  const [unsubscribeGroupId, setUnsubscribeGroupId] = useState("");
  const [emailMetadata, setEmailMetadata] = useState("");
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);

  // Form state — inbox
  const [inboxLabel, setInboxLabel] = useState("QA Inbox");

  // Ops
  const [queueResult, setQueueResult] = useState<QueueResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const [cleanupRunning, setCleanupRunning] = useState(false);
  const [dryRunOldResult, setDryRunOldResult] = useState<any>(null);
  const [dryRunAbandonedResult, setDryRunAbandonedResult] = useState<any>(null);
  const [cleanupOldResult, setCleanupOldResult] = useState<any>(null);
  const [cleanupAbandonedResult, setCleanupAbandonedResult] = useState<any>(null);
  const [cleanupDeliveryResult, setCleanupDeliveryResult] = useState<any>(null);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [listsLoading, setListsLoading] = useState(false);

  // Confirm dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    description: string;
    actionLabel: string;
    onConfirm: () => void;
  } | null>(null);

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!config || fromConfigHydrated) return;
    setSandboxTo(config.sandboxTo.join(", "));
    setTestMode(config.testMode);
    setProviderCompatibilityMode(config.providerCompatibilityMode);
    setFromConfigHydrated(true);
  }, [config, fromConfigHydrated]);

  useEffect(() => {
    if (!inboxes || inboxes.length === 0) {
      setSelectedInboxId(null);
      return;
    }
    if (!selectedInboxId) {
      setSelectedInboxId(inboxes[0]!._id);
      if (!to) setTo(inboxes[0]!.address);
      return;
    }
    if (!inboxes.some((inbox) => inbox._id === selectedInboxId)) {
      setSelectedInboxId(inboxes[0]!._id);
      setTo(inboxes[0]!.address);
    }
  }, [inboxes, selectedInboxId, to]);

  // Auto-sync inboxes when switching to the inbox tab
  useEffect(() => {
    if (view !== "inbox") return;
    if (!inboxes || inboxes.length === 0) return;
    syncAllInboxes({}).catch(() => {
      // silent — cron will catch up
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const selectedMessage = useMemo(
    () => messages?.find((m) => m.messageId === selectedMessageId) ?? null,
    [messages, selectedMessageId],
  );

  // ---------------------------------------------------------------------------
  // Computed
  // ---------------------------------------------------------------------------

  const emailCounts = useMemo(() => {
    if (!demoEmails)
      return { total: 0, queued: 0, sending: 0, sent: 0, failed: 0, retrying: 0, canceled: 0 };
    const counts = {
      total: demoEmails.length,
      queued: 0,
      sending: 0,
      sent: 0,
      failed: 0,
      retrying: 0,
      canceled: 0,
    };
    for (const e of demoEmails) {
      const s = (e.status?.status ?? "queued") as keyof typeof counts;
      if (s in counts) counts[s]++;
    }
    return counts;
  }, [demoEmails]);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function parseCcBccList(input: string): Array<{ email: string; name?: string }> | undefined {
    const entries = input.split(",").map((s) => s.trim()).filter(Boolean);
    if (entries.length === 0) return undefined;
    return entries.map((entry) => {
      // Parse "Name <email>" format
      const match = entry.match(/^(.+?)\s*<([^>]+)>$/);
      if (match) return { email: match[2]!.trim(), name: match[1]!.trim() };
      return { email: entry };
    });
  }

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const onSyncSecrets = useCallback(async () => {
    try {
      const result = await syncSecretsFromEnv({});
      toast.success(
        `Secrets synced \u2014 API Key: ${result.hasApiKey ? "yes" : "no"}, Webhook: ${result.hasWebhookSecret ? "yes" : "no"}`,
      );
    } catch (err) {
      toast.error(friendlyError(err, "Failed to sync secrets"));
    }
  }, [syncSecretsFromEnv]);

  const onToggleTestMode = useCallback(
    async (enabled: boolean) => {
      setTestMode(enabled);
      try {
        await setConfig({ testMode: enabled });
        toast.success(enabled ? "Test mode ON \u2014 emails redirect to sandbox" : "Test mode OFF");
      } catch (err) {
        toast.error(friendlyError(err, "Failed to save test mode"));
      }
    },
    [setConfig],
  );

  const onSaveConfig = useCallback(async () => {
    try {
      await setConfig({
        testMode,
        sandboxTo: sandboxTo
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean),
        providerCompatibilityMode,
      });
      toast.success("Config saved");
    } catch (err) {
      toast.error(friendlyError(err, "Failed to save config"));
    }
  }, [setConfig, testMode, sandboxTo, providerCompatibilityMode]);

  const onQueueSingle = useCallback(async () => {
    if (!to.trim()) {
      toast.error("Recipient required");
      return;
    }
    let parsedDynamic: unknown;
    if (composeMode === "template" && dynamicData.trim()) {
      try { parsedDynamic = JSON.parse(dynamicData); } catch { toast.error("Invalid Dynamic Data JSON"); return; }
    }
    let parsedMetadata: unknown;
    if (emailMetadata.trim()) {
      try { parsedMetadata = JSON.parse(emailMetadata); } catch { toast.error("Invalid Metadata JSON"); return; }
    }
    try {
      const result = await sendEmail({
        to: to.trim(),
        toName: toName.trim() || undefined,
        subject: composeMode === "content" ? subject : undefined,
        html: composeMode === "content" ? html : undefined,
        templateId: composeMode === "template" && templateId.trim() ? templateId.trim() : undefined,
        dynamicData: parsedDynamic,
        from: fromOverride.trim() || undefined,
        fromName: fromName.trim() || undefined,
        replyTo: replyToOverride.trim() || undefined,
        replyToName: replyToName.trim() || undefined,
        cc: parseCcBccList(ccField),
        bcc: parseCcBccList(bccField),
        unsubscribeGroupId: unsubscribeGroupId.trim() || undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
        metadata: parsedMetadata,
        idempotencyKey: idempotencyKey.trim() || undefined,
      });
      toast.success(
        result.deduped ? `Deduped \u2014 ${result.emailId}` : `Queued \u2014 ${result.emailId}`,
      );
    } catch (err) {
      toast.error(friendlyError(err, "Queue processing failed"));
    }
  }, [sendEmail, to, toName, subject, html, idempotencyKey, composeMode, templateId, dynamicData, fromOverride, fromName, replyToOverride, replyToName, ccField, bccField, unsubscribeGroupId, emailMetadata, attachments]);

  const onQueueBulk = useCallback(async () => {
    const recipients = Array.from(
      new Set(
        bulkRecipients
          .split(/[\n,]/g)
          .map((v) => v.trim())
          .filter(Boolean),
      ),
    );
    if (recipients.length === 0) {
      toast.error("Add at least one recipient");
      return;
    }
    let parsedDynamic: unknown;
    if (composeMode === "template" && dynamicData.trim()) {
      try { parsedDynamic = JSON.parse(dynamicData); } catch { toast.error("Invalid Dynamic Data JSON"); return; }
    }
    let parsedRecipientData: unknown;
    if (recipientDataField.trim()) {
      try { parsedRecipientData = JSON.parse(recipientDataField); } catch { toast.error("Invalid Recipient Data JSON"); return; }
    }
    let parsedMetadata: unknown;
    if (emailMetadata.trim()) {
      try { parsedMetadata = JSON.parse(emailMetadata); } catch { toast.error("Invalid Metadata JSON"); return; }
    }
    try {
      const result = await sendBulk({
        recipients,
        recipientData: parsedRecipientData,
        subject: composeMode === "content" ? subject : undefined,
        html: composeMode === "content" ? html : undefined,
        templateId: composeMode === "template" && templateId.trim() ? templateId.trim() : undefined,
        dynamicData: parsedDynamic,
        from: fromOverride.trim() || undefined,
        fromName: fromName.trim() || undefined,
        replyTo: replyToOverride.trim() || undefined,
        replyToName: replyToName.trim() || undefined,
        cc: parseCcBccList(ccField),
        bcc: parseCcBccList(bccField),
        unsubscribeGroupId: unsubscribeGroupId.trim() || undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
        metadata: parsedMetadata,
        idempotencyKeyPrefix: idempotencyPrefix.trim() || undefined,
      });
      toast.success(`Queued ${result.acceptedCount} emails`);
    } catch (err) {
      toast.error(friendlyError(err, "Bulk queue failed"));
    }
  }, [sendBulk, bulkRecipients, subject, html, idempotencyPrefix, recipientDataField, composeMode, templateId, dynamicData, fromOverride, fromName, replyToOverride, replyToName, ccField, bccField, unsubscribeGroupId, emailMetadata, attachments]);

  const onProcessQueue = useCallback(async () => {
    setProcessing(true);
    try {
      const result = await processQueue({});
      setQueueResult(result);
      toast.success(`Processed ${result.processedCount} \u2014 sent ${result.sentCount}`);
    } catch (err) {
      toast.error(friendlyError(err, "Queue processing failed"));
    } finally {
      setProcessing(false);
    }
  }, [processQueue]);

  const onDryRunCleanup = useCallback(async () => {
    setCleanupRunning(true);
    try {
      const [oldResult, abandonedResult] = await Promise.all([
        cleanupOldEmails({ dryRun: true }),
        cleanupAbandonedEmails({ dryRun: true }),
      ]);
      setDryRunOldResult(oldResult);
      setDryRunAbandonedResult(abandonedResult);
      toast.success(
        `Dry-run: ${oldResult.emailIds.length} old, ${abandonedResult.emailIds.length} abandoned`,
      );
    } catch (err) {
      toast.error(friendlyError(err, "Cleanup failed"));
    } finally {
      setCleanupRunning(false);
    }
  }, [cleanupOldEmails, cleanupAbandonedEmails]);

  const onExecuteCleanupOld = useCallback(() => {
    setConfirmDialog({
      title: "Delete old emails",
      description: "This will permanently delete old terminal emails. This action cannot be undone.",
      actionLabel: "Delete",
      onConfirm: async () => {
        setCleanupRunning(true);
        try {
          const result = await executeCleanupOld({});
          setCleanupOldResult(result);
          setDryRunOldResult(null);
          toast.success(`Deleted ${result.deletedCount} old emails`);
        } catch (err) {
          toast.error(friendlyError(err, "Cleanup failed"));
        } finally {
          setCleanupRunning(false);
        }
      },
    });
  }, [executeCleanupOld]);

  const onExecuteCleanupAbandoned = useCallback(() => {
    setConfirmDialog({
      title: "Recover abandoned emails",
      description: "This will recover abandoned sending emails by re-queuing them for delivery.",
      actionLabel: "Recover",
      onConfirm: async () => {
        setCleanupRunning(true);
        try {
          const result = await executeCleanupAbandoned({});
          setCleanupAbandonedResult(result);
          setDryRunAbandonedResult(null);
          toast.success(`Recovered ${result.recoveredCount} abandoned emails`);
        } catch (err) {
          toast.error(friendlyError(err, "Recovery failed"));
        } finally {
          setCleanupRunning(false);
        }
      },
    });
  }, [executeCleanupAbandoned]);

  const onCleanupDeliveries = useCallback(async () => {
    setCleanupRunning(true);
    try {
      const result = await cleanupOldDeliveries({});
      setCleanupDeliveryResult(result);
      toast.success(`Deleted ${result.deletedCount} old webhook delivery records`);
    } catch (err) {
      toast.error(friendlyError(err, "Delivery cleanup failed"));
    } finally {
      setCleanupRunning(false);
    }
  }, [cleanupOldDeliveries]);

  const onAddFiles = useCallback(async (files: FileList) => {
    const newItems: AttachmentItem[] = [];
    for (const file of Array.from(files)) {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1] ?? "");
        };
        reader.readAsDataURL(file);
      });
      newItems.push({
        filename: file.name,
        content: base64,
        contentType: file.type || undefined,
      });
    }
    setAttachments((prev) => [...prev, ...newItems]);
  }, []);

  const onAddUrlAttachment = useCallback((filename: string, fileUrl: string, description?: string, contentType?: string) => {
    if (!filename.trim() || !fileUrl.trim()) return;
    setAttachments((prev) => [...prev, {
      filename: filename.trim(),
      fileUrl: fileUrl.trim(),
      contentType: contentType?.trim() || undefined,
      description: description?.trim() || undefined,
    }]);
  }, []);

  const onCreateInbox = useCallback(async () => {
    try {
      const result = await createInbox({ label: inboxLabel.trim() || undefined });
      setSelectedInboxId(result.inboxId as Id<"mailtmInboxes">);
      setTo(result.address);
      setBulkRecipients((prev) =>
        prev.trim() ? `${prev}\n${result.address}` : result.address,
      );
      toast.success(`Created ${result.address}`);
      await syncInbox({ inboxId: result.inboxId as Id<"mailtmInboxes"> });
    } catch (err) {
      toast.error(friendlyError(err, "Inbox creation failed"));
    }
  }, [createInbox, inboxLabel, syncInbox]);

  const onSyncInbox = useCallback(
    async (inboxId: Id<"mailtmInboxes">) => {
      try {
        const result = await syncInbox({ inboxId });
        toast.success(`Synced ${result.syncedCount} messages`);
      } catch (err) {
        toast.error(friendlyError(err, "Sync failed"));
      }
    },
    [syncInbox],
  );

  // Real-time SSE sync — triggers when Mail.tm receives a new message
  const onLiveMessage = useCallback(
    (inboxId: Id<"mailtmInboxes">) => {
      syncInbox({ inboxId }).catch(() => {});
    },
    [syncInbox],
  );
  useMailTmLiveSync(inboxes as any, onLiveMessage, view === "inbox");

  const onDeleteInbox = useCallback(
    async (inboxId: Id<"mailtmInboxes">) => {
      try {
        await deleteInbox({ inboxId });
        toast.success("Inbox deleted");
      } catch (err) {
        toast.error(friendlyError(err, "Delete failed"));
      }
    },
    [deleteInbox],
  );

  const onOpenMessage = useCallback(
    async (messageId: string) => {
      if (!selectedInboxId) return;
      try {
        await fetchMessage({ inboxId: selectedInboxId, messageId });
        setSelectedMessageId(messageId);
      } catch (err) {
        toast.error(friendlyError(err, "Failed to load message"));
      }
    },
    [fetchMessage, selectedInboxId],
  );

  const onCancel = useCallback(
    async (emailId: string) => {
      try {
        const result = await cancelEmail({ emailId });
        toast.success(result.canceled ? "Canceled" : "Cannot cancel \u2014 already terminal");
      } catch (err) {
        toast.error(friendlyError(err, "Cancel failed"));
      }
    },
    [cancelEmail],
  );

  // ---------------------------------------------------------------------------
  // Contacts handlers (wrap actions with toast + loading)
  // ---------------------------------------------------------------------------

  const onCreateContact = useCallback(
    async (args: { email: string; firstName?: string; lastName?: string; userId?: string; customFields?: unknown }) => {
      setContactsLoading(true);
      try {
        const result = await createContactAction(args);
        toast.success(`Created contact ${result.contact.email}`);
        return result;
      } catch (err) {
        toast.error(friendlyError(err, "Failed to create contact"));
        throw err;
      } finally {
        setContactsLoading(false);
      }
    },
    [createContactAction],
  );

  const onGetContact = useCallback(
    async (args: { contactId: string }) => {
      setContactsLoading(true);
      try {
        const result = await getContactAction(args);
        toast.success(`Found contact ${result.contact.email}`);
        return result;
      } catch (err) {
        toast.error(friendlyError(err, "Failed to get contact"));
        throw err;
      } finally {
        setContactsLoading(false);
      }
    },
    [getContactAction],
  );

  const onUpsertContact = useCallback(
    async (args: { email: string; firstName?: string; lastName?: string; userId?: string; customFields?: unknown }) => {
      setContactsLoading(true);
      try {
        const result = await upsertContactAction(args);
        toast.success(`Upserted contact ${result.contact.email}`);
        return result;
      } catch (err) {
        toast.error(friendlyError(err, "Failed to upsert contact"));
        throw err;
      } finally {
        setContactsLoading(false);
      }
    },
    [upsertContactAction],
  );

  const onDeleteContact = useCallback(
    async (args: { contactId: string }) => {
      setContactsLoading(true);
      try {
        const result = await deleteContactAction(args);
        toast.success(result.message);
        return result;
      } catch (err) {
        toast.error(friendlyError(err, "Failed to delete contact"));
        throw err;
      } finally {
        setContactsLoading(false);
      }
    },
    [deleteContactAction],
  );

  const onDeleteContactByUserId = useCallback(
    async (args: { userId: string }) => {
      setContactsLoading(true);
      try {
        const result = await deleteContactByUserIdAction(args);
        toast.success(result.message);
        return result;
      } catch (err) {
        toast.error(friendlyError(err, "Failed to delete contact by userId"));
        throw err;
      } finally {
        setContactsLoading(false);
      }
    },
    [deleteContactByUserIdAction],
  );

  const onRemoveContactsByEmails = useCallback(
    async (args: { emails: string[] }) => {
      setContactsLoading(true);
      try {
        const result = await removeContactsByEmailsAction(args);
        toast.success(result.message);
        return result;
      } catch (err) {
        toast.error(friendlyError(err, "Failed to remove contacts"));
        throw err;
      } finally {
        setContactsLoading(false);
      }
    },
    [removeContactsByEmailsAction],
  );

  const onSearchContacts = useCallback(
    async (args: { emails: string[] }) => {
      setContactsLoading(true);
      try {
        const result = await searchContactsAction(args);
        toast.success(`Found ${result.contacts.length} contact(s)`);
        return result;
      } catch (err) {
        toast.error(friendlyError(err, "Failed to search contacts"));
        throw err;
      } finally {
        setContactsLoading(false);
      }
    },
    [searchContactsAction],
  );

  const onBulkUpdateContacts = useCallback(
    async (args: { contacts: Array<{ email: string; firstName?: string; lastName?: string; userId?: string; customFields?: unknown }>; runWorkflow?: boolean }) => {
      setContactsLoading(true);
      try {
        const result = await bulkUpdateContactsAction(args);
        toast.success(`Bulk update: ${result.successCount} succeeded, ${result.failedCount} failed`);
        return result;
      } catch (err) {
        toast.error(friendlyError(err, "Bulk update failed"));
        throw err;
      } finally {
        setContactsLoading(false);
      }
    },
    [bulkUpdateContactsAction],
  );

  const onGetUnsubscribeGroups = useCallback(
    async (args: { contactId: string }) => {
      try {
        const result = await getUnsubscribeGroupsAction(args);
        toast.success(`Found ${result.groups.length} unsubscribe group(s)`);
        return result;
      } catch (err) {
        toast.error(friendlyError(err, "Failed to get unsubscribe groups"));
        throw err;
      }
    },
    [getUnsubscribeGroupsAction],
  );

  const onGenerateTempEmail = useCallback(async (): Promise<string> => {
    try {
      const result = await createInbox({ label: "Contact" });
      toast.success(`Generated temp email: ${result.address}`);
      return result.address;
    } catch (err) {
      toast.error(friendlyError(err, "Failed to generate temp email"));
      throw err;
    }
  }, [createInbox]);

  const tempMailDomains = useMemo(() => {
    if (!inboxes || inboxes.length === 0) return [];
    const domains = new Set<string>();
    for (const inbox of inboxes) {
      const domain = inbox.address.split("@")[1];
      if (domain) domains.add(domain.toLowerCase());
    }
    return Array.from(domains);
  }, [inboxes]);

  const existingInboxAddresses = useMemo(() => {
    if (!inboxes) return [];
    return inboxes.map((inbox) => inbox.address);
  }, [inboxes]);

  // ---------------------------------------------------------------------------
  // Lists handlers (wrap actions with toast + loading)
  // ---------------------------------------------------------------------------

  const onListContactLists = useCallback(
    async (args: { type?: "list" | "segment" }) => {
      setListsLoading(true);
      try {
        const result = await listContactListsAction(args);
        toast.success(`Found ${result.contactLists.length} list(s)`);
        return result;
      } catch (err) {
        toast.error(friendlyError(err, "Failed to fetch lists"));
        throw err;
      } finally {
        setListsLoading(false);
      }
    },
    [listContactListsAction],
  );

  const onGetContactList = useCallback(
    async (args: { listId: string }) => {
      setListsLoading(true);
      try {
        const result = await getContactListAction(args);
        toast.success(`Found list "${result.contactList.name}"`);
        return result;
      } catch (err) {
        toast.error(friendlyError(err, "Failed to get list"));
        throw err;
      } finally {
        setListsLoading(false);
      }
    },
    [getContactListAction],
  );

  const onCreateContactList = useCallback(
    async (args: { name: string; description?: string }) => {
      setListsLoading(true);
      try {
        const result = await createContactListAction(args);
        toast.success(`Created list "${result.contactList.name}"`);
        return result;
      } catch (err) {
        toast.error(friendlyError(err, "Failed to create list"));
        throw err;
      } finally {
        setListsLoading(false);
      }
    },
    [createContactListAction],
  );

  const onDeleteContactList = useCallback(
    async (args: { listId: string }) => {
      setListsLoading(true);
      try {
        const result = await deleteContactListAction(args);
        toast.success(result.message);
        return result;
      } catch (err) {
        toast.error(friendlyError(err, "Failed to delete list"));
        throw err;
      } finally {
        setListsLoading(false);
      }
    },
    [deleteContactListAction],
  );

  const onGetContactListContacts = useCallback(
    async (args: { listId: string; page?: number; limit?: number; email?: string }) => {
      setListsLoading(true);
      try {
        const result = await getContactListContactsAction(args);
        toast.success(`Found ${result.contacts.length} contact(s) in list`);
        return result;
      } catch (err) {
        toast.error(friendlyError(err, "Failed to get list contacts"));
        throw err;
      } finally {
        setListsLoading(false);
      }
    },
    [getContactListContactsAction],
  );

  const onAddContactsToList = useCallback(
    async (args: { listId: string; contactIds?: string[]; emails?: string[] }) => {
      setListsLoading(true);
      try {
        const result = await addContactsToListAction(args);
        toast.success(`Added ${result.added} contact(s), ${result.created} new, ${result.alreadyInList} already in list`);
        return result;
      } catch (err) {
        toast.error(friendlyError(err, "Failed to add contacts to list"));
        throw err;
      } finally {
        setListsLoading(false);
      }
    },
    [addContactsToListAction],
  );

  const onRemoveContactsFromList = useCallback(
    async (args: { listId: string; contactIds?: string[]; emails?: string[] }) => {
      setListsLoading(true);
      try {
        const result = await removeContactsFromListAction(args);
        toast.success(`Removed ${result.removed} contact(s), ${result.notInList} not in list`);
        return result;
      } catch (err) {
        toast.error(friendlyError(err, "Failed to remove contacts from list"));
        throw err;
      } finally {
        setListsLoading(false);
      }
    },
    [removeContactsFromListAction],
  );

  // ---------------------------------------------------------------------------
  // Nav items
  // ---------------------------------------------------------------------------

  const NAV: { key: View; label: string; icon: React.ReactNode }[] = [
    { key: "send", label: "Send & Monitor", icon: <Send className="size-4" /> },
    { key: "inbox", label: "Test Inbox", icon: <Inbox className="size-4" /> },
    { key: "contacts", label: "Contacts", icon: <Users className="size-4" /> },
    { key: "lists", label: "Lists", icon: <LayoutList className="size-4" /> },
    { key: "ops", label: "Operations", icon: <Activity className="size-4" /> },
    { key: "setup", label: "Configuration", icon: <Settings2 className="size-4" /> },
  ];

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex flex-col h-svh overflow-hidden">
      {/* ── Top bar ────────────────────────────────────────────── */}
      <header className="shrink-0 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="flex items-center justify-between px-4 sm:px-6 h-14">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="size-7 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center">
                <Mail className="size-3.5 text-white dark:text-zinc-900" />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-none">
                  Convex AutoSend
                </h1>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-none mt-0.5">
                  Demo Console
                </p>
              </div>
            </div>

            {config?.testMode && (
              <Badge
                variant="warning"
                className="text-[10px] ml-1 cursor-pointer"
                onClick={() => setView("setup")}
              >
                Test Mode ON
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "size-2 rounded-full",
                  config?.hasApiKey ? "bg-emerald-500" : "bg-red-500 animate-pulse-soft",
                )}
              />
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 hidden sm:inline">
                API Key
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "size-2 rounded-full",
                  config?.hasWebhookSecret
                    ? "bg-emerald-500"
                    : "bg-red-500 animate-pulse-soft",
                )}
              />
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 hidden sm:inline">
                Webhook
              </span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex px-4 sm:px-6 gap-1 -mb-px overflow-x-auto">
          {NAV.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap cursor-pointer rounded-t-md",
                view === key
                  ? "text-zinc-900 dark:text-zinc-100 border-b-2 border-zinc-900 dark:border-zinc-100"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 border-b-2 border-transparent",
              )}
            >
              {icon}
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </nav>
      </header>

      {/* ── Content ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {view === "send" && (
          <SendView
            inboxes={inboxes}
            to={to}
            setTo={setTo}
            subject={subject}
            setSubject={setSubject}
            html={html}
            setHtml={setHtml}
            idempotencyKey={idempotencyKey}
            setIdempotencyKey={setIdempotencyKey}
            bulkRecipients={bulkRecipients}
            setBulkRecipients={setBulkRecipients}
            idempotencyPrefix={idempotencyPrefix}
            setIdempotencyPrefix={setIdempotencyPrefix}
            recipientDataField={recipientDataField}
            setRecipientDataField={setRecipientDataField}
            sendMode={sendMode}
            setSendMode={setSendMode}
            composeMode={composeMode}
            setComposeMode={setComposeMode}
            templateId={templateId}
            setTemplateId={setTemplateId}
            dynamicData={dynamicData}
            setDynamicData={setDynamicData}
            fromOverride={fromOverride}
            setFromOverride={setFromOverride}
            replyToOverride={replyToOverride}
            setReplyToOverride={setReplyToOverride}
            toName={toName}
            setToName={setToName}
            fromName={fromName}
            setFromName={setFromName}
            replyToName={replyToName}
            setReplyToName={setReplyToName}
            ccField={ccField}
            setCcField={setCcField}
            bccField={bccField}
            setBccField={setBccField}
            unsubscribeGroupId={unsubscribeGroupId}
            setUnsubscribeGroupId={setUnsubscribeGroupId}
            emailMetadata={emailMetadata}
            setEmailMetadata={setEmailMetadata}
            attachments={attachments}
            setAttachments={setAttachments}
            onAddFiles={onAddFiles}
            onAddUrlAttachment={onAddUrlAttachment}
            onQueueSingle={onQueueSingle}
            onQueueBulk={onQueueBulk}
            onProcessQueue={onProcessQueue}
            onCreateInbox={onCreateInbox}
            processing={processing}
            demoEmails={demoEmails}
            emailCounts={emailCounts}
            onCancel={onCancel}
          />
        )}
        {view === "inbox" && (
          <InboxView
            inboxes={inboxes}
            selectedInboxId={selectedInboxId}
            setSelectedInboxId={setSelectedInboxId}
            setTo={setTo}
            messages={messages}
            selectedMessage={selectedMessage}
            selectedMessageId={selectedMessageId}
            inboxLabel={inboxLabel}
            setInboxLabel={setInboxLabel}
            onCreateInbox={onCreateInbox}
            onSyncInbox={onSyncInbox}
            onDeleteInbox={onDeleteInbox}
            onOpenMessage={onOpenMessage}
          />
        )}
        {view === "contacts" && (
          <ContactsView
            onCreateContact={onCreateContact}
            onGetContact={onGetContact}
            onUpsertContact={onUpsertContact}
            onDeleteContact={onDeleteContact}
            onDeleteContactByUserId={onDeleteContactByUserId}
            onRemoveContactsByEmails={onRemoveContactsByEmails}
            onSearchContacts={onSearchContacts}
            onBulkUpdateContacts={onBulkUpdateContacts}
            onGetUnsubscribeGroups={onGetUnsubscribeGroups}
            onGenerateTempEmail={onGenerateTempEmail}
            tempMailDomains={tempMailDomains}
            existingInboxAddresses={existingInboxAddresses}
            loading={contactsLoading}
          />
        )}
        {view === "lists" && (
          <ListsView
            onListContactLists={onListContactLists}
            onGetContactList={onGetContactList}
            onCreateContactList={onCreateContactList}
            onDeleteContactList={onDeleteContactList}
            onGetContactListContacts={onGetContactListContacts}
            onAddContactsToList={onAddContactsToList}
            onRemoveContactsFromList={onRemoveContactsFromList}
            loading={listsLoading}
          />
        )}
        {view === "ops" && (
          <OpsView
            onProcessQueue={onProcessQueue}
            onDryRunCleanup={onDryRunCleanup}
            onExecuteCleanupOld={onExecuteCleanupOld}
            onExecuteCleanupAbandoned={onExecuteCleanupAbandoned}
            onCleanupDeliveries={onCleanupDeliveries}
            processing={processing}
            cleanupRunning={cleanupRunning}
            queueResult={queueResult}
            emailCounts={emailCounts}
            config={config}
            dryRunOldResult={dryRunOldResult}
            dryRunAbandonedResult={dryRunAbandonedResult}
            cleanupOldResult={cleanupOldResult}
            cleanupAbandonedResult={cleanupAbandonedResult}
            cleanupDeliveryResult={cleanupDeliveryResult}
          />
        )}
        {view === "setup" && (
          <SetupView
            config={config}
            inboxes={inboxes}
            defaultFrom={DEMO_DEFAULT_FROM}
            defaultReplyTo={DEMO_DEFAULT_REPLY_TO}
            sandboxTo={sandboxTo}
            setSandboxTo={setSandboxTo}
            testMode={testMode}
            onToggleTestMode={onToggleTestMode}
            providerCompatibilityMode={providerCompatibilityMode}
            setProviderCompatibilityMode={setProviderCompatibilityMode}
            onSyncSecrets={onSyncSecrets}
            onSaveConfig={onSaveConfig}
          />
        )}
      </div>

      {/* ── Confirm dialog ── */}
      <AlertDialog
        open={confirmDialog !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmDialog(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmDialog(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                confirmDialog?.onConfirm();
                setConfirmDialog(null);
              }}
            >
              {confirmDialog?.actionLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
