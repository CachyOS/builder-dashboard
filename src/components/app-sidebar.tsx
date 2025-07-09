'use client';

import {Activity, Package, PieChart, Repeat2} from 'lucide-react';
import * as React from 'react';

import {getAccessibleServers, getUser} from '@/app/actions';
import {NavMain} from '@/components/nav-main';
import {NavUser} from '@/components/nav-user';
import {ServerSwitcher} from '@/components/server-switcher';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import CachyBuilderClient from '@/lib/CachyBuilderClient';
import {UserData} from '@/lib/typings';

const items = [
  {
    icon: Package,
    name: 'Package List',
    url: '/dashboard/package-list',
  },
  {
    icon: Repeat2,
    name: 'Rebuild Queue',
    url: '/dashboard/rebuild-queue',
  },
  {
    icon: Activity,
    name: 'Audit Logs',
    url: '/dashboard/audit-logs',
  },
  {
    icon: Activity,
    name: 'Repo Actions',
    url: '/dashboard/repo-actions',
  },
  {
    icon: PieChart,
    name: 'Statistics',
    url: '/dashboard/statistics',
  },
];
export function AppSidebar({...props}: React.ComponentProps<typeof Sidebar>) {
  const [servers, setServers] = React.useState(
    CachyBuilderClient.servers.map(server => ({
      accessible: true,
      active: server.default,
      description: server.description,
      name: server.name,
    }))
  );
  const [user, setUser] = React.useState<UserData>({
    displayName: 'Loading...',
    profile_picture_url: '/cachyos-logo.svg',
    username: 'Loading...',
  });
  React.useEffect(() => {
    getAccessibleServers().then(data => setServers(data));
    getUser().then(data => setUser(data));
  }, []);
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <ServerSwitcher servers={servers} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={items} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
