import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { profile } from "@/content/site";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono-jb",
  subsets: ["latin"],
  display: "swap",
});

const title = `${profile.name} — Software Engineer, Filmmaker & Solo Traveller`;
const description =
  "Engineer building AI, RAG and full-stack systems; filmmaker and photographer documenting solo journeys. Selected work, films, frames and itineraries.";

export const metadata: Metadata = {
  title: {
    default: title,
    template: `%s — ${profile.name}`,
  },
  description,
  applicationName: `${profile.name} Portfolio`,
  authors: [{ name: profile.name }],
  creator: profile.name,
  keywords: [
    "software engineer",
    "AI engineer",
    "RAG",
    "full stack developer",
    "Next.js",
    "filmmaker",
    "photographer",
    "solo travel",
    profile.name,
  ],
  openGraph: {
    type: "website",
    title,
    description,
    siteName: `${profile.name} Portfolio`,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-void text-zinc-200">{children}</body>
    </html>
  );
}
