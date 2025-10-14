"use client";
import React, { useState } from "react";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenuItem,
  SidebarMenu,
} from "@/components/ui/sidebar";
import {
  LuPin,
  LuPinOff,
  LuDownload,
  LuFolderPlus,
  LuFolder,
  LuFolderOpen,
  LuChevronRight,
  LuChevronDown,
} from "react-icons/lu";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { IoMdClose } from "react-icons/io";
import BranchOffIcon from "../../../public/icons/branch-off";
import {
  getThread,
  pinThread,
  deleteThread,
  renameThread,
  createThread,
} from "@/action/thread.action";
import {
  createFolder,
  updateFolder,
  deleteFolder,
} from "@/action/folder.action";
import {
  PiChatSlashDuotone,
  PiChatsTeardropFill,
  PiCube,
} from "react-icons/pi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Plus, Trash2 } from "lucide-react";
import { DialogOverlay } from "@radix-ui/react-dialog";
import threadsStore from "@/stores/threads.store";
import { FiLoader, FiSearch } from "react-icons/fi";
import { useParams, useRouter } from "next/navigation";
import userStore from "@/stores/user.store";
import DevTooltip from "../global-cmp/dev-tooltip";
import { v4 as uuidv4 } from "uuid";
import chatStore from "@/stores/chat.store";

interface Thread {
  _id: string;
  threadId: string;
  parentChatId: string;
  title: string;
  isPinned: boolean;
  createdAt: string;
  userId: string;
  parentFolderId?: string;
}

