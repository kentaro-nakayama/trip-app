import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { jaJP } from "@clerk/localizations";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/sonner";
import { DisplayNameGate } from "@/components/profile/display-name-gate";
import { AvatarPromptGate } from "@/components/profile/avatar-prompt-gate";
import { ListsChrome } from "@/components/nav/lists-chrome";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TabiPath",
  description: "旅行の行程をみんなで作る",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider
      localization={jaJP}
      appearance={{
        variables: {
          colorPrimary: "rgb(76, 71, 205)",
          colorBackground: "#0a0a0a",
          colorForeground: "#fafafa",
          colorInput: "#18181b",
          colorInputForeground: "#fafafa",
          colorNeutral: "#fafafa",
          colorShimmer: "#27272a",
        },
      }}
    >
      <html
        lang="ja"
        className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
        style={{ colorScheme: "dark" }}
      >
        <body className="min-h-full flex flex-col">
          <Providers>
            <ListsChrome>{children}</ListsChrome>
            <Toaster />
            <DisplayNameGate />
            <AvatarPromptGate />
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
