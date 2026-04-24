"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  RefreshCw,
  Search,
  ShieldOff,
  Sparkles,
  Trash2,
  Upload,
  User,
  Users,
  AlertTriangle,
  X,
} from "lucide-react";
import { toast } from "sonner";

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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Contact = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  userId: string | null;
  customFields: Record<string, unknown> | null;
  listIds?: string[];
  createdAt: string;
  updatedAt: string;
  projectId?: string;
};

type ContactFormArgs = {
  email: string;
  firstName?: string;
  lastName?: string;
  userId?: string;
  customFields?: unknown;
};

type UnsubscribeGroup = {
  groupId: string;
  name: string;
};

// ---------------------------------------------------------------------------
// Contact row
// ---------------------------------------------------------------------------

function ContactRow({
  contact,
  onDelete,
  onGetUnsubGroups,
  deleting,
}: {
  contact: Contact;
  onDelete: (id: string) => void;
  onGetUnsubGroups: (id: string) => void;
  deleting: boolean; // true only when THIS contact is being deleted
}) {
  const [expanded, setExpanded] = useState(false);
  const displayName =
    [contact.firstName, contact.lastName].filter(Boolean).join(" ") ||
    contact.email;

  return (
    <>
      <tr
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer",
          !expanded &&
            "border-b border-zinc-100 dark:border-zinc-800/50",
        )}
      >
        <td className="py-2.5 px-4">
          <div className="flex items-center gap-2.5">
            <div className="size-7 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
              <User className="size-3.5 text-zinc-500 dark:text-zinc-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                {displayName}
              </p>
            </div>
          </div>
        </td>
        <td className="py-2.5 px-4 font-mono text-xs text-zinc-500 dark:text-zinc-400 max-w-[220px] truncate hidden sm:table-cell">
          {contact.email}
        </td>
        <td className="py-2.5 px-4 text-xs text-zinc-400 dark:text-zinc-500 hidden lg:table-cell">
          {new Date(contact.createdAt).toLocaleDateString()}
        </td>
        <td className="py-2.5 px-4 text-right">
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              title="Unsubscribe groups"
              className="h-7 px-2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              onClick={(e) => {
                e.stopPropagation();
                onGetUnsubGroups(contact.id);
              }}
            >
              <ShieldOff className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              title="Delete contact"
              className="h-7 px-2 text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400"
              disabled={deleting}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(contact.id);
              }}
            >
              <Trash2 className="size-3.5" />
            </Button>
            {expanded ? (
              <ChevronDown className="size-4 text-zinc-400" />
            ) : (
              <ChevronRight className="size-4 text-zinc-400" />
            )}
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-zinc-100 dark:border-zinc-800/50 animate-fade-in">
          <td colSpan={4} className="bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2.5 text-xs">
                <div>
                  <p className="text-zinc-500 dark:text-zinc-400">ID</p>
                  <p className="font-mono text-zinc-900 dark:text-zinc-100 mt-0.5 break-all">
                    {contact.id}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500 dark:text-zinc-400">Email</p>
                  <p className="font-mono text-zinc-900 dark:text-zinc-100 mt-0.5 break-all">
                    {contact.email}
                  </p>
                </div>
                {contact.firstName && (
                  <div>
                    <p className="text-zinc-500 dark:text-zinc-400">
                      First Name
                    </p>
                    <p className="text-zinc-900 dark:text-zinc-100 mt-0.5">
                      {contact.firstName}
                    </p>
                  </div>
                )}
                {contact.lastName && (
                  <div>
                    <p className="text-zinc-500 dark:text-zinc-400">
                      Last Name
                    </p>
                    <p className="text-zinc-900 dark:text-zinc-100 mt-0.5">
                      {contact.lastName}
                    </p>
                  </div>
                )}
                {contact.userId && (
                  <div>
                    <p className="text-zinc-500 dark:text-zinc-400">User ID</p>
                    <p className="font-mono text-zinc-900 dark:text-zinc-100 mt-0.5 break-all">
                      {contact.userId}
                    </p>
                  </div>
                )}
                {contact.listIds && contact.listIds.length > 0 && (
                  <div>
                    <p className="text-zinc-500 dark:text-zinc-400">Lists</p>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {contact.listIds.map((id) => (
                        <Badge
                          key={id}
                          variant="secondary"
                          className="text-[10px]"
                        >
                          {id}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-zinc-500 dark:text-zinc-400">Created</p>
                  <p className="text-zinc-900 dark:text-zinc-100 mt-0.5">
                    {new Date(contact.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500 dark:text-zinc-400">Updated</p>
                  <p className="text-zinc-900 dark:text-zinc-100 mt-0.5">
                    {new Date(contact.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
              {contact.customFields &&
                typeof contact.customFields === "object" &&
                Object.keys(contact.customFields).length > 0 && (
                  <div className="text-xs">
                    <p className="text-zinc-500 dark:text-zinc-400 mb-1">
                      Custom Fields
                    </p>
                    <pre className="rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 p-2 font-mono text-[11px] text-zinc-700 dark:text-zinc-300 overflow-auto max-h-24">
                      {JSON.stringify(contact.customFields, null, 2)}
                    </pre>
                  </div>
                )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Main view
// ---------------------------------------------------------------------------

export function ContactsView({
  onCreateContact,
  onGetContact,
  onUpsertContact,
  onDeleteContact,
  onDeleteContactByUserId,
  onRemoveContactsByEmails,
  onSearchContacts,
  onBulkUpdateContacts,
  onGetUnsubscribeGroups,
  onGenerateTempEmail,
  tempMailDomains,
  existingInboxAddresses,
  loading,
}: {
  onCreateContact: (args: {
    email: string;
    firstName?: string;
    lastName?: string;
    userId?: string;
    customFields?: unknown;
  }) => Promise<{ contact: Contact }>;
  onGetContact: (args: {
    contactId: string;
  }) => Promise<{ contact: Contact }>;
  onUpsertContact: (args: {
    email: string;
    firstName?: string;
    lastName?: string;
    userId?: string;
    customFields?: unknown;
  }) => Promise<{ contact: Contact }>;
  onDeleteContact: (args: {
    contactId: string;
  }) => Promise<{ success: boolean; message: string }>;
  onDeleteContactByUserId: (args: {
    userId: string;
  }) => Promise<{ success: boolean; message: string }>;
  onRemoveContactsByEmails: (args: {
    emails: string[];
  }) => Promise<{ success: boolean; message: string }>;
  onSearchContacts: (args: {
    emails: string[];
  }) => Promise<{ contacts: Contact[] }>;
  onBulkUpdateContacts: (args: {
    contacts: Array<{
      email: string;
      firstName?: string;
      lastName?: string;
      userId?: string;
      customFields?: unknown;
    }>;
    runWorkflow?: boolean;
  }) => Promise<{ successCount: number; failedCount: number; totalCount: number }>;
  onGetUnsubscribeGroups: (args: {
    contactId: string;
  }) => Promise<{ groups: UnsubscribeGroup[] }>;
  onGenerateTempEmail: () => Promise<string>;
  tempMailDomains: string[];
  existingInboxAddresses: string[];
  loading: boolean;
}) {
  // Mode
  const [mode, setMode] = useState<"single" | "bulk">("single");

  // Single form
  const [createEmail, setCreateEmail] = useState("");
  const [createFirstName, setCreateFirstName] = useState("");
  const [createLastName, setCreateLastName] = useState("");
  const [createUserId, setCreateUserId] = useState("");
  const [createCustomFields, setCreateCustomFields] = useState("");
  const [generatingEmail, setGeneratingEmail] = useState(false);

  // Bulk form
  const [bulkJson, setBulkJson] = useState("");
  const [bulkRunWorkflow, setBulkRunWorkflow] = useState(false);
  const [bulkValidationError, setBulkValidationError] = useState<string | null>(
    null,
  );
  const [bulkResult, setBulkResult] = useState<{
    successCount: number;
    failedCount: number;
    totalCount: number;
  } | null>(null);

  // Danger zone
  const [deleteUserIdInput, setDeleteUserIdInput] = useState("");
  const [removeEmailsInput, setRemoveEmailsInput] = useState("");

  // Search
  const [searchMode, setSearchMode] = useState<"id" | "email">("id");
  const [searchInput, setSearchInput] = useState("");

  // Results
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [unsubGroups, setUnsubGroups] = useState<{
    contactId: string;
    groups: UnsubscribeGroup[];
  } | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  // Confirm dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    description: string;
    actionLabel: string;
    onConfirm: () => void;
  } | null>(null);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  function isTempMailAddress(email: string): boolean {
    if (tempMailDomains.length === 0) return true;
    const domain = email.split("@")[1]?.toLowerCase();
    return tempMailDomains.some((d) => d.toLowerCase() === domain);
  }

  async function handleGenerateEmail() {
    setGeneratingEmail(true);
    try {
      const address = await onGenerateTempEmail();
      setCreateEmail(address);
    } finally {
      setGeneratingEmail(false);
    }
  }

  function buildContactArgs(): ContactFormArgs | null {
    let parsedCustom: unknown;
    if (createCustomFields.trim()) {
      try {
        parsedCustom = JSON.parse(createCustomFields);
      } catch {
        toast.error("Invalid JSON in Custom Fields");
        return null;
      }
    }
    return {
      email: createEmail.trim(),
      firstName: createFirstName.trim() || undefined,
      lastName: createLastName.trim() || undefined,
      userId: createUserId.trim() || undefined,
      customFields: parsedCustom,
    };
  }

  async function handleCreate() {
    const args = buildContactArgs();
    if (!args) return;
    try {
      const result = await onCreateContact(args);
      setContacts((prev) => [
        result.contact,
        ...prev.filter((c) => c.id !== result.contact.id),
      ]);
    } catch {
      // errors toasted by parent
    }
  }

  async function handleUpsert() {
    const args = buildContactArgs();
    if (!args) return;
    try {
      const result = await onUpsertContact(args);
      setContacts((prev) => [
        result.contact,
        ...prev.filter((c) => c.id !== result.contact.id),
      ]);
    } catch {
      // errors toasted by parent
    }
  }

  async function handleSearch() {
    const val = searchInput.trim();
    if (!val) return;
    try {
      if (searchMode === "id") {
        const result = await onGetContact({ contactId: val });
        setContacts((prev) => [
          result.contact,
          ...prev.filter((c) => c.id !== result.contact.id),
        ]);
      } else {
        const emails = val
          .split(/[\n,]/g)
          .map((e) => e.trim())
          .filter(Boolean);
        const invalid = emails.filter((e) => !/.+@.+\..+/.test(e));
        if (invalid.length > 0) {
          toast.error(
            `Invalid email${invalid.length > 1 ? "s" : ""}: ${invalid.join(", ")}`,
          );
          return;
        }
        const result = await onSearchContacts({ emails });
        setContacts(result.contacts);
      }
    } catch {
      // errors toasted by parent
    }
  }

  function handleDelete(contactId: string) {
    setConfirmDialog({
      title: "Delete contact",
      description: "This will permanently delete this contact. This action cannot be undone.",
      actionLabel: "Delete",
      onConfirm: async () => {
        setDeletingIds((prev) => new Set(prev).add(contactId));
        try {
          await onDeleteContact({ contactId });
          setContacts((prev) => prev.filter((c) => c.id !== contactId));
        } catch {
          // errors toasted by parent
        } finally {
          setDeletingIds((prev) => {
            const next = new Set(prev);
            next.delete(contactId);
            return next;
          });
        }
      },
    });
  }

  async function handleGetUnsubGroups(contactId: string) {
    try {
      const result = await onGetUnsubscribeGroups({ contactId });
      setUnsubGroups({ contactId, groups: result.groups });
    } catch {
      // errors toasted by parent
    }
  }

  function handleDeleteByUserId(userId: string) {
    if (!userId.trim()) {
      toast.error("User ID is required");
      return;
    }
    const trimmed = userId.trim();
    setConfirmDialog({
      title: "Delete contact by User ID",
      description: `This will permanently delete the contact with userId "${trimmed}". This action cannot be undone.`,
      actionLabel: "Delete",
      onConfirm: async () => {
        try {
          await onDeleteContactByUserId({ userId: trimmed });
          setContacts((prev) => prev.filter((c) => c.userId !== trimmed));
        } catch {
          // errors toasted by parent
        }
      },
    });
  }

  function handleRemoveByEmails(emails: string[]) {
    if (emails.length === 0) {
      toast.error("At least one email is required");
      return;
    }
    setConfirmDialog({
      title: "Remove contacts by email",
      description: `This will permanently remove ${emails.length} contact(s). This action cannot be undone.`,
      actionLabel: "Remove",
      onConfirm: async () => {
        try {
          await onRemoveContactsByEmails({ emails });
          const removedSet = new Set(emails.map((e) => e.toLowerCase()));
          setContacts((prev) => prev.filter((c) => !removedSet.has(c.email.toLowerCase())));
        } catch {
          // errors toasted by parent
        }
      },
    });
  }

  function validateBulkEmails(json: string): string | null {
    try {
      const parsed = JSON.parse(json);
      const contactsArray = Array.isArray(parsed) ? parsed : [parsed];
      if (tempMailDomains.length === 0) return null;
      const invalidEmails = contactsArray
        .map((c: Record<string, unknown>) => c.email as string)
        .filter((email: string) => email && !isTempMailAddress(email));
      if (invalidEmails.length > 0) {
        return `External emails not allowed: ${invalidEmails.join(", ")}`;
      }
      return null;
    } catch {
      return null;
    }
  }

  async function handleBulkUpdate() {
    const validationErr = validateBulkEmails(bulkJson);
    if (validationErr) {
      setBulkValidationError(validationErr);
      return;
    }
    setBulkValidationError(null);
    try {
      const parsed = JSON.parse(bulkJson);
      const contactsArray = Array.isArray(parsed) ? parsed : [parsed];
      const result = await onBulkUpdateContacts({
        contacts: contactsArray,
        runWorkflow: bulkRunWorkflow || undefined,
      });
      setBulkResult(result);

      // Fetch the created/updated contacts so they appear in the list
      if (result.successCount > 0) {
        const emails = contactsArray
          .map((c: Record<string, unknown>) => c.email as string)
          .filter(Boolean);
        if (emails.length > 0) {
          try {
            const searchResult = await onSearchContacts({ emails });
            setContacts(searchResult.contacts);
          } catch {
            // Non-critical — bulk succeeded, search is best-effort
          }
        }
      }
    } catch (err) {
      if (err instanceof SyntaxError) {
        setBulkValidationError("Invalid JSON. Check the format.");
        toast.error("Invalid JSON in bulk contacts");
      }
    }
  }

  const SAMPLE_NAMES = [
    ["Alice", "Chen"],
    ["Bob", "Martinez"],
    ["Carol", "Johnson"],
    ["Dave", "Kim"],
    ["Eve", "Patel"],
    ["Frank", "Nguyen"],
    ["Grace", "Williams"],
    ["Hank", "Brown"],
    ["Ivy", "Taylor"],
    ["Jack", "Davis"],
  ];

  function handlePrePopulateBulk() {
    if (existingInboxAddresses.length === 0) return;
    const c = existingInboxAddresses.map((addr, i) => {
      const [first, last] = SAMPLE_NAMES[i % SAMPLE_NAMES.length]!;
      return {
        email: addr,
        firstName: first,
        lastName: last,
        customFields: {
          plan: i === 0 ? "pro" : "free",
          role: i === 0 ? "admin" : "member",
          signupDate: new Date().toISOString().split("T")[0],
        },
      };
    });
    setBulkJson(JSON.stringify(c, null, 2));
    setBulkValidationError(null);
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex flex-col lg:flex-row h-full">
      {/* ── Form sidebar ── */}
      <div className="lg:w-[400px] xl:w-[440px] shrink-0 border-b lg:border-b-0 lg:border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-y-auto">
        <div className="p-5 space-y-5">
          {/* Header + mode toggle */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Contact
            </h2>
            <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
              <button
                onClick={() => setMode("single")}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                  mode === "single"
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200",
                )}
              >
                Single
              </button>
              <button
                onClick={() => setMode("bulk")}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium transition-colors border-l border-zinc-200 dark:border-zinc-700 cursor-pointer",
                  mode === "bulk"
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200",
                )}
              >
                Bulk
              </button>
            </div>
          </div>

          {mode === "single" ? (
            <div className="space-y-3">
              {/* Email */}
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-500 dark:text-zinc-400">
                  Email
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={createEmail}
                    readOnly
                    placeholder="Generate a temp email"
                    className="font-mono text-xs bg-zinc-50 dark:bg-zinc-900"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateEmail}
                    disabled={generatingEmail || loading}
                    className="shrink-0"
                  >
                    <Sparkles className="size-3.5" />
                    {generatingEmail ? "..." : "Generate"}
                  </Button>
                </div>
              </div>

              {/* Name */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-500 dark:text-zinc-400">
                    First Name
                  </Label>
                  <Input
                    value={createFirstName}
                    onChange={(e) => setCreateFirstName(e.target.value)}
                    placeholder="Jane"
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-500 dark:text-zinc-400">
                    Last Name
                  </Label>
                  <Input
                    value={createLastName}
                    onChange={(e) => setCreateLastName(e.target.value)}
                    placeholder="Doe"
                    className="text-xs"
                  />
                </div>
              </div>

              {/* User ID */}
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-500 dark:text-zinc-400">
                  User ID
                  <span className="text-zinc-400 dark:text-zinc-500 ml-1">
                    (optional)
                  </span>
                </Label>
                <Input
                  value={createUserId}
                  onChange={(e) => setCreateUserId(e.target.value)}
                  placeholder="app-user-123"
                  className="font-mono text-xs"
                />
              </div>

              <Separator />

              {/* Custom Fields */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-zinc-500 dark:text-zinc-400">
                    Custom Fields (JSON)
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 px-1.5 text-[10px] text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                    onClick={() =>
                      setCreateCustomFields(
                        JSON.stringify(
                          {
                            plan: "pro",
                            role: "admin",
                            signupDate: "2025-01-15",
                            notifications: true,
                          },
                          null,
                          2,
                        ),
                      )
                    }
                  >
                    <Sparkles className="size-3" />
                    Sample
                  </Button>
                </div>
                <Textarea
                  value={createCustomFields}
                  onChange={(e) => setCreateCustomFields(e.target.value)}
                  placeholder='{"fieldName": "value"}'
                  rows={3}
                  className="font-mono text-xs"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                <Button
                  size="sm"
                  onClick={handleCreate}
                  disabled={loading || !createEmail.trim()}
                >
                  <Plus className="size-3.5" />
                  Create
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUpsert}
                  disabled={loading || !createEmail.trim()}
                >
                  <RefreshCw className="size-3.5" />
                  Upsert
                </Button>
              </div>
            </div>
          ) : (
            /* ── Bulk mode ── */
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-500 dark:text-zinc-400">
                  Contacts JSON
                </Label>
                <Textarea
                  value={bulkJson}
                  onChange={(e) => {
                    setBulkJson(e.target.value);
                    setBulkValidationError(null);
                  }}
                  placeholder={`[
  { "email": "...", "firstName": "Alice" },
  { "email": "...", "firstName": "Bob" }
]`}
                  rows={8}
                  className="font-mono text-xs"
                />
                {bulkValidationError && (
                  <div className="flex items-start gap-2 rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 p-2.5 text-xs text-amber-800 dark:text-amber-200">
                    <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
                    <span>{bulkValidationError}</span>
                  </div>
                )}
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                  Only temp mail addresses are allowed. Create inboxes in the
                  Test Inbox tab first.
                </p>
              </div>

              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={bulkRunWorkflow}
                  onChange={(e) => setBulkRunWorkflow(e.target.checked)}
                  className="rounded"
                />
                Run Workflow (trigger automations)
              </label>

              <div className="flex items-center gap-2 pt-1">
                <Button
                  size="sm"
                  onClick={handleBulkUpdate}
                  disabled={loading || !bulkJson.trim()}
                >
                  <Upload className="size-3.5" />
                  Bulk Update
                </Button>
                {existingInboxAddresses.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrePopulateBulk}
                    disabled={loading}
                  >
                    <Sparkles className="size-3.5" />
                    Use Temp Inboxes ({existingInboxAddresses.length})
                  </Button>
                )}
              </div>

              {bulkResult && (
                <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-3 animate-fade-in">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Success
                      </p>
                      <p className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                        {bulkResult.successCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Failed
                      </p>
                      <p className="font-semibold tabular-nums text-red-600 dark:text-red-400">
                        {bulkResult.failedCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Total
                      </p>
                      <p className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                        {bulkResult.totalCount}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Danger Zone ── */}
          <Separator />
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">
              Danger Zone
            </h3>

            {/* Delete by User ID */}
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-500 dark:text-zinc-400">
                Delete by User ID
              </Label>
              <div className="flex gap-2">
                <Input
                  value={deleteUserIdInput}
                  onChange={(e) => setDeleteUserIdInput(e.target.value)}
                  placeholder="app-user-123"
                  className="font-mono text-xs"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteByUserId(deleteUserIdInput)}
                  disabled={loading || !deleteUserIdInput.trim()}
                  className="shrink-0"
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </Button>
              </div>
            </div>

            {/* Remove by Emails */}
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-500 dark:text-zinc-400">
                Remove by Emails
              </Label>
              <Textarea
                value={removeEmailsInput}
                onChange={(e) => setRemoveEmailsInput(e.target.value)}
                placeholder={"a@example.com, b@example.com"}
                rows={2}
                className="font-mono text-xs"
              />
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  const emails = removeEmailsInput
                    .split(/[\n,]/g)
                    .map((e) => e.trim())
                    .filter(Boolean);
                  handleRemoveByEmails(emails);
                }}
                disabled={loading || !removeEmailsInput.trim()}
              >
                <Trash2 className="size-3.5" />
                Remove Contacts
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Contact feed ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Search strip */}
        <div className="shrink-0 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden shrink-0">
              <button
                onClick={() => {
                  setSearchMode("id");
                  setSearchInput("");
                }}
                className={cn(
                  "px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer",
                  searchMode === "id"
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200",
                )}
              >
                By ID
              </button>
              <button
                onClick={() => {
                  setSearchMode("email");
                  setSearchInput("");
                }}
                className={cn(
                  "px-2.5 py-1 text-[11px] font-medium transition-colors border-l border-zinc-200 dark:border-zinc-700 cursor-pointer",
                  searchMode === "email"
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200",
                )}
              >
                By Email
              </button>
            </div>
            <div className="flex-1 flex gap-2">
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder={
                  searchMode === "id"
                    ? "Contact ID..."
                    : "Emails (comma separated)..."
                }
                className="font-mono text-xs h-8"
              />
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-3"
                onClick={handleSearch}
                disabled={loading || !searchInput.trim()}
              >
                <Search className="size-3.5" />
              </Button>
            </div>
            {contacts.length > 0 && (
              <Badge variant="secondary" className="text-[10px] shrink-0">
                {contacts.length}
              </Badge>
            )}
          </div>
        </div>

        {/* Unsub groups banner */}
        {unsubGroups && (
          <div className="shrink-0 border-b border-zinc-200 dark:border-zinc-800 bg-amber-50/50 dark:bg-amber-950/20 px-5 py-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <ShieldOff className="size-3.5 text-amber-500" />
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  Unsubscribe Groups
                </span>
                <span className="text-zinc-400 dark:text-zinc-500 font-mono">
                  {unsubGroups.contactId}
                </span>
              </div>
              <button
                onClick={() => setUnsubGroups(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            </div>
            {unsubGroups.groups.length === 0 ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 italic mt-1">
                No unsubscribe groups for this contact.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {unsubGroups.groups.map((g) => (
                  <Badge key={g.groupId} variant="outline" className="text-[11px]">
                    {g.name}
                    <span className="text-zinc-400 dark:text-zinc-500 ml-1.5 font-mono">
                      {g.groupId}
                    </span>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Contact table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-zinc-50 dark:bg-zinc-900">
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="text-left py-2.5 px-4 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Contact
                </th>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-zinc-500 dark:text-zinc-400 hidden sm:table-cell">
                  Email
                </th>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-zinc-500 dark:text-zinc-400 hidden lg:table-cell">
                  Created
                </th>
                <th className="text-right py-2.5 px-4 text-xs font-medium text-zinc-500 dark:text-zinc-400 w-[120px]" />
              </tr>
            </thead>
            <tbody className="text-sm">
              {contacts.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="text-center py-16 text-zinc-400 dark:text-zinc-500 text-sm"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Users className="size-8 text-zinc-300 dark:text-zinc-600" />
                      <p>No contacts loaded</p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">
                        Create a contact or search to get started
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                contacts.map((contact) => (
                  <ContactRow
                    key={contact.id}
                    contact={contact}
                    onDelete={handleDelete}
                    onGetUnsubGroups={handleGetUnsubGroups}
                    deleting={deletingIds.has(contact.id)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
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
