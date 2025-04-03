"use client";

import dynamic from 'next/dynamic'
import Link from 'next/link';

const Frame = dynamic(() => import('~/components/Frame'), {
  ssr: false,
  loading: () => <div className="h-[100dvh] w-full flex place-items-center justify-center px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-stone-900">Loading...</div>,
});

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-3xl w-full bg-white p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-4xl font-bold mb-6 text-blue-800">Welcome to Opti.id</h1>
        <p className="text-xl mb-8 text-gray-700">
          Get your own unique domain on the Optimism Superchain with a randomly generated memorable name.
        </p>
        
        <Link 
          href="/register" 
          className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg font-medium text-lg hover:bg-blue-700 transition-colors"
        >
          Register Your Domain
        </Link>
        
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 border border-gray-200 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Memorable Names</h2>
            <p className="text-gray-600">Random adjective-descriptor-noun combinations that are easy to remember.</p>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Superchain Support</h2>
            <p className="text-gray-600">Works across multiple chains in the Optimism ecosystem.</p>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Easy Registration</h2>
            <p className="text-gray-600">No complicated setup. Just connect your wallet and register.</p>
          </div>
        </div>
      </div>
    </div>
  );
}