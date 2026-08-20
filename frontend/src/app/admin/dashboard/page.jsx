'use client';

import React from 'react';
import MainLayout from '../../../layouts/MainLayout';
import AdminDashboard from '../../../pages/AdminDashboard';

export default function AdminDashboardPage() {
  return (
    <MainLayout currentStep="admin-dashboard" currentSite={null} onNavigateBack={() => {}}>
      <AdminDashboard />
    </MainLayout>
  );
}
