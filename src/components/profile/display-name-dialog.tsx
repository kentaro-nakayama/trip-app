"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { extractErrorMessage } from "@/lib/utils";

export function DisplayNameDialog({
  open,
  onOpenChange,
  dismissible,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dismissible: boolean;
}) {
  const { user } = useUser();
  const [name, setName] = useState(user?.publicMetadata.displayName ?? "");
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setName(user?.publicMetadata.displayName ?? "");
  }

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: name.trim() }),
      });
      if (!res.ok) throw new Error(await extractErrorMessage(res, "表示名の更新に失敗しました"));
    },
    onSuccess: async () => {
      await user?.reload();
      toast.success("表示名を保存しました");
      onOpenChange(false);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "表示名の更新に失敗しました"),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={dismissible ? onOpenChange : () => {}}
      disablePointerDismissal={!dismissible}
    >
      <DialogContent showCloseButton={dismissible}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            mutation.mutate();
          }}
        >
          <DialogHeader>
            <DialogTitle>{dismissible ? "表示名を変更" : "表示名を設定してください"}</DialogTitle>
            <DialogDescription>
              {dismissible
                ? "旅行のメンバー一覧などで表示される名前です。"
                : "はじめてのご利用ありがとうございます。旅行のメンバー一覧などで表示する名前を設定してください。"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            <Label htmlFor="display-name-input">表示名</Label>
            <Input
              id="display-name-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: たろう"
              maxLength={50}
              autoFocus
              required
            />
          </div>
          <DialogFooter>
            {dismissible && (
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                キャンセル
              </Button>
            )}
            <Button type="submit" disabled={!name.trim() || mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              保存する
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
