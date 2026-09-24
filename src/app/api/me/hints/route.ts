import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";

const markHintSeenSchema = z.object({
  hintId: z.string().trim().min(1).max(100),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = markHintSeenSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const client = await clerkClient();
  const current = await client.users.getUser(userId);
  const seenHints = new Set(current.publicMetadata.seenHints ?? []);
  seenHints.add(parsed.data.hintId);

  const user = await client.users.updateUserMetadata(userId, {
    publicMetadata: { seenHints: Array.from(seenHints) },
  });

  return NextResponse.json({ seenHints: user.publicMetadata.seenHints ?? [] });
}
