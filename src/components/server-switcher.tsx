'use client';

import {ChevronsUpDown} from 'lucide-react';
import Image from 'next/image';
import * as React from 'react';
import {toast} from 'sonner';

import {changeServer} from '@/app/actions/users';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {Kbd} from '@/components/ui/kbd';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  useNumericKeyShortcutListener,
  useNumericKeyVimShortcutListener,
} from '@/hooks/use-keyboard-shortcut-listener';
import {ServerData} from '@/lib/typings';

export function ServerSwitcher({
  servers,
}: Readonly<{
  servers: ServerData[];
}>) {
  const {isMobile, setActiveServer: updateActiveServer} = useSidebar();
  const [activeServer, setActiveServer] = React.useState<null | ServerData>(
    null
  );

  const handleServerChange = React.useCallback(
    (server: ServerData) => {
      if (
        server.accessible &&
        activeServer &&
        server.name !== activeServer.name
      ) {
        const toastId = toast.loading(
          `Switching to server "${server.name}"...`
        );
        changeServer(server.name)
          .then(res => {
            if (res.error) {
              toast.error(res.error, {
                closeButton: true,
                duration: Infinity,
                id: toastId,
              });
            } else {
              setActiveServer(server);
              updateActiveServer(server.name);
              toast.success(res.msg ?? 'Switched server successfully!', {
                id: toastId,
              });
            }
          })
          .catch(() => {
            toast.error('Failed to switch server, please try again later.', {
              closeButton: true,
              duration: Infinity,
              id: toastId,
            });
          });
      }
    },
    [activeServer, updateActiveServer]
  );

  const handleServerSwitchShortcut = React.useCallback(
    (key: number) => {
      if (key > servers.length || key < 1) {
        return;
      }
      const server = servers[key - 1];
      if (server?.accessible) {
        handleServerChange(server);
      }
    },
    [handleServerChange, servers]
  );

  useNumericKeyShortcutListener(handleServerSwitchShortcut);
  useNumericKeyVimShortcutListener(handleServerSwitchShortcut);

  React.useEffect(() => {
    if (servers.length > 0) {
      const defaultServer = servers.find(
        server => server.active && server.accessible
      );
      if (defaultServer) {
        setActiveServer(defaultServer);
      } else {
        setActiveServer(servers[0]);
      }
    }
  }, [servers]);

  if (!activeServer) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              size="lg"
            >
              <div className="bg-muted text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <Image
                  alt="CachyOS Logo"
                  className="size-7"
                  height={32}
                  src="/cachyos-logo.svg"
                  width={32}
                />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {activeServer.name}
                </span>
                <span className="truncate text-xs">
                  {activeServer.description}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Build Servers
            </DropdownMenuLabel>
            {servers.map((server, index) => (
              <DropdownMenuItem
                className="gap-2 p-2"
                disabled={!server.accessible}
                key={server.name}
                onClick={() => handleServerChange(server)}
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  <Image
                    alt="CachyOS Logo"
                    className="size-4"
                    height={32}
                    src="/cachyos-logo.svg"
                    width={32}
                  />
                </div>
                {server.name}
                <DropdownMenuShortcut>
                  <Kbd>⌘ {index + 1}</Kbd>
                </DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
