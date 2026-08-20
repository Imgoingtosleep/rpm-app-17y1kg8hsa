'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '../../layouts/MainLayout';
import Gatekeeper from '../../pages/Gatekeeper';

export default function SelectSitePage() {
  const router = useRouter();

  useEffect(() => {
    try {
      const user = localStorage.getItem('user');
      if (!user) {
        router.push('/');
      }
    } catch (e) {}
  }, [router]);

  const handleOpenWorkOrder = (site, inspectorName, rpmCycle, inspectionDate, inspectionTime, jobNo, sapNo) => {
    try {
      localStorage.setItem('inspectorName', inspectorName);
      localStorage.setItem('rpmCycle', rpmCycle);
      localStorage.setItem('inspectionDate', inspectionDate);
      localStorage.setItem('inspectionTime', inspectionTime);
      if (jobNo) localStorage.setItem('jobNo', jobNo);
      if (sapNo) localStorage.setItem('sapNo', sapNo);
    } catch (e) {}
    router.push(`/workorder/${site.code}/master`);
  };

  return (
    <MainLayout currentStep="gatekeeper" currentSite={null} onNavigateBack={() => {}}>
      <Gatekeeper onOpenWorkOrder={handleOpenWorkOrder} />
    </MainLayout>
  );
}
