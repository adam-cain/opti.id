import type { Metadata } from "next";

import { getSession } from "~/auth"
import "~/app/globals.css";
import { Providers } from "~/app/providers";
import { generateMetadata } from "./metadata";
import { PT_Mono } from "next/font/google";

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
  const session = await getSession()
  
  return (
    <html lang="en">
      <body className={ptMono.className}>
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
