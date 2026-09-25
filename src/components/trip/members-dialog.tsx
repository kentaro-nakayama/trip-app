"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Crown, Loader2, Users, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { Separator } from "@/components/ui/separator";
import { extractErrorMessage } from "@/lib/utils";

type Member = {
  id: string;
  userId: string;
  role: "owner" | "editor" | "viewer";
  name: string;
  email: string | null;
  imageUrl: string | null;
};

const roleLabel: Record<Member["role"], string> = {
  owner: "オーナー",
  editor: "編集できる",
  viewer: "閲覧のみ",
};

type ResourceType = "trips" | "spot-lists";

function MemberRow({
  member,
  isOwner,
  resourceType,
  resourceId,
  resourceLabel,
}: {
  member: Member;
  isOwner: boolean;
  resourceType: ResourceType;
  resourceId: string;
  resourceLabel: string;
}) {
  const queryClient = useQueryClient();
  const queryKey = [`${resourceType}-members`, resourceId];
  const [removeOpen, setRemoveOpen] = useState(false);

  const updateRole = useMutation({
    mutationFn: async (role: "editor" | "viewer") => {
      const res = await fetch(`/api/${resourceType}/${resourceId}/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error(await extractErrorMessage(res, "権限の変更に失敗しました"));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("権限を変更しました");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "権限の変更に失敗しました"),
  });

  const removeMember = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/${resourceType}/${resourceId}/members/${member.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(await extractErrorMessage(res, "削除に失敗しました"));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setRemoveOpen(false);
      toast.success("メンバーを削除しました");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "削除に失敗しました"),
  });

  return (
    <div className="flex min-w-0 items-center gap-3 py-2">
      {member.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- external Clerk avatar URL
        <img src={member.imageUrl} alt="" className="h-8 w-8 shrink-0 rounded-full" />
      ) : (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
          {member.name.slice(0, 1)}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{member.name}</p>
        {member.email && (
          <p className="truncate text-xs text-zinc-500">{member.email}</p>
        )}
      </div>

      {member.role === "owner" ? (
        <span className="flex shrink-0 items-center gap-1 text-xs text-zinc-500">
          <Crown className="h-3.5 w-3.5" />
          {roleLabel.owner}
        </span>
      ) : isOwner ? (
        <div className="flex shrink-0 items-center gap-1">
          <Select
            value={member.role}
            onValueChange={(v) => updateRole.mutate(v as "editor" | "viewer")}
          >
            <SelectTrigger className="h-8 w-[7.5rem]" disabled={updateRole.isPending}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="editor">編集できる</SelectItem>
              <SelectItem value="viewer">閲覧のみ</SelectItem>
            </SelectContent>
          </Select>
          <AlertDialog open={removeOpen} onOpenChange={setRemoveOpen}>
            <AlertDialogTrigger
              render={<Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" />}
            >
              <X className="h-4 w-4" />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>「{member.name}」を削除しますか？</AlertDialogTitle>
                <AlertDialogDescription>
                  この{resourceLabel}のメンバーから削除します。再度参加するには招待リンクが必要です。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => removeMember.mutate()}
                  disabled={removeMember.isPending}
                  className="bg-destructive text-white hover:bg-destructive/90"
                >
                  {removeMember.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  削除する
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ) : (
        <span className="shrink-0 text-xs text-zinc-500">{roleLabel[member.role]}</span>
      )}
    </div>
  );
}

export function MembersDialog({
  resourceType,
  resourceId,
  resourceLabel = "旅行",
  myRole,
}: {
  resourceType?: ResourceType;
  resourceId: string;
  resourceLabel?: string;
  myRole: "owner" | "editor" | "viewer";
}) {
  const type: ResourceType = resourceType ?? "trips";
  const [open, setOpen] = useState(false);
  const [inviteRole, setInviteRole] = useState<"editor" | "viewer">("editor");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const isOwner = myRole === "owner";

  const { data: members, isLoading } = useQuery({
    queryKey: [`${type}-members`, resourceId],
    queryFn: async (): Promise<Member[]> => {
      const res = await fetch(`/api/${type}/${resourceId}/members`);
      if (!res.ok) throw new Error("メンバーの取得に失敗しました");
      return res.json();
    },
    enabled: open,
  });

  const createInvite = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/${type}/${resourceId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: inviteRole }),
      });
      if (!res.ok) throw new Error(await extractErrorMessage(res, "招待の作成に失敗しました"));
      return (await res.json()) as { token: string };
    },
    onSuccess: (invite) => {
      setInviteLink(`${window.location.origin}/invites/${invite.token}`);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "招待の作成に失敗しました"),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setInviteLink(null);
      }}
    >
      <DialogTrigger render={<Button variant="outline" />}>
        <Users className="h-4 w-4" />
        メンバー
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>メンバー</DialogTitle>
        </DialogHeader>

        <div className="min-w-0">
          {isLoading && (
            <p className="flex items-center gap-2 py-2 text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              読み込み中...
            </p>
          )}
          {members?.map((member) => (
            <MemberRow
              key={member.id}
              member={member}
              isOwner={isOwner}
              resourceType={type}
              resourceId={resourceId}
              resourceLabel={resourceLabel}
            />
          ))}
        </div>

        {myRole !== "viewer" && (
          <>
            <Separator />

            <div>
              <DialogDescription className="mb-2">
                招待リンクを発行して、LINEなどで共有したい相手に送ってください。
              </DialogDescription>

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
                    createInvite.mutate();
                  }}
                >
                  <div className="grid gap-4 pb-4">
                    <div className="grid gap-2">
                      <Label>権限</Label>
                      <Select
                        value={inviteRole}
                        onValueChange={(v) => setInviteRole(v as "editor" | "viewer")}
                      >
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
                    <Button type="submit" disabled={createInvite.isPending}>
                      {createInvite.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                      招待リンクを発行
                    </Button>
                  </DialogFooter>
                </form>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
