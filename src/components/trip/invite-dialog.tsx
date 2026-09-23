"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function InviteDialog({ tripId }: { tripId: string }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"editor" | "viewer">("editor");
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/trips/${tripId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      if (!res.ok) throw new Error("招待の作成に失敗しました");
      return (await res.json()) as { token: string };
    },
    onSuccess: (invite) => {
      setInviteLink(`${window.location.origin}/invites/${invite.token}`);
    },
    onError: () => toast.error("招待の作成に失敗しました"),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setEmail("");
          setInviteLink(null);
        }
      }}
    >
      <DialogTrigger render={<Button variant="outline" />}>
        メンバーを招待
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>メンバーを招待</DialogTitle>
          <DialogDescription>
            招待リンクを発行して、共有したい相手に送ってください。
          </DialogDescription>
        </DialogHeader>

        {inviteLink ? (
          <div className="flex flex-col gap-2">
            <Label>招待リンク</Label>
            <div className="flex gap-2">
              <Input readOnly value={inviteLink} />
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  navigator.clipboard.writeText(inviteLink);
                  toast.success("コピーしました");
                }}
              >
                コピー
              </Button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!email.trim()) return;
              mutate();
            }}
          >
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="invite-email">メールアドレス</Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@example.com"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>権限</Label>
                <Select value={role} onValueChange={(v) => setRole(v as "editor" | "viewer")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="editor">編集できる</SelectItem>
                    <SelectItem value="viewer">閲覧のみ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isPending || !email.trim()}>
                招待リンクを発行
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
