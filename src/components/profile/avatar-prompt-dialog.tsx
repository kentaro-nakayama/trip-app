"use client";

import { useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { extractErrorMessage } from "@/lib/utils";

async function markAvatarPromptSeen() {
  const res = await fetch("/api/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ avatarPromptSeen: true }),
  });
  if (!res.ok) throw new Error(await extractErrorMessage(res, "処理に失敗しました"));
}

export function AvatarPromptDialog({ open }: { open: boolean }) {
  const { user } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const setImageMutation = useMutation({
    mutationFn: async () => {
      if (!file || !user) return;
      await user.setProfileImage({ file });
      await markAvatarPromptSeen();
    },
    onSuccess: async () => {
      await user?.reload();
      toast.success("プロフィール画像を設定しました");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "画像の設定に失敗しました"),
  });

  const skipMutation = useMutation({
    mutationFn: markAvatarPromptSeen,
    onSuccess: async () => {
      await user?.reload();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "処理に失敗しました"),
  });

  const isPending = setImageMutation.isPending || skipMutation.isPending;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  }

  return (
    <Dialog open={open} onOpenChange={() => {}} disablePointerDismissal>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>プロフィール画像を設定しますか？</DialogTitle>
          <DialogDescription>
            旅行のメンバー一覧などで表示される画像です。あとからいつでも変更できます。スキップした場合はデフォルトの画像が使われます。
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-3 py-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-dashed border-zinc-300 transition-colors hover:border-[rgb(77,71,213)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- user-picked local file preview / external Clerk avatar URL */}
            <img
              src={previewUrl ?? user?.imageUrl ?? ""}
              alt=""
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/30 group-hover:opacity-100">
              <Upload className="h-6 w-6 text-white" />
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isPending}
          >
            画像を選択
          </Button>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => skipMutation.mutate()}
            disabled={isPending}
          >
            {skipMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            スキップ
          </Button>
          <Button
            type="button"
            onClick={() => setImageMutation.mutate()}
            disabled={!file || isPending}
          >
            {setImageMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            設定する
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
