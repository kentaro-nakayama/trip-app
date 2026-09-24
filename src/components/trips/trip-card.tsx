"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Pencil, Trash2 } from "lucide-react";
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
import { cn, extractErrorMessage } from "@/lib/utils";

export type TripCardData = {
  id: string;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  role: "owner" | "editor" | "viewer";
  members: { id: string; name: string; imageUrl: string }[];
};

export function TripCard({ trip, accent }: { trip: TripCardData; accent: string }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [name, setName] = useState(trip.name);
  const [description, setDescription] = useState(trip.description ?? "");
  const [startDate, setStartDate] = useState(trip.startDate ?? "");
  const [endDate, setEndDate] = useState(trip.endDate ?? "");

  const canEdit = trip.role === "owner" || trip.role === "editor";

  const editMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/trips/${trip.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description.trim() || null,
          startDate: startDate || null,
          endDate: endDate || null,
        }),
      });
      if (!res.ok) throw new Error(await extractErrorMessage(res, "旅行の更新に失敗しました"));
    },
    onSuccess: () => {
      setEditOpen(false);
      router.refresh();
      toast.success("旅行を更新しました");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "旅行の更新に失敗しました"),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/trips/${trip.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await extractErrorMessage(res, "旅行の削除に失敗しました"));
    },
    onSuccess: () => {
      setDeleteOpen(false);
      router.refresh();
      toast.success("旅行を削除しました");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "旅行の削除に失敗しました"),
  });

  return (
    <div className="relative">
      <Link href={`/trips/${trip.id}`}>
        <Card
          className={cn(
            "h-full transition-all duration-150 hover:-translate-y-0.5",
            accent,
          )}
        >
          <CardHeader>
            <CardTitle className="pr-16">{trip.name}</CardTitle>
            <CardDescription
              className={cn(!trip.startDate && !trip.endDate && "invisible")}
            >
              {trip.startDate ?? "?"} 〜 {trip.endDate ?? "?"}
            </CardDescription>
            <CardDescription
              className={cn("line-clamp-1", !trip.description && "invisible")}
            >
              {trip.description || " "}
            </CardDescription>
          </CardHeader>
          {trip.members.length > 0 && (
            <CardFooter className="justify-between">
              <div className="flex -space-x-2">
                {trip.members.slice(0, 4).map((member) => (
                  // eslint-disable-next-line @next/next/no-img-element -- external Clerk avatar URL
                  <img
                    key={member.id}
                    src={member.imageUrl}
                    alt={member.name}
                    title={member.name}
                    className="h-6 w-6 rounded-full border-2 border-white object-cover dark:border-zinc-900"
                  />
                ))}
                {trip.members.length > 4 && (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-zinc-200 text-[10px] font-medium text-zinc-600 dark:border-zinc-900 dark:bg-zinc-700 dark:text-zinc-300">
                    +{trip.members.length - 4}
                  </span>
                )}
              </div>
              <span className="text-xs text-zinc-500">{trip.members.length}人が参加</span>
            </CardFooter>
          )}
        </Card>
      </Link>

      <div className="absolute top-2 right-2 flex items-center gap-0.5">
        {canEdit && (
          <Dialog
            open={editOpen}
            onOpenChange={(next) => {
              setEditOpen(next);
              if (next) {
                setName(trip.name);
                setDescription(trip.description ?? "");
                setStartDate(trip.startDate ?? "");
                setEndDate(trip.endDate ?? "");
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
                  <DialogTitle>旅行を編集</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor={`edit-trip-name-${trip.id}`}>旅行名</Label>
                    <Input
                      id={`edit-trip-name-${trip.id}`}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`edit-trip-description-${trip.id}`}>メモ</Label>
                    <Textarea
                      id={`edit-trip-description-${trip.id}`}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="任意"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor={`edit-trip-start-${trip.id}`}>開始日</Label>
                      <Input
                        id={`edit-trip-start-${trip.id}`}
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor={`edit-trip-end-${trip.id}`}>終了日</Label>
                      <Input
                        id={`edit-trip-end-${trip.id}`}
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
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

        {trip.role === "owner" && (
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
                <AlertDialogTitle>「{trip.name}」を削除しますか？</AlertDialogTitle>
                <AlertDialogDescription>
                  行程・スポット・招待リンクなど、この旅行のすべてのデータが削除されます。この操作は取り消せません。
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
