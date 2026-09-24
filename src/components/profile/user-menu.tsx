"use client";

import { useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { UserRoundPen } from "lucide-react";
import { DisplayNameDialog } from "./display-name-dialog";

export function UserMenu() {
  const [nameDialogOpen, setNameDialogOpen] = useState(false);

  return (
    <>
      <UserButton>
        <UserButton.MenuItems>
          <UserButton.Action
            label="表示名を変更"
            labelIcon={<UserRoundPen className="h-4 w-4" />}
            onClick={() => setNameDialogOpen(true)}
          />
        </UserButton.MenuItems>
      </UserButton>
      <DisplayNameDialog open={nameDialogOpen} onOpenChange={setNameDialogOpen} dismissible />
    </>
  );
}
