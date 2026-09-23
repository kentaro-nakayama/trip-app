"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { invites, tripMembers } from "@/db/schema";

export async function acceptInvite(token: string) {
  const { userId } = await auth();
  if (!userId) redirect(`/sign-in?redirect_url=/invites/${token}`);

  const db = getDb();
  const [invite] = await db
    .select()
    .from(invites)
    .where(and(eq(invites.token, token), eq(invites.status, "pending")))
    .limit(1);

  if (!invite || invite.expiresAt < new Date()) {
    redirect(`/invites/${token}?error=expired`);
  }

  await db
    .insert(tripMembers)
    .values({ tripId: invite.tripId, userId, role: invite.role })
    .onConflictDoNothing();

  await db.update(invites).set({ status: "accepted" }).where(eq(invites.id, invite.id));

  redirect(`/trips/${invite.tripId}`);
}
