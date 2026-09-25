"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, MapPin, Pencil, Trash2 } from "lucide-react";
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
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CARD_GLOW } from "@/lib/card-glow";
import { cn, extractErrorMessage } from "@/lib/utils";
import type { SpotListSummary } from "@/lib/types";

export type SpotListCardData = SpotListSummary & {
  role: "owner" | "editor" | "viewer";
  members: { id: string; name: string; imageUrl: string }[];
};

export function SpotListCard({ spotList }: { spotList: SpotListCardData }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [name, setName] = useState(spotList.name);
  const [description, setDescription] = useState(spotList.description ?? "");

  const canEdit = spotList.role === "owner" || spotList.role === "editor";

  const editMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/spot-lists/${spotList.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description: description.trim() || null }),
      });
      if (!res.ok) throw new Error(await extractErrorMessage(res, "スポットリストの更新に失敗しました"));
    },
    onSuccess: () => {
      setEditOpen(false);
      router.refresh();
      toast.success("スポットリストを更新しました");
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "スポットリストの更新に失敗しました"),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/spot-lists/${spotList.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await extractErrorMessage(res, "スポットリストの削除に失敗しました"));
    },
    onSuccess: () => {
      setDeleteOpen(false);
      router.refresh();
      toast.success("スポットリストを削除しました");
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "スポットリストの削除に失敗しました"),
  });

  return (
    <div className="relative">
      <Link href={`/spots/${spotList.id}`}>
        <Card className={cn("h-full transition-all duration-150 hover:-translate-y-0.5", CARD_GLOW)}>
          <CardHeader>
            <CardTitle className="mb-1 pr-16 font-semibold">{spotList.name}</CardTitle>
            <CardDescription className={cn("line-clamp-1", !spotList.description && "invisible")}>
              {spotList.description || " "}
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-between">
            <span className="flex items-center gap-1 text-xs text-zinc-500">
              <MapPin className="h-3.5 w-3.5" />
              {spotList.spotCount}件のスポット
            </span>
            {spotList.members.length > 0 && (
              <div className="flex -space-x-2">
                {spotList.members.slice(0, 4).map((member) => (
                  // eslint-disable-next-line @next/next/no-img-element -- external Clerk avatar URL
                  <img
                    key={member.id}
                    src={member.imageUrl}
                    alt={member.name}
                    title={member.name}
                    className="h-6 w-6 rounded-full border-2 border-white object-cover dark:border-zinc-900"
                  />
                ))}
                {spotList.members.length > 4 && (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-zinc-200 text-[10px] font-medium text-zinc-600 dark:border-zinc-900 dark:bg-zinc-700 dark:text-zinc-300">
                    +{spotList.members.length - 4}
                  </span>
                )}
              </div>
            )}
          </CardFooter>
        </Card>
      </Link>

      <div className="absolute top-2 right-2 flex items-center gap-0.5">
        {canEdit && (
        <Dialog
          open={editOpen}
          onOpenChange={(next) => {
            setEditOpen(next);
            if (next) {
              setName(spotList.name);
              setDescription(spotList.description ?? "");
            }
          }}
        >
          <DialogTrigger
            render={
              <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400" />
            }
          >
            <Pencil className="h-4 w-4" />
          </DialogTrigger>
          <DialogContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!name.trim()) return;
                editMutation.mutate();
              }}
            >
              <DialogHeader>
                <DialogTitle>スポットリストを編集</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor={`edit-spot-list-name-${spotList.id}`}>リスト名</Label>
                  <Input
                    id={`edit-spot-list-name-${spotList.id}`}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor={`edit-spot-list-description-${spotList.id}`}>メモ</Label>
                  <Textarea
                    id={`edit-spot-list-description-${spotList.id}`}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="任意"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={!name.trim() || editMutation.isPending}>
                  {editMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  保存する
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        )}

        {spotList.role === "owner" && (
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-zinc-400 hover:text-destructive"
              />
            }
          >
            <Trash2 className="h-4 w-4" />
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>「{spotList.name}」を削除しますか？</AlertDialogTitle>
              <AlertDialogDescription>
                このリストに保存したスポットもすべて削除されます。この操作は取り消せません。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>キャンセル</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                削除する
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        )}
      </div>
    </div>
  );
}
