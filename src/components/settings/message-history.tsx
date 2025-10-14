"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Upload, Download, Trash2 } from "lucide-react";
import { TbPinFilled } from "react-icons/tb";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bulkDeleteThread } from "@/action/thread.action";
import { toast } from "sonner";

interface Thread {
  _id: string;
  threadId: string;
  title: string;
  isPinned: boolean;
  createdAt: string;
}

interface MessageHistoryProps {
  data: Thread[] | null;
}

const MessageHistory = ({ data }: MessageHistoryProps) => {
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  
  // Transform the thread data to match the expected format
  const messages = data?.map((thread) => ({
    id: thread._id,
    threadId: thread.threadId,
    title: thread.title,
    timestamp: new Date(thread.createdAt).toLocaleString(),
    isPinned: thread.isPinned,
  })) || [];

  // TanStack Query mutation for bulk delete
  const bulkDeleteMutation = useMutation({
    mutationFn: async (threadIds: string[]) => {
      const result = await bulkDeleteThread({ threadIds });
      if (result.error) {
        throw new Error(result.error as string);
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success(`Successfully deleted ${selectedMessages.length} thread(s)`);
      setSelectedMessages([]);
      setIsDeleteDialogOpen(false);
      // Invalidate and refetch the threads data
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      // Refresh the page data
      window.location.reload();
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete threads: ${error.message}`);
    },
  });

  const handleSelectAll = () => {
    if (selectedMessages.length === messages.length) {
      setSelectedMessages([]);
    } else {
      setSelectedMessages(messages.map((msg) => msg.id));
    }
  };

  const handleMessageSelect = (messageId: string) => {
    setSelectedMessages((prev) =>
      prev.includes(messageId)
        ? prev.filter((id) => id !== messageId)
        : [...prev, messageId]
    );
  };

  const handleExport = () => {
    // Implementation for export functionality
    // console.log("Exporting messages:", selectedMessages);
  };

  const handleDelete = () => {
    if (selectedMessages.length === 0) return;
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    // Get the threadIds for the selected messages
    const selectedThreadIds = messages
      .filter((msg) => selectedMessages.includes(msg.id))
      .map((msg) => msg.threadId);
    
    bulkDeleteMutation.mutate(selectedThreadIds);
  };

  const handleImport = () => {
    // Implementation for import functionality
    // console.log("Importing messages");
  };

  const allSelected = selectedMessages.length === messages.length;
  const someSelected =
    selectedMessages.length > 0 && selectedMessages.length < messages.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          Message History
        </h2>
        <p className="text-sm text-muted-foreground">
          Save your history as JSON, or import someone else's. Importing will
          NOT delete existing messages
        </p>
      </div>

      {/* Message List */}
      {/* Controls */}
      <div className="flex w-full px-1 items-center justify-between">

        <Button
          variant="outline"
          size="sm"
          id="select-all"
          onClick={handleSelectAll}
          className="flex items-center space-x-2"
        >
          <Checkbox id="select-all" onCheckedChange={handleSelectAll} className="cursor-pointer" checked={allSelected} />
          <label
            htmlFor="select-all"
            className="text-sm text-foreground cursor-pointer"
          >
            Select All
          </label>
        </Button>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            disabled
            onClick={handleExport}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span className="md:block hidden">Export</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={selectedMessages.length === 0 || bulkDeleteMutation.isPending}
            className="flex items-center space-x-2"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
            <span className="md:block font-medium hidden">{bulkDeleteMutation.isPending ? "Deleting..." : "Delete"}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled
            onClick={handleImport}
            className="flex items-center space-x-2"
          >
            <Upload className="h-4 w-4" />
            <span className="md:block hidden">Import</span>
          </Button>
        </div>
      </div>
      <div className="h-50 overflow-y-auto">
        {messages.length > 0 ? (
          <table className="w-full">
            <tbody className="divide-y divide-border">
              {messages.map((message, index) => (
                <tr
                  key={message.id}
                  className="hover:bg-accent/50 transition-colors"
                >
                  <td className="py-2 px-4" colSpan={2}>
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id={`message-${message.id}`}
                        checked={selectedMessages.includes(message.id)}
                        onCheckedChange={() => handleMessageSelect(message.id)}
                      />
                      <label
                        htmlFor={`message-${message.id}`}
                        className="text-sm font-medium text-foreground cursor-pointer"
                      >
                        {message.title}
                      </label>
                    </div>
                  </td>
                  <td className="py-2 px-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {message.isPinned && (
                        <TbPinFilled className="h-4 w-4 text-pink-500 flex-shrink-0" />
                      )}
                      <span className="text-sm text-muted-foreground">
                        {message.timestamp}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <div className="mb-2">No message history found</div>
            <div className="text-sm">
              Start chatting to see your conversation history here
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Threads</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedMessages.length} thread{selectedMessages.length > 1 ? 's' : ''}? 
              This action cannot be undone and will permanently delete all messages in the selected thread{selectedMessages.length > 1 ? 's' : ''}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={bulkDeleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmDelete}
              disabled={bulkDeleteMutation.isPending}
            >
              {bulkDeleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MessageHistory;
