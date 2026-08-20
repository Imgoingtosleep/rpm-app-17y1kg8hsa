'use client';
import { useRouter, useParams, useSearchParams, usePathname } from 'next/navigation';

export function useNavigate() {
  const router = useRouter();
  return (path, options) => {
    if (typeof path === 'number') {
      if (path === -1) router.back();
      else if (path === 1) router.forward();
    } else if (options?.replace) {
      router.replace(path);
    } else {
      router.push(path);
    }
  };
}

export { useParams, useSearchParams, usePathname };
