"use client";

import { useMemo, useState } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { toast } from "sonner";
import { ChevronLeft, Loader2, MapPin, Type } from "lucide-react";
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
import type { TravelMode } from "@/lib/travel-mode";
import { TravelModeSelect } from "./travel-mode-select";

export type AddressSpotSelection = {
  name: string;
  address: string;
  lat: number;
  lng: number;
  notes?: string;
  travelMode?: TravelMode | null;
};

type Mode = "choose" | "address";

export function CustomSpotDialog({
  disabled,
  hasPreviousItem,
  onChooseMapClick,
  onAddressSelect,
}: {
  disabled?: boolean;
  hasPreviousItem: boolean;
  onChooseMapClick: () => void;
  onAddressSelect: (input: AddressSpotSelection) => Promise<void> | void;
}) {
  const geocodingLib = useMapsLibrary("geocoding");
  const geocoder = useMemo(
    () => (geocodingLib ? new geocodingLib.Geocoder() : null),
    [geocodingLib],
  );

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("choose");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [travelMode, setTravelMode] = useState<TravelMode>("driving");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function reset() {
    setMode("choose");
    setName("");
    setAddress("");
    setNotes("");
    setTravelMode("driving");
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

      await onAddressSelect({
        name: name.trim() || result.formatted_address,
        address: result.formatted_address,
        lat: result.geometry.location.lat(),
        lng: result.geometry.location.lng(),
        notes: notes.trim() || undefined,
        travelMode: hasPreviousItem ? travelMode : null,
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
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            className="text-[16px] md:text-[0.8rem]"
          />
        }
      >
        自分でスポットを追加
      </DialogTrigger>
      <DialogContent>
        {mode === "choose" ? (
          <>
            <DialogHeader>
              <DialogTitle>スポットの追加方法を選択</DialogTitle>
              <DialogDescription>
                Google検索に出てこない場所でも、地図上の位置を指定して追加できます。
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2 py-2">
              <Button
                type="button"
                variant="outline"
                className="h-auto justify-start gap-3 py-3"
                onClick={() => {
                  onChooseMapClick();
                  setOpen(false);
                }}
              >
                <MapPin className="h-5 w-5 shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-medium">地図をクリックして選択</p>
                  <p className="text-xs font-normal text-zinc-500">
                    地図上の好きな場所をクリックして位置を指定します
                  </p>
                </div>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-auto justify-start gap-3 py-3"
                onClick={() => setMode("address")}
              >
                <Type className="h-5 w-5 shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-medium">住所を入力</p>
                  <p className="text-xs font-normal text-zinc-500">
                    住所を入力して位置を検索します
                  </p>
                </div>
              </Button>
            </div>
          </>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            <DialogHeader>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="-ml-2 h-7 w-7"
                  onClick={() => setMode("choose")}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <DialogTitle>住所からスポットを追加</DialogTitle>
              </div>
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
              {hasPreviousItem && (
                <TravelModeSelect value={travelMode} onChange={setTravelMode} />
              )}
            </div>
            <DialogFooter>
              <Button type="submit" disabled={!address.trim() || !geocoder || isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                追加する
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
