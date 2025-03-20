"use client";

import dynamic from 'next/dynamic';
import OptiIdClient from '~/components/OptiIdClient';

const Frame = dynamic(() => import('~/components/Frame'), {
  ssr: false,
  loading: () => <div className="h-[100dvh] w-full bg-white flex place-items-center justify-center px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-stone-900">Loading...</div>,
});

const Demo = dynamic(() => import('~/components/Demo'), {
  ssr: false,
});

export default function Page() {
  return (
    <>
      <Frame />
      <OptiIdClient />
      {/* <Demo /> */}
    </>
  );
}