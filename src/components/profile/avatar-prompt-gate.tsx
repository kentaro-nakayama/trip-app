"use client";

import { useUser } from "@clerk/nextjs";
import { AvatarPromptDialog } from "./avatar-prompt-dialog";

/** Offers every signed-in user a chance to set a profile picture, once, right after they set their display name. */
export function AvatarPromptGate() {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded || !isSignedIn) return null;
  if (!user.publicMetadata.displayName?.trim()) return null;
  if (user.publicMetadata.avatarPromptSeen) return null;

  return <AvatarPromptDialog open />;
}
