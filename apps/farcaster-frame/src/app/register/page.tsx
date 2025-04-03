'use client';

import DomainRegistration from '../../components/DomainRegistration';

export default function RegisterPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Register Your Opti.id Domain</h1>
      <div className="max-w-md mx-auto">
        <DomainRegistration />
      </div>
    </div>
  );
} 