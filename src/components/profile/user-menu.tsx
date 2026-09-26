"use client";

import { useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { UserRoundPen } from "lucide-react";
import { CREATE_BUTTON_GLOW } from "@/lib/card-glow";
import { cn } from "@/lib/utils";
import { DisplayNameDialog } from "./display-name-dialog";

export function UserMenu() {
  const [nameDialogOpen, setNameDialogOpen] = useState(false);

  return (
    <>
      <div className={cn("inline-flex rounded-full", CREATE_BUTTON_GLOW)}>
        <UserButton>
          <UserButton.MenuItems>
            <UserButton.Action
              label="表示名を変更"
              labelIcon={<UserRoundPen className="h-4 w-4" />}
              onClick={() => setNameDialogOpen(true)}
            />
          </UserButton.MenuItems>
        </UserButton>
      </div>
      <DisplayNameDialog open={nameDialogOpen} onOpenChange={setNameDialogOpen} dismissible />
    </>
  );
}
