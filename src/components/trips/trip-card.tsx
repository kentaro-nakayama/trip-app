"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
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
  const [open, setOpen] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/trips/${trip.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("failed");
    },
    onSuccess: () => {
      setOpen(false);
      router.refresh();
    },
    onError: () => toast.error("旅行の削除に失敗しました"),
  });

  return (
    <div className="relative">
      <Link href={`/trips/${trip.id}`}>
        <Card className="h-full transition-colors hover:border-zinc-400">
          <CardHeader>
            <CardTitle className="pr-8">{trip.name}</CardTitle>
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

      {trip.role === "owner" && (
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-3 right-3 h-7 w-7 text-zinc-400 hover:text-destructive"
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
                onClick={() => mutate()}
                disabled={isPending}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                削除する
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
