"use client";

import { useMemo, useState } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
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
import { Textarea } from "@/components/ui/textarea";

export type AddressSpotSelection = {
  name: string;
  address: string;
  lat: number;
  lng: number;
  notes?: string;
};

export function AddressSpotDialog({
  disabled,
  onSelect,
}: {
  disabled?: boolean;
  onSelect: (input: AddressSpotSelection) => Promise<void> | void;
}) {
  const geocodingLib = useMapsLibrary("geocoding");
  const geocoder = useMemo(
    () => (geocodingLib ? new geocodingLib.Geocoder() : null),
    [geocodingLib],
  );

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function reset() {
    setName("");
    setAddress("");
    setNotes("");
  }

  async function handleSubmit() {
    if (!geocoder || !address.trim()) return;

    setIsSubmitting(true);
    try {
      const { results } = await geocoder.geocode({ address });
      const result = results[0];
      if (!result) {
        toast.error("住所が見つかりませんでした");
        return;
      }

      await onSelect({
        name: name.trim() || result.formatted_address,
        address: result.formatted_address,
        lat: result.geometry.location.lat(),
        lng: result.geometry.location.lng(),
        notes: notes.trim() || undefined,
      });

      reset();
      setOpen(false);
    } catch {
      toast.error("住所の検索に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger render={<Button variant="outline" size="sm" disabled={disabled} />}>
        住所を入力して追加
      </DialogTrigger>
      <DialogContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <DialogHeader>
            <DialogTitle>住所からスポットを追加</DialogTitle>
            <DialogDescription>
              Google検索に出てこない場所でも、住所が分かれば地図上に配置できます。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="address-spot-address">住所</Label>
              <Input
                id="address-spot-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="例: 広島県広島市中区中島町1-2"
                required
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address-spot-name">スポット名（任意）</Label>
              <Input
                id="address-spot-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="空欄の場合は住所から自動設定されます"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address-spot-notes">メモ（任意）</Label>
              <Textarea
                id="address-spot-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="このスポットについてのメモ"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!address.trim() || !geocoder || isSubmitting}>
              追加する
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
