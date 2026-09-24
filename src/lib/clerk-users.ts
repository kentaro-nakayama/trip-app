import "server-only";
import { clerkClient } from "@clerk/nextjs/server";

export type ResolvedUser = {
  userId: string;
  name: string;
  email: string | null;
  imageUrl: string;
};

/** Batch-resolves Clerk user IDs to display info (name/email/avatar). */
export async function resolveUsers(userIds: string[]): Promise<Map<string, ResolvedUser>> {
  const uniqueIds = [...new Set(userIds)];
  const map = new Map<string, ResolvedUser>();
  if (uniqueIds.length === 0) return map;

  const client = await clerkClient();
  const { data } = await client.users.getUserList({ userId: uniqueIds, limit: 100 });

  for (const user of data) {
    const primaryEmail =
      user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ??
      user.emailAddresses[0]?.emailAddress ??
      null;
    const name =
      user.publicMetadata.displayName ||
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      primaryEmail ||
      "不明なユーザー";
    map.set(user.id, { userId: user.id, name, email: primaryEmail, imageUrl: user.imageUrl });
  }

  return map;
}
