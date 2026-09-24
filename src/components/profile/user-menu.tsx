"use client";

import { useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { UserRoundPen } from "lucide-react";
import { DisplayNameDialog } from "./display-name-dialog";

export function UserMenu() {
  const [nameDialogOpen, setNameDialogOpen] = useState(false);

  return (
    <>
      <div className="inline-flex rounded-full shadow-[0_1px_2px_rgba(24,24,27,0.06),0_4px_10px_rgba(24,24,27,0.07)]">
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
