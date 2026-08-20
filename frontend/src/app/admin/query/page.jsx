'use client';

import React from 'react';
import MainLayout from '../../../layouts/MainLayout';
import DatabaseQuery from '../../../pages/DatabaseQuery';

export default function DatabaseQueryPage() {
  return (
    <MainLayout currentStep="db-query" currentSite={null} onNavigateBack={() => {}}>
      <DatabaseQuery />
    </MainLayout>
  );
}
