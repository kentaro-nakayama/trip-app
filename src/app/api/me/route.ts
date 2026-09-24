import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";

const updateMeSchema = z.object({
  displayName: z.string().trim().min(1).max(50),
});

export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = updateMeSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const client = await clerkClient();
  const user = await client.users.updateUserMetadata(userId, {
    publicMetadata: { displayName: parsed.data.displayName },
  });

  return NextResponse.json({ displayName: user.publicMetadata.displayName ?? null });
}
