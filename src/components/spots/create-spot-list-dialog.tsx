"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { extractErrorMessage } from "@/lib/utils";
import type { SpotListSummary } from "@/lib/types";

export function CreateSpotListDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const router = useRouter();

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/spot-lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description: description || undefined }),
      });
      if (!res.ok) throw new Error(await extractErrorMessage(res, "スポットリストの作成に失敗しました"));
      return (await res.json()) as SpotListSummary;
    },
    onSuccess: (spotList) => {
      setOpen(false);
      setName("");
      setDescription("");
      toast.success("スポットリストを作成しました");
      router.push(`/spots/${spotList.id}`);
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "スポットリストの作成に失敗しました"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>新しいスポットリストを作成</DialogTrigger>
      <DialogContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            mutate();
          }}
        >
          <DialogHeader>
            <DialogTitle>新しいスポットリストを作成</DialogTitle>
            <DialogDescription>
              名前を入力してください。スポットは後から追加できます。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="spot-list-name">リスト名</Label>
              <Input
                id="spot-list-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例: 行きたいカフェ"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="spot-list-description">メモ</Label>
              <Textarea
                id="spot-list-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="任意"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              作成する
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
