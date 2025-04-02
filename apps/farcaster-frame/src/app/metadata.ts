import { Metadata } from "next";

const appUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

const frame = {
  version: "next",
  imageUrl: `${appUrl}/opengraph-image`,
  button: {
    title: "Launch Frame",
    action: {
      type: "launch_frame",
      name: "Farcaster Frames v2 Demo",
      url: appUrl,
      splashImageUrl: `${appUrl}/splash.png`,
      splashBackgroundColor: "#f7f7f7",
    },
  },
};

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Opti.id",
    description: "A Farcaster Frames for opti.id.",
    openGraph: {
      title: "Opti.id",
      description: "A Farcaster Frames for opti.id.",
    },
    other: {
      "fc:frame": JSON.stringify(frame),
    },
  };
} 