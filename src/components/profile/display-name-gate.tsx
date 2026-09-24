"use client";

import { useUser } from "@clerk/nextjs";
import { DisplayNameDialog } from "./display-name-dialog";

/** Forces every signed-in user to set an in-app display name before using the app. */
export function DisplayNameGate() {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded || !isSignedIn) return null;
  if (user.publicMetadata.displayName?.trim()) return null;

  return <DisplayNameDialog open onOpenChange={() => {}} dismissible={false} />;
}
