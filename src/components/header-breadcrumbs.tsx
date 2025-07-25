'use client';

import {usePathname} from 'next/navigation';
import {Fragment, useMemo} from 'react';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export function HeaderBreadcrumbs() {
  const pathname = usePathname();
  const breadCrumbs = useMemo(
    () => pathname.replace('/dashboard/', '').split('-').join(' ').split('/'),
    [pathname]
  );

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbPage>CachyOS Builder Dashboard</BreadcrumbPage>
        </BreadcrumbItem>
        {breadCrumbs.map(breadCrumb => (
          <Fragment key={breadCrumb}>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage className="capitalize">
                {breadCrumb}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
