"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  LayoutList,
  List,
  Plus,
  Search,
  Trash2,
  UserPlus,
  UserMinus,
  Users,
  X,
  Filter,
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

type ContactList = {
  id: string;
  name: string;
  description: string | null;
  type: "list" | "segment";
  contactCount?: number;
  createdAt: string;
  updatedAt: string;
};

type Contact = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  userId: string | null;
  customFields: unknown;
  listIds?: string[];
  createdAt: string;
  updatedAt: string;
  projectId?: string;
};

// ---------------------------------------------------------------------------
// List row
// ---------------------------------------------------------------------------

function ListRow({
  list,
  onDelete,
  onViewContacts,
  deleting,
}: {
  list: ContactList;
  onDelete: (id: string) => void;
  onViewContacts: (id: string) => void;
  deleting: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

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
              <List className="size-3.5 text-zinc-500 dark:text-zinc-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                {list.name}
              </p>
              {list.description && (
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
                  {list.description}
                </p>
              )}
            </div>
          </div>
        </td>
        <td className="py-2.5 px-4 hidden sm:table-cell">
          <Badge
            variant={list.type === "segment" ? "info" : "secondary"}
            className="text-[10px]"
          >
            {list.type}
          </Badge>
        </td>
        <td className="py-2.5 px-4 text-xs text-zinc-500 dark:text-zinc-400 tabular-nums hidden md:table-cell">
          {list.contactCount ?? "—"}
        </td>
        <td className="py-2.5 px-4 text-xs text-zinc-400 dark:text-zinc-500 hidden lg:table-cell">
          {new Date(list.createdAt).toLocaleDateString()}
        </td>
        <td className="py-2.5 px-4 text-right">
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              title="View contacts"
              className="h-7 px-2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              onClick={(e) => {
                e.stopPropagation();
                onViewContacts(list.id);
              }}
            >
              <Users className="size-3.5" />
            </Button>
            {list.type === "list" && (
              <Button
                variant="ghost"
                size="sm"
                title="Delete list"
                className="h-7 px-2 text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400"
                disabled={deleting}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(list.id);
                }}
              >
                <Trash2 className="size-3.5" />
              </Button>
            )}
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
          <td colSpan={5} className="bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2.5 text-xs">
                <div>
                  <p className="text-zinc-500 dark:text-zinc-400">ID</p>
                  <p className="font-mono text-zinc-900 dark:text-zinc-100 mt-0.5 break-all">
                    {list.id}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500 dark:text-zinc-400">Name</p>
                  <p className="text-zinc-900 dark:text-zinc-100 mt-0.5">
                    {list.name}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500 dark:text-zinc-400">Type</p>
                  <p className="text-zinc-900 dark:text-zinc-100 mt-0.5 capitalize">
                    {list.type}
                  </p>
                </div>
                {list.description && (
                  <div className="col-span-2 sm:col-span-3">
                    <p className="text-zinc-500 dark:text-zinc-400">
                      Description
                    </p>
                    <p className="text-zinc-900 dark:text-zinc-100 mt-0.5">
                      {list.description}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-zinc-500 dark:text-zinc-400">Contacts</p>
                  <p className="text-zinc-900 dark:text-zinc-100 mt-0.5 tabular-nums">
                    {list.contactCount ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500 dark:text-zinc-400">Created</p>
                  <p className="text-zinc-900 dark:text-zinc-100 mt-0.5">
                    {new Date(list.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500 dark:text-zinc-400">Updated</p>
                  <p className="text-zinc-900 dark:text-zinc-100 mt-0.5">
                    {new Date(list.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
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

export function ListsView({
  onListContactLists,
  onGetContactList,
  onCreateContactList,
  onDeleteContactList,
  onGetContactListContacts,
  onAddContactsToList,
  onRemoveContactsFromList,
  loading,
}: {
  onListContactLists: (args: {
    type?: "list" | "segment";
  }) => Promise<{ contactLists: ContactList[] }>;
  onGetContactList: (args: {
    listId: string;
  }) => Promise<{ contactList: ContactList }>;
  onCreateContactList: (args: {
    name: string;
    description?: string;
  }) => Promise<{ contactList: ContactList }>;
  onDeleteContactList: (args: {
    listId: string;
  }) => Promise<{ success: boolean; message: string }>;
  onGetContactListContacts: (args: {
    listId: string;
    page?: number;
    limit?: number;
    email?: string;
  }) => Promise<{ contacts: Contact[]; pagination: { page: number; limit: number; total: number; pages: number } }>;
  onAddContactsToList: (args: {
    listId: string;
    contactIds?: string[];
    emails?: string[];
  }) => Promise<{ success: boolean; added: number; created: number; alreadyInList: number; totalContactsInList: number; errors: Array<{ email: string; error: string }> }>;
  onRemoveContactsFromList: (args: {
    listId: string;
    contactIds?: string[];
    emails?: string[];
  }) => Promise<{ success: boolean; removed: number; notInList: number; errors: Array<{ email: string; error: string }> }>;
  loading: boolean;
}) {
  // Create form
  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");

  // Membership form
  const [memberListId, setMemberListId] = useState("");
  const [addMode, setAddMode] = useState<"ids" | "emails">("emails");
  const [addInput, setAddInput] = useState("");
  const [removeInput, setRemoveInput] = useState("");

  // Filter
  const [typeFilter, setTypeFilter] = useState<"all" | "list" | "segment">("all");

  // Search by ID
  const [searchListId, setSearchListId] = useState("");

  // Results
  const [lists, setLists] = useState<ContactList[]>([]);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  // Contacts panel
  const [viewingContacts, setViewingContacts] = useState<{
    listId: string;
    listName: string;
    contacts: Contact[];
  } | null>(null);

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

  async function handleCreate() {
    if (!createName.trim()) {
      toast.error("List name is required");
      return;
    }
    try {
      const result = await onCreateContactList({
        name: createName.trim(),
        description: createDescription.trim() || undefined,
      });
      setLists((prev) => [result.contactList, ...prev]);
      setCreateName("");
      setCreateDescription("");
    } catch {
      // errors toasted by parent
    }
  }

  async function handleFetchLists() {
    try {
      const filterArg = typeFilter === "all" ? {} : { type: typeFilter as "list" | "segment" };
      const result = await onListContactLists(filterArg);
      setLists(result.contactLists);
    } catch {
      // errors toasted by parent
    }
  }

  async function handleSearchById() {
    if (!searchListId.trim()) return;
    try {
      const result = await onGetContactList({ listId: searchListId.trim() });
      setLists((prev) => [
        result.contactList,
        ...prev.filter((l) => l.id !== result.contactList.id),
      ]);
    } catch {
      // errors toasted by parent
    }
  }

  function handleDelete(listId: string) {
    const list = lists.find((l) => l.id === listId);
    setConfirmDialog({
      title: "Delete list",
      description: `This will permanently delete "${list?.name ?? listId}". Contacts in this list will not be deleted. This action cannot be undone.`,
      actionLabel: "Delete",
      onConfirm: async () => {
        setDeletingIds((prev) => new Set(prev).add(listId));
        try {
          await onDeleteContactList({ listId });
          setLists((prev) => prev.filter((l) => l.id !== listId));
          if (viewingContacts?.listId === listId) setViewingContacts(null);
        } catch {
          // errors toasted by parent
        } finally {
          setDeletingIds((prev) => {
            const next = new Set(prev);
            next.delete(listId);
            return next;
          });
        }
      },
    });
  }

  async function handleViewContacts(listId: string) {
    const list = lists.find((l) => l.id === listId);
    try {
      const result = await onGetContactListContacts({ listId, limit: 50 });
      setViewingContacts({
        listId,
        listName: list?.name ?? listId,
        contacts: result.contacts,
      });
    } catch {
      // errors toasted by parent
    }
  }

  async function handleAddContacts() {
    if (!memberListId.trim()) {
      toast.error("List ID is required");
      return;
    }
    const values = addInput
      .split(/[\n,]/g)
      .map((v) => v.trim())
      .filter(Boolean);
    if (values.length === 0) {
      toast.error(`At least one ${addMode === "ids" ? "contact ID" : "email"} is required`);
      return;
    }
    try {
      const args =
        addMode === "ids"
          ? { listId: memberListId.trim(), contactIds: values }
          : { listId: memberListId.trim(), emails: values };
      await onAddContactsToList(args);
      setAddInput("");
    } catch {
      // errors toasted by parent
    }
  }

  async function handleRemoveContacts() {
    if (!memberListId.trim()) {
      toast.error("List ID is required");
      return;
    }
    const values = removeInput
      .split(/[\n,]/g)
      .map((v) => v.trim())
      .filter(Boolean);
    if (values.length === 0) {
      toast.error("At least one contact ID or email is required");
      return;
    }
    // Auto-detect: if any value looks like an email, use emails; otherwise contactIds
    const hasEmails = values.some((v) => v.includes("@"));
    try {
      await onRemoveContactsFromList({
        listId: memberListId.trim(),
        ...(hasEmails ? { emails: values } : { contactIds: values }),
      });
      setRemoveInput("");
    } catch {
      // errors toasted by parent
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex flex-col lg:flex-row h-full">
      {/* ── Form sidebar ── */}
      <div className="lg:w-[400px] xl:w-[440px] shrink-0 border-b lg:border-b-0 lg:border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-y-auto">
        <div className="p-5 space-y-5">
          {/* Create List */}
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
              Create List
            </h2>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-500 dark:text-zinc-400">
                  Name
                </Label>
                <Input
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="Newsletter Subscribers"
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-500 dark:text-zinc-400">
                  Description
                  <span className="text-zinc-400 dark:text-zinc-500 ml-1">
                    (optional)
                  </span>
                </Label>
                <Input
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="Monthly newsletter recipients"
                  className="text-xs"
                />
              </div>
              <Button
                size="sm"
                onClick={handleCreate}
                disabled={loading || !createName.trim()}
              >
                <Plus className="size-3.5" />
                Create List
              </Button>
            </div>
          </div>

          <Separator />

          {/* Membership Management */}
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
              Membership
            </h2>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-500 dark:text-zinc-400">
                  List ID
                </Label>
                <Input
                  value={memberListId}
                  onChange={(e) => setMemberListId(e.target.value)}
                  placeholder="cl_abc123"
                  className="font-mono text-xs"
                />
              </div>

              {/* Add contacts */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-zinc-500 dark:text-zinc-400">
                    Add Contacts
                  </Label>
                  <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                    <button
                      onClick={() => setAddMode("emails")}
                      className={cn(
                        "px-2 py-0.5 text-[10px] font-medium transition-colors cursor-pointer",
                        addMode === "emails"
                          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                          : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200",
                      )}
                    >
                      Emails
                    </button>
                    <button
                      onClick={() => setAddMode("ids")}
                      className={cn(
                        "px-2 py-0.5 text-[10px] font-medium transition-colors border-l border-zinc-200 dark:border-zinc-700 cursor-pointer",
                        addMode === "ids"
                          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                          : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200",
                      )}
                    >
                      IDs
                    </button>
                  </div>
                </div>
                <Textarea
                  value={addInput}
                  onChange={(e) => setAddInput(e.target.value)}
                  placeholder={
                    addMode === "emails"
                      ? "a@example.com, b@example.com"
                      : "ct_abc123, ct_def456"
                  }
                  rows={2}
                  className="font-mono text-xs"
                />
                <Button
                  size="sm"
                  onClick={handleAddContacts}
                  disabled={
                    loading || !memberListId.trim() || !addInput.trim()
                  }
                >
                  <UserPlus className="size-3.5" />
                  Add to List
                </Button>
              </div>

              <Separator />

              {/* Remove contacts */}
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-500 dark:text-zinc-400">
                  Remove Contacts (by ID or email)
                </Label>
                <Textarea
                  value={removeInput}
                  onChange={(e) => setRemoveInput(e.target.value)}
                  placeholder="ct_abc123, ct_def456 or a@example.com"
                  rows={2}
                  className="font-mono text-xs"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveContacts}
                  disabled={
                    loading || !memberListId.trim() || !removeInput.trim()
                  }
                >
                  <UserMinus className="size-3.5" />
                  Remove from List
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── List feed ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Search/filter strip */}
        <div className="shrink-0 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-5 py-3">
          <div className="flex items-center gap-3">
            {/* Type filter */}
            <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden shrink-0">
              {(["all", "list", "segment"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={cn(
                    "px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer capitalize",
                    t !== "all" &&
                      "border-l border-zinc-200 dark:border-zinc-700",
                    typeFilter === t
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>

            <Button
              size="sm"
              variant="outline"
              className="h-8 px-3"
              onClick={handleFetchLists}
              disabled={loading}
            >
              <Filter className="size-3.5" />
              <span className="hidden sm:inline ml-1.5">Fetch Lists</span>
            </Button>

            <div className="flex-1 flex gap-2">
              <Input
                value={searchListId}
                onChange={(e) => setSearchListId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearchById()}
                placeholder="Search by List ID..."
                className="font-mono text-xs h-8"
              />
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-3"
                onClick={handleSearchById}
                disabled={loading || !searchListId.trim()}
              >
                <Search className="size-3.5" />
              </Button>
            </div>

            {lists.length > 0 && (
              <Badge variant="secondary" className="text-[10px] shrink-0">
                {lists.length}
              </Badge>
            )}
          </div>
        </div>

        {/* Contacts panel */}
        {viewingContacts && (
          <div className="shrink-0 border-b border-zinc-200 dark:border-zinc-800 bg-sky-50/50 dark:bg-sky-950/20 px-5 py-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <Users className="size-3.5 text-sky-500" />
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  Contacts in &ldquo;{viewingContacts.listName}&rdquo;
                </span>
                <Badge variant="secondary" className="text-[10px]">
                  {viewingContacts.contacts.length}
                </Badge>
              </div>
              <button
                onClick={() => setViewingContacts(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            </div>
            {viewingContacts.contacts.length === 0 ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 italic mt-1">
                No contacts in this list.
              </p>
            ) : (
              <div className="mt-2 space-y-1 max-h-48 overflow-auto">
                {viewingContacts.contacts.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5"
                  >
                    <div className="size-5 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                      <Users className="size-2.5 text-zinc-400" />
                    </div>
                    <div className="min-w-0 flex-1 flex items-center gap-3">
                      <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
                        {[c.firstName, c.lastName].filter(Boolean).join(" ") ||
                          c.email}
                      </span>
                      <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500 truncate">
                        {c.email}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 shrink-0">
                      {c.id}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* List table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-zinc-50 dark:bg-zinc-900">
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="text-left py-2.5 px-4 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  List
                </th>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-zinc-500 dark:text-zinc-400 hidden sm:table-cell">
                  Type
                </th>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-zinc-500 dark:text-zinc-400 hidden md:table-cell">
                  Contacts
                </th>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-zinc-500 dark:text-zinc-400 hidden lg:table-cell">
                  Created
                </th>
                <th className="text-right py-2.5 px-4 text-xs font-medium text-zinc-500 dark:text-zinc-400 w-[120px]" />
              </tr>
            </thead>
            <tbody className="text-sm">
              {lists.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-16 text-zinc-400 dark:text-zinc-500 text-sm"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <LayoutList className="size-8 text-zinc-300 dark:text-zinc-600" />
                      <p>No lists loaded</p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">
                        Create a list or click Fetch Lists to get started
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                lists.map((list) => (
                  <ListRow
                    key={list.id}
                    list={list}
                    onDelete={handleDelete}
                    onViewContacts={handleViewContacts}
                    deleting={deletingIds.has(list.id)}
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
