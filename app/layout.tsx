import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { getTheme } from "@/lib/content/theme";
import { getProfile } from "@/lib/content/profile";
import { themeToCss } from "@/content/theme";
import { ProfileProvider } from "@/components/providers/profile-provider";

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

/**
 * Metadata is generated rather than static so the name and bio come from the
 * admin-editable profile. `getProfile` is cached and tagged, so this doesn't
 * add a read per request and saving in the admin revalidates it.
 */
export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile();
  const title = `${profile.name} — Software Engineer, Filmmaker & Solo Traveller`;
  const description = profile.bioShort;

  return {
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
}

export const viewport: Viewport = {
  themeColor: "#09090b",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [theme, profile] = await Promise.all([getTheme(), getProfile()]);

  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/**
         * Theme variables, server-rendered into the document.
         *
         * Inline rather than a stylesheet so the colours are present on first
         * paint — a fetched theme would flash the defaults first. Every value
         * is validated as a 6-digit hex before storage, so nothing arbitrary
         * can reach this tag.
         */}
        <style
          id="theme-vars"
          dangerouslySetInnerHTML={{ __html: themeToCss(theme) }}
        />
      </head>
      <body className="flex min-h-full flex-col bg-void text-zinc-200">
        <ProfileProvider value={profile}>{children}</ProfileProvider>
      </body>
    </html>
  );
}
