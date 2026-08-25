'use client';
import { useRouter, useParams, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';

export function useNavigate() {
  const router = useRouter();
  return useCallback((path, options) => {
    if (typeof path === 'number') {
      if (path === -1) router.back();
      else if (path === 1) router.forward();
    } else if (options?.replace) {
      router.replace(path);
    } else {
      router.push(path);
    }
  }, [router]);
}

export { useParams, useSearchParams, usePathname };
