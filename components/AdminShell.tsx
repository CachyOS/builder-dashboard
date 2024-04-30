'use client';

import {getPackages, getRebuildPackages, getUsername} from '@/app/actions';
import {BuilderPackageDatabase, getRxDB} from '@/lib/db';
import {
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

import KPICards from './KPICards';
import Loader from './Loader';
import PackageTable from './PackageTable';
import RebuildTable from './RebuildTable';
import Statistics from './Statistics';

export default function AdminShell() {
  const [name, setName] = useState('');
  const [selectedTab, setSelectedTab] = useState('0');
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
      text: 'Statistics',
      value: '2',
    },
  ];
  const [db, setDb] = useState<BuilderPackageDatabase>();
  useEffect(() => {
    getUsername().then(x => setName(x));
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
            getRebuildPackages().then(data =>
              x.rebuild_packages.bulkUpsert(data)
            ),
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
      <div className="flex flex-col gap-2 w-full justify-center items-center min-h-screen">
        <Loader />
        <p className="text-tremor-content-strong dark:text-dark-tremor-content-strong">
          Loading the CachyOS Builder dashboard, please wait...
        </p>
      </div>
    );
  }
  return (
    <Card className="p-4 h-full flex flex-col min-h-screen gap-2">
      <div className="sm:flex sm:items-center sm:justify-between sm:space-x-10">
        <div>
          <div className="flex flex-row gap-4">
            <h3 className="font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
              CachyOS Builder Dashboard
            </h3>
          </div>
          <p className="mt-1 text-tremor-default leading-6 text-tremor-content dark:text-dark-tremor-content">
            Hello {name}, welcome to the CachyOS builder dashboard!
          </p>
        </div>
      </div>
      <KPICards db={db} />
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
              key={value}
              value={value}
              className="text-tremor-default dark:text-dark-tremor-default ui-selected:dark:text-dark-tremor-brand ui-selected:text-tremor-brand"
            >
              {text}
            </Tab>
          ))}
        </TabList>
        <TabPanels>
          <TabPanel>
            <PackageTable db={db} />
          </TabPanel>
          <TabPanel>
            <RebuildTable db={db} />
          </TabPanel>
          <TabPanel>
            <Statistics db={db} />
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </Card>
  );
}
