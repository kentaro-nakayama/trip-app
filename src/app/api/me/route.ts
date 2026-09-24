import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";

const updateMeSchema = z
  .object({
    displayName: z.string().trim().min(1).max(50).optional(),
    avatarPromptSeen: z.literal(true).optional(),
  })
  .refine((data) => data.displayName !== undefined || data.avatarPromptSeen !== undefined, {
    message: "更新する項目を指定してください",
  });

export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = updateMeSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const publicMetadata: { displayName?: string; avatarPromptSeen?: true } = {};
  if (parsed.data.displayName !== undefined) publicMetadata.displayName = parsed.data.displayName;
  if (parsed.data.avatarPromptSeen !== undefined) {
    publicMetadata.avatarPromptSeen = parsed.data.avatarPromptSeen;
  }

  const client = await clerkClient();
  const user = await client.users.updateUserMetadata(userId, { publicMetadata });

  return NextResponse.json({
    displayName: user.publicMetadata.displayName ?? null,
    avatarPromptSeen: user.publicMetadata.avatarPromptSeen ?? false,
  });
}
