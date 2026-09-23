@AGENTS.md

# CLAUDE.md

このファイルは、このリポジトリ（trip-app）で作業する Claude Code 向けのプロジェクト仕様書です。

## プロジェクト概要

旅行の日程を管理するWebアプリ。行きたいスポットをGoogleマップなどから検索して保存したり、独自の目的地を設定できる。旅行の行程画面では中央にGoogleマップを表示し、行程で決めた順番にピンを立てる。一緒に行くメンバーを招待して共同編集できる。

## 主要機能

- **スポット検索・保存**: Google Places APIでスポットを検索し、旅行に保存する
- **独自目的地の登録**: Google検索にヒットしない場所も、緯度経度や住所を手入力で登録できる
- **行程（イティネラリー）管理**: 日ごとに訪問するスポットを並び替えて順序を決める
- **地図表示**: 行程画面の中央にGoogleマップを表示し、決めた順番どおりにピンを配置する（ルート線の表示も想定）
- **メンバー招待・共同編集**: 旅行に他のユーザーを招待し、複数人で行程を編集できる
  - 共同編集は**非同期**でよい（同時カーソル表示などのリアルタイム性は不要）。保存→再取得で他メンバーに反映される形で十分
- **オフライン対応**: 現時点では不要（オンライン前提でまず作る）

## 技術スタック

| レイヤー | 技術 |
|---|---|
| フレームワーク | Next.js (App Router) + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| 地図 | Google Maps Platform（Maps JavaScript API + Places API + Geocoding API）、`@vis.gl/react-google-maps` |
| DB | Neon Postgres（Vercel Marketplace経由で自動プロビジョニング）+ Drizzle ORM |
| 認証 | Clerk（Vercel Marketplace）— メール/Google OAuthログイン、招待フロー |
| データ取得/キャッシュ | TanStack Query |
| ホスティング | Vercel |

### 技術選定の経緯・補足

- **DB**: MySQLでも技術的な問題はないが、Vercel Marketplaceの自動プロビジョニング対象がNeon Postgres / Supabase / MongoDB Atlas / Convex / Turso などでMySQLは対象外のため、セットアップの手間が少ないNeon Postgresを採用。
- **共同編集**: リアルタイム同時編集（Googleドキュメント的な体験）は不要と判断。将来必要になった場合はLiveblocksやSupabase Realtime等の追加を検討する。

## 大まかなデータ構造（初期案）

- `trips`（旅行）
- `trip_members`（参加者・権限）
- `invites`（招待）
- `spots`（保存したスポット。Google Places由来 or 独自入力。緯度経度・住所・メモを保持）
- `itinerary_items`（各日の行程に紐づくスポットと順序。この順序どおりに地図上へピン＋ルート線を描画）

## 開発時の注意

- Google Maps Platformの各APIキーはクライアント/サーバーで用途が異なるため、露出範囲に注意して環境変数を分離すること。
- Neon / ClerkはVercel Marketplace経由でプロビジョニングし、`vercel env pull`で環境変数を同期する。
- `AGENTS.md`は`next dev`によって自動生成・上書きされるNext.js固有の注意書き。削除しても再生成されるため、コミットしてツリーをクリーンに保つこと。
