'use client';

import {usePathname} from 'next/navigation';
import {useMemo} from 'react';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export function HeaderBreadcrumbs() {
  const pathname = usePathname();
  const breadCrumb = useMemo(
    () => pathname.replace('/dashboard/', '').split('-').join(' '),
    [pathname]
  );

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbPage>CachyOS Builder Dashboard</BreadcrumbPage>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="hidden md:block" />
        <BreadcrumbItem>
          <BreadcrumbPage className="capitalize">{breadCrumb}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
