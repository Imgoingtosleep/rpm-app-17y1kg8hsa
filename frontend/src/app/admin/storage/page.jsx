'use client';

import React, { Suspense } from 'react';
import StorageBrowser from '../../../views/StorageBrowser';

export default function StorageBrowserPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading Storage...</div>}>
      <StorageBrowser />
    </Suspense>
  );
}
