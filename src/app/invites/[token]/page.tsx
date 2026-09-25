import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { invites, spotListInvites, spotLists, trips } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { acceptInvite, acceptSpotListInvite } from "./actions";

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const { error } = await searchParams;

  const db = getDb();
  const [tripInvite] = await db.select().from(invites).where(eq(invites.token, token)).limit(1);
  const [spotListInvite] = tripInvite
    ? []
    : await db.select().from(spotListInvites).where(eq(spotListInvites.token, token)).limit(1);

  const invite = tripInvite ?? spotListInvite;

  if (!invite || invite.status !== "pending" || invite.expiresAt < new Date() || error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-xl font-semibold">この招待リンクは無効です</h1>
        <p className="text-zinc-500">
          リンクの有効期限が切れているか、すでに使用されています。招待した人に再送を依頼してください。
        </p>
      </div>
    );
  }

  if (tripInvite) {
    const [trip] = await db.select().from(trips).where(eq(trips.id, tripInvite.tripId)).limit(1);

    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold">
            「{trip?.name}」に招待されています
          </h1>
          <p className="text-zinc-500">参加すると、この旅行の行程を一緒に編集できます。</p>
        </div>
        <form action={acceptInvite.bind(null, token)}>
          <Button type="submit" size="lg">
            招待を受け入れる
          </Button>
        </form>
      </div>
    );
  }

  const [spotList] = await db
    .select()
    .from(spotLists)
    .where(eq(spotLists.id, spotListInvite!.spotListId))
    .limit(1);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold">
          「{spotList?.name}」に招待されています
        </h1>
        <p className="text-zinc-500">参加すると、このスポットリストを一緒に編集できます。</p>
      </div>
      <form action={acceptSpotListInvite.bind(null, token)}>
        <Button type="submit" size="lg">
          招待を受け入れる
        </Button>
      </form>
    </div>
  );
}
