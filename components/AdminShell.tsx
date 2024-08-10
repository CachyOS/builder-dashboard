'use client';

import {
  getAuditLogs,
  getPackages,
  getRebuildPackages,
  getServerDetails,
  getUsername,
  logout,
} from '@/app/actions';
import {BuilderPackageDatabase, getRxDB} from '@/lib/db';
import {useLogoutShortcutListener} from '@/lib/hooks';
import {BuilderPackageStatus} from '@/types/BuilderPackage';
import {RiLogoutBoxLine} from '@remixicon/react';
import {
  Button,
  Card,
  Select,
  SelectItem,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
} from '@tremor/react';
import {useEffect, useState} from 'react';
import {toast} from 'react-toastify';

import {parseAuditLogEntry} from '@/lib/util';
import {DistinctAuditLogUsers} from '@/types/AuditLog';
import AuditLogs from './AuditLogs';
import KPICards from './KPICards';
import Loader from './Loader';
import PackageTable from './PackageTable';
import RebuildTable from './RebuildTable';
import Statistics from './Statistics';

const list = [
  {
    text: 'Package List',
    value: '0',
  },
  {
    text: 'Rebuild Queue',
    value: '1',
  },
  {
    text: 'Audit Logs',
    value: '2',
  },
  {
    text: 'Statistics',
    value: '3',
  },
];

export default function AdminShell() {
  const [name, setName] = useState('');
  const [server, setServer] = useState('');
  const [selectedTab, setSelectedTab] = useState('0');
  const [filterStatus, setFilterStatus] = useState<BuilderPackageStatus>();
  const [db, setDb] = useState<BuilderPackageDatabase>();
  useLogoutShortcutListener(() => logout());
  useEffect(() => {
    getUsername().then(x => setName(x));
    getServerDetails().then(x => setServer(x.name));
  }, []);
  useEffect(() => {
    toast.promise(
      getRxDB()
        .then(x => {
          setDb(x);
          return x;
        })
        .then(x =>
          Promise.all([
            getPackages().then(data => x.packages.bulkUpsert(data)),
            getRebuildPackages().then(data => {
              if (data.length) {
                return x.rebuild_packages.bulkUpsert(data);
              }
            }),
            getAuditLogs().then(data => {
              let users: string[] = [];
              if (data.length) {
                data.forEach(log => {
                  if (!users.includes(log.username)) {
                    users.push(log.username);
                  }
                  x.audit_logs.upsert(parseAuditLogEntry(log));
                });
              }
              return x.audit_logs.upsertLocal<DistinctAuditLogUsers>('users', {
                users,
              });
            }),
          ])
        ),
      {
        error: 'Failed to load packages',
        pending: 'Loading packages...',
        success: 'Packages loaded!',
      }
    );
  }, []);
  if (!db) {
    return (
      <Loader text="Loading the CachyOS Builder dashboard, please wait..." />
    );
  }
  return (
    <Card className="p-4 h-full flex flex-col min-h-screen gap-2">
      <div className="sm:flex sm:items-center sm:justify-between sm:space-x-10">
        <div className="flex flex-col w-full">
          <div className="flex flex-row gap-4 w-full">
            <div className="w-full">
              <h3 className="font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
                CachyOS Builder Dashboard
              </h3>
            </div>
            <div className="justify-end sm:hidden">
              <Button icon={RiLogoutBoxLine} onClick={() => logout()} size="xs">
                Logout
              </Button>
            </div>
          </div>
          <p className="mt-1 text-tremor-default leading-6 text-tremor-content dark:text-dark-tremor-content">
            Hello {name}, welcome to the CachyOS builder dashboard! You are
            currently connected to the <strong>{server}</strong> server.
          </p>
        </div>
        <div className="justify-end sm:inline hidden">
          <Button icon={RiLogoutBoxLine} onClick={() => logout()}>
            Logout
          </Button>
        </div>
      </div>
      <KPICards db={db} handleClick={type => setFilterStatus(type)} />
      <TabGroup
        index={parseInt(selectedTab, 10)}
        onIndexChange={index => setSelectedTab(index.toString())}
      >
        <Select
          className="mt-6 max-w-full sm:hidden"
          onValueChange={value => setSelectedTab(value)}
          value={selectedTab}
        >
          {list.map(item => (
            <SelectItem key={item.value} value={item.value}>
              {item.text}
            </SelectItem>
          ))}
        </Select>
        <TabList className="mt-4 hidden sm:flex">
          {list.map(({text, value}) => (
            <Tab
              className="text-tremor-default dark:text-dark-tremor-default ui-selected:dark:text-dark-tremor-brand ui-selected:text-tremor-brand"
              key={value}
              value={value}
            >
              {text}
            </Tab>
          ))}
        </TabList>
        <TabPanels>
          <TabPanel>
            <PackageTable db={db} filterStatus={filterStatus} />
          </TabPanel>
          <TabPanel>
            <RebuildTable db={db} />
          </TabPanel>
          <TabPanel>
            <AuditLogs db={db} />
          </TabPanel>
          <TabPanel>
            <Statistics db={db} />
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </Card>
  );
}