interface Folder {
  _id: string;
  title: string;
  context: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface FolderWithThreads {
  folder: Folder;
  threads: Thread[];
}

interface ThreadData {
  folders: FolderWithThreads[];
  pin: Thread[];
  today: Thread[];
  week: Thread[];
}

const SidebarThreads = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);
  const [updateFolderDialogOpen, setUpdateFolderDialogOpen] = useState(false);
  const [deleteFolderDialogOpen, setDeleteFolderDialogOpen] = useState(false);
  const { userData } = userStore();
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [folderTitle, setFolderTitle] = useState("");
  const [folderContext, setFolderContext] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );
  const { searchedThreads } = threadsStore();
  const { setMessages } = chatStore();
  const params = useParams();

  // Fetch threads using TanStack Query (now includes folders)
  const {
    data: threadsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["threads"],
    queryFn: async () => {
      const result = await getThread();
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data as ThreadData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Create folder mutation
  const createFolderMutation = useMutation({
    mutationFn: async ({
      title,
      context,
    }: {
      title: string;
      context?: string;
    }) => {
      const result = await createFolder({ title, context });
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      toast.success("Folder created successfully");
      setCreateFolderDialogOpen(false);
      setFolderTitle("");
      setFolderContext("");
    },
    onError: (error) => {
      console.error("Error creating folder:", error);
      toast.error("Failed to create folder");
    },
  });

  // Update folder mutation
  const updateFolderMutation = useMutation({
    mutationFn: async ({
      folderId,
      title,
      context,
    }: {
      folderId: string;
      title?: string;
      context?: string;
    }) => {
      const result = await updateFolder({ folderId, title, context });
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      toast.success("Folder updated successfully");
      setUpdateFolderDialogOpen(false);
      setSelectedFolder(null);
      setFolderTitle("");
      setFolderContext("");
    },
    onError: (error) => {
      console.error("Error updating folder:", error);
      toast.error("Failed to update folder");
    },
  });

  // Delete folder mutation
  const deleteFolderMutation = useMutation({
    mutationFn: async (folderId: string) => {
      const result = await deleteFolder({ folderId });
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      toast.success("Folder deleted successfully");
      setDeleteFolderDialogOpen(false);
      setSelectedFolder(null);
    },
    onError: (error) => {
      console.error("Error deleting folder:", error);
      toast.error("Failed to delete folder");
    },
  });

  // Create thread in folder mutation
  const createThreadInFolderMutation = useMutation({
    mutationFn: async ({
      folderId,
      service = "gemini",
      model = "gemini-1.5-flash",
    }: {
      folderId: string;
      service?: string;
      model?: string;
    }) => {
      const threadId = uuidv4();
      const result = await createThread({
        title: "New Thread",
        threadId,
        service,
        model,
        parentFolderId: folderId,
      });
      if (result.error) {
        throw new Error(result.error);
      }
      return { ...result.data, threadId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      toast.success("Thread created successfully");
      // Navigate to the new thread
      if (data?.threadId) {
        router.push(`/chat/${data.threadId}`);
      }
    },
    onError: (error) => {
      console.error("Error creating thread:", error);
      toast.error("Failed to create thread");
    },
  });

  // Pin/Unpin thread mutation
  const pinMutation = useMutation({
    mutationFn: async (threadId: string) => {
      const result = await pinThread({ threadId });
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      toast.success(data?.isPinned ? "Thread pinned" : "Thread unpinned");
    },
    onError: (error) => {
      console.error("Error pinning thread:", error);
      toast.error("Failed to pin/unpin thread");
    },
  });

  // Delete thread mutation
  const deleteMutation = useMutation({
    mutationFn: async (threadId: string) => {
      const result = await deleteThread({ threadId });
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      toast.success("Thread deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedThread(null);
    },
    onError: (error) => {
      console.error("Error deleting thread:", error);
      toast.error("Failed to delete thread");
    },
  });

  // Rename thread mutation
  const renameMutation = useMutation({
    mutationFn: async ({
      threadId,
      title,
    }: {
      threadId: string;
      title: string;
    }) => {
      const result = await renameThread({ threadId, title });
      if (result?.error) {
        throw new Error(result?.error as string);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      toast.success("Thread renamed successfully");
      setRenameDialogOpen(false);
      setSelectedThread(null);
      setNewTitle("");
    },
    onError: (error) => {
      console.error("Error renaming thread:", error);
      toast.error("Failed to rename thread");
    },
  });

  const handleCreateFolder = () => {
    if (!folderTitle.trim() || !folderContext.trim()){
      toast.info("Please enter a valid folder name and description");
      return;
    };
    createFolderMutation.mutate({
      title: folderTitle.trim(),
      context: folderContext.trim() || undefined,
    });
  };

  const handleUpdateFolder = () => {
    if (!selectedFolder || !folderTitle.trim() || !folderContext.trim()) {
      toast.info("Please enter a valid folder name and description");
      return;
    }
    updateFolderMutation.mutate({
      folderId: selectedFolder._id,
      title: folderTitle.trim(),
      context: folderContext.trim() || undefined,
    });
  };

  const handleDeleteFolder = (folderId: string) => {
    deleteFolderMutation.mutate(folderId);
  };

  const handleCreateThreadInFolder = (folderId: string) => {
    setMessages([]);
    createThreadInFolderMutation.mutate({ folderId });
  };

  const handlePinThread = (threadId: string) => {
    pinMutation.mutate(threadId);
  };

  const handleDeleteThread = (threadId: string) => {
    deleteMutation.mutate(threadId);
  };

  const handleRenameThread = () => {
    if (!selectedThread || !newTitle.trim()) return;
    renameMutation.mutate({
      threadId: selectedThread.threadId,
      title: newTitle.trim(),
    });
  };

  const handleExportThread = (thread: Thread) => {
    const data = {
      title: thread.title,
      threadId: thread.threadId,
      createdAt: thread.createdAt,
      isPinned: thread.isPinned,
    };
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `thread-${thread.title
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Thread exported successfully");
  };

  const toggleFolderExpansion = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const openDeleteDialog = (thread: Thread) => {
    setSelectedThread(thread);
    setDeleteDialogOpen(true);
  };

  const openRenameDialog = (thread: Thread) => {
    setSelectedThread(thread);
    setNewTitle(thread.title);
    setRenameDialogOpen(true);
  };

  const openCreateFolderDialog = () => {
    setCreateFolderDialogOpen(true);
  };

  const openUpdateFolderDialog = (folder: Folder) => {
    setSelectedFolder(folder);
    setFolderTitle(folder.title);
    setFolderContext(folder.context || "");
    setUpdateFolderDialogOpen(true);
  };

  const openDeleteFolderDialog = (folder: Folder) => {
    setSelectedFolder(folder);
    setDeleteFolderDialogOpen(true);
  };

  if ((error || isLoading) && userData) {
    return (
      <SidebarContent>
        <div className="p-4 text-center gap-2 text-muted-foreground mt-4 flex justify-center items-center">
          <FiLoader className="animate-spin" />
          Loading threads
        </div>
      </SidebarContent>
    );
  }

  // Render thread item component
  const ThreadItem = ({
    thread,
    showBranchIcon = false,
    inFolder = false,
  }: {
    thread: Thread;
    showBranchIcon?: boolean;
    inFolder?: boolean;
  }) => {
    const isActionLoading = pinMutation.isPending || deleteMutation.isPending;
    const isCurrentThreadLoading =
      pinMutation.variables === thread.threadId ||
      deleteMutation.variables === thread.threadId;

    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <SidebarMenuItem
            className={`hover:bg-sidebar-accent overflow-x-hidden flex items-center relative px-0 group/link-item rounded-lg ${
              params.chatid === thread.threadId ? "!bg-sidebar-accent" : ""
            } ${inFolder ? "ml-4" : ""}`}
          >
            <Link
              className={`p-2 text-nowrap overflow-hidden w-[95%] truncate px-3 ${
                showBranchIcon ? "truncate flex items-center gap-2" : "block"
              }`}
              prefetch={true}
              href={`/chat/${thread.threadId}`}
            >
              {showBranchIcon && <BranchOffIcon />}
              <p className={showBranchIcon ? "flex-1 truncate" : ""}>
                {thread.title}
              </p>
            </Link>
            <div className="flex bg-sidebar-accent rounded-lg duration-300 ease-out *:size-7  backdrop-blur-sm transition-all items-center gap-1 absolute group-hover/link-item:right-1 -right-[100px]">
              <DevTooltip
                tipData={thread.isPinned ? "Unpin thread" : "Pin thread"}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handlePinThread(thread.threadId);
                  }}
                  disabled={isActionLoading}
                >
                  {isCurrentThreadLoading && pinMutation.isPending ? (
                    <div className="w-3 h-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
                  ) : thread.isPinned ? (
                    <LuPinOff />
                  ) : (
                    <LuPin />
                  )}
                </Button>
              </DevTooltip>
              <DevTooltip tipData="Delete Thread">
                <Button
                  variant="ghost"
                  className="hover:!bg-destructive/50 hover:!text-destructive-foreground"
                  size="icon"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openDeleteDialog(thread);
                  }}
                  disabled={isActionLoading}
                >
                  {isCurrentThreadLoading && deleteMutation.isPending ? (
                    <div className="w-3 h-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
                  ) : (
                    <IoMdClose />
                  )}
                </Button>
              </DevTooltip>
            </div>
          </SidebarMenuItem>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-36">
          <ContextMenuItem
            onClick={() => handlePinThread(thread.threadId)}
            disabled={pinMutation.isPending}
          >
            {thread.isPinned ? (
              <LuPinOff className="mr-2 h-4 w-4" />
            ) : (
              <LuPin className="mr-2 h-4 w-4" />
            )}
            {thread.isPinned ? "Unpin" : "Pin"}
          </ContextMenuItem>
          <ContextMenuItem onClick={() => openRenameDialog(thread)}>
            <Edit className="mr-2 h-4 w-4" />
            Rename
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => openDeleteDialog(thread)}
            className="text-destructive focus:text-destructive"
          >
            <IoMdClose className="mr-2 h-4 w-4" />
            Delete
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleExportThread(thread)}>
            <LuDownload className="mr-2 h-4 w-4" />
            Export
            <span className="ml-auto text-xs bg-primary/10 px-1.5 py-0.5 rounded">
              BETA
            </span>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  };

  // Render folder item component
  const FolderItem = ({ folderData }: { folderData: FolderWithThreads }) => {
    const { folder, threads } = folderData;
    const isExpanded = expandedFolders.has(folder._id);
    const isCreatingThread =
      createThreadInFolderMutation.isPending &&
      createThreadInFolderMutation.variables?.folderId === folder._id;

    return (
      <div className="space-y-1">
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <SidebarMenuItem className="hover:bg-sidebar-accent overflow-x-hidden flex items-center relative px-0 group/folder-item rounded-lg">
              <div
                className="p-2 text-nowrap overflow-hidden w-[90%] truncate px-3 flex items-center gap-2 cursor-pointer"
                onClick={() => toggleFolderExpansion(folder._id)}
              >
                {isExpanded ? (
                  <LuChevronDown className="h-3 w-3 flex-shrink-0" />
                ) : (
                  <LuChevronRight className="h-3 w-3 flex-shrink-0" />
                )}
                {isExpanded ? (
                  <LuFolderOpen className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <LuFolder className="h-4 w-4 flex-shrink-0" />
                )}
                <p className="flex-1 truncate">{folder.title}</p>
                <span className="text-xs text-muted-foreground">
                  ({threads.length})
                </span>
              </div>
              <div className="flex bg-sidebar-accent rounded-lg duration-300 ease-out backdrop-blur-sm transition-all items-center gap-1 absolute group-hover/folder-item:right-1 -right-[100px]">
                <DevTooltip tipData="Create new thread in folder">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleCreateThreadInFolder(folder._id);
                    }}
                    disabled={isCreatingThread}
                  >
                    {isCreatingThread ? (
                      <div className="w-3 h-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
                    ) : (
                      <Plus className="h-3 w-3" />
                    )}
                  </Button>
                </DevTooltip>
              </div>
            </SidebarMenuItem>
          </ContextMenuTrigger>
          <ContextMenuContent className="w-40">
            <ContextMenuItem onClick={() => openUpdateFolderDialog(folder)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Folder
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => handleCreateThreadInFolder(folder._id)}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Thread
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => openDeleteFolderDialog(folder)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Folder
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>

        {/* Folder threads */}
        {isExpanded && (
          <div className="ml-2 space-y-1">
            {threads.map((thread) => (
              <ThreadItem
                key={thread._id}
                thread={thread}
                showBranchIcon={thread.parentChatId !== null}
                inFolder={true}
              />
            ))}
            {threads.length === 0 && (
              <div className="ml-4 p-2 text-xs text-muted-foreground">
                No threads in this folder
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (searchedThreads.length > 0) {
    return (
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="gap-1">
            <FiSearch className="!w-3 !h-3" /> Search Results
          </SidebarGroupLabel>
          <SidebarMenu>
            {searchedThreads.map((thread: any) => (
              <ThreadItem
                key={thread.threadId}
                thread={thread as any}
                showBranchIcon={false}
              />
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    );
  }

  return (
    <>
      <SidebarContent>
        {/* Folders Section */}
        {threadsData && (
          <SidebarGroup>
            <SidebarGroupLabel className="gap-1 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <PiCube className="!w-3.5 !h-3.5" /> Workspaces
              </div>
              <DevTooltip tipData="Create new folder">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={openCreateFolderDialog}
                  disabled={createFolderMutation.isPending}
                >
                  {createFolderMutation.isPending ? (
                    <div className="w-3 h-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
                  ) : (
                    <Plus className="h-3 w-3" />
                  )}
                </Button>
              </DevTooltip>
            </SidebarGroupLabel>
            <SidebarMenu>
              {threadsData.folders.map((folderData) => (
                <FolderItem
                  key={folderData.folder._id}
                  folderData={folderData}
                />
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}

        {/* Pinned Threads */}
        {threadsData?.pin && threadsData.pin.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="gap-1">
              <LuPin className="!w-3 !h-3" /> Pinned
            </SidebarGroupLabel>
            <SidebarMenu>
              {threadsData.pin.map((thread) => (
                <ThreadItem
                  key={thread._id}
                  thread={thread}
                  showBranchIcon={thread.parentChatId !== null}
                />
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}

        {/* Today's Threads */}
        {threadsData?.today && threadsData.today.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Today</SidebarGroupLabel>
            <SidebarMenu>
              {threadsData.today.map((thread) => (
                <ThreadItem
                  key={thread._id}
                  thread={thread}
                  showBranchIcon={thread.parentChatId !== null}
                />
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}

        {/* Week Threads */}
        {threadsData?.week && threadsData.week.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Earlier</SidebarGroupLabel>
            <SidebarMenu>
              {threadsData.week.map((thread) => (
                <ThreadItem
                  key={thread._id}
                  thread={thread}
                  showBranchIcon={thread.parentChatId !== null}
                />
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}

        {(!threadsData ||
          ((!threadsData.folders || threadsData.folders.length === 0) &&
            threadsData.pin.length === 0 &&
            threadsData.today.length === 0 &&
            threadsData.week.length === 0)) && (
          <div className="p-4 text-center gap-3 text-muted-foreground flex-col mt-4 flex justify-center items-center">
            <PiChatSlashDuotone size={30} />  No threads found
          </div>
        )}
      </SidebarContent>

      {/* Create Folder Dialog */}
      <Dialog
        open={createFolderDialogOpen}
        onOpenChange={setCreateFolderDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Create a new folder to organize your threads. You can add a
              description to help identify the folder's purpose.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="folder-title">Folder Name *</Label>
              <Input
                id="folder-title"
                value={folderTitle}
                onChange={(e) => setFolderTitle(e.target.value)}
                placeholder="Enter folder name..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleCreateFolder();
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="folder-context">Description</Label>
              <Textarea
                id="folder-context"
                value={folderContext}
                onChange={(e) => setFolderContext(e.target.value)}
                placeholder="Enter folder description..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setCreateFolderDialogOpen(false);
                setFolderTitle("");
                setFolderContext("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateFolder}
              disabled={!folderTitle.trim() || createFolderMutation.isPending}
            >
              {createFolderMutation.isPending ? "Creating..." : "Create Folder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Folder Dialog */}
      <Dialog
        open={updateFolderDialogOpen}
        onOpenChange={setUpdateFolderDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Folder</DialogTitle>
            <DialogDescription>
              Update the name and description of your folder.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-folder-title">Folder Name *</Label>
              <Input
                id="edit-folder-title"
                value={folderTitle}
                onChange={(e) => setFolderTitle(e.target.value)}
                placeholder="Enter new folder name..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleUpdateFolder();
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-folder-context">Description</Label>
              <Textarea
                id="edit-folder-context"
                value={folderContext}
                onChange={(e) => setFolderContext(e.target.value)}
                placeholder="Enter new folder description..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setUpdateFolderDialogOpen(false);
                setSelectedFolder(null);
                setFolderTitle("");
                setFolderContext("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateFolder}
              disabled={!folderTitle.trim() || updateFolderMutation.isPending}
            >
              {updateFolderMutation.isPending ? "Updating..." : "Update Folder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Thread Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Thread</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedThread?.title}" This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setDeleteDialogOpen(false);
                setSelectedThread(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                selectedThread && handleDeleteThread(selectedThread.threadId)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Folder Confirmation Dialog */}
      <AlertDialog
        open={deleteFolderDialogOpen}
        onOpenChange={setDeleteFolderDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Folder</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the folder "
              {selectedFolder?.title}"? All threads within this folder will also
              be deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setDeleteFolderDialogOpen(false);
                setSelectedFolder(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                selectedFolder && handleDeleteFolder(selectedFolder._id)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteFolderMutation.isPending}
            >
              {deleteFolderMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename Thread Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rename Thread</DialogTitle>
            <DialogDescription>
              Enter a new name for your thread. This will help you identify it
              later.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="items-center space-y-2">
              <Label htmlFor="thread-title" className="text-right">
                Title
              </Label>
              <Input
                id="thread-title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="col-span-3"
                placeholder="Enter thread title..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleRenameThread();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setRenameDialogOpen(false);
                setSelectedThread(null);
                setNewTitle("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRenameThread}
              disabled={!newTitle.trim() || renameMutation.isPending}
            >
              {renameMutation.isPending ? "Renaming..." : "Rename"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SidebarThreads;
