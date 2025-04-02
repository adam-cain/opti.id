"use client";

import dynamic from 'next/dynamic'

const Frame = dynamic(() => import('~/components/Frame'), {
  ssr: false,
  loading: () => <div className="h-[100dvh] w-full flex place-items-center justify-center px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-stone-900">Loading...</div>,
});

export default function Page() {
  return (
    <Frame />
  );
}