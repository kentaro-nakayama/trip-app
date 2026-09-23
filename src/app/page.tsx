import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const { userId } = await auth();
  if (userId) redirect("/trips");

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 bg-zinc-50 px-6 py-24 text-center dark:bg-black">
      <div className="flex max-w-xl flex-col gap-4">
        <h1 className="text-4xl font-semibold tracking-tight">TripPlan</h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          スポットを検索して保存し、行程を並べ替え、地図で確認しながらみんなで旅行の計画を立てられます。
        </p>
      </div>
      <div className="flex gap-4">
        <Button size="lg" nativeButton={false} render={<Link href="/sign-up" />}>
          はじめる
        </Button>
        <Button
          size="lg"
          variant="outline"
          nativeButton={false}
          render={<Link href="/sign-in" />}
        >
          ログイン
        </Button>
      </div>
    </div>
  );
}
