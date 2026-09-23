"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
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
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

export type TripCardData = {
  id: string;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  role: "owner" | "editor" | "viewer";
};

export function TripCard({ trip }: { trip: TripCardData }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [name, setName] = useState(trip.name);
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
          startDate: startDate || null,
          endDate: endDate || null,
        }),
      });
      if (!res.ok) throw new Error("failed");
    },
    onSuccess: () => {
      setEditOpen(false);
      router.refresh();
    },
    onError: () => toast.error("旅行の更新に失敗しました"),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/trips/${trip.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("failed");
    },
    onSuccess: () => {
      setDeleteOpen(false);
      router.refresh();
    },
    onError: () => toast.error("旅行の削除に失敗しました"),
  });

  return (
    <div className="relative">
      <Link href={`/trips/${trip.id}`}>
        <Card className="h-full transition-colors hover:border-zinc-400">
          <CardHeader>
            <CardTitle className="pr-16">{trip.name}</CardTitle>
            {(trip.startDate || trip.endDate) && (
              <CardDescription>
                {trip.startDate ?? "?"} 〜 {trip.endDate ?? "?"}
              </CardDescription>
            )}
            {trip.description && (
              <CardDescription className="line-clamp-2">{trip.description}</CardDescription>
            )}
          </CardHeader>
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
