// import type { Metadata } from "next";

// import { getSession } from "~/auth"
import "~/app/globals.css";
import { generateMetadata } from "./metadata";
import { PT_Mono } from "next/font/google";
import { Providers } from "./providers";

const ptMono = PT_Mono({
  weight: ["400"],
  subsets: ["latin"],
});

export { generateMetadata };

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`bg-white max-w-[100vw] max-h-[100dvh] ${ptMono.className}`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
