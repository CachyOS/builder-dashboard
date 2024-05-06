'use client';

import {BuilderPackageDatabase} from '@/lib/db';
import {useKpiCards} from '@/lib/hooks';
import {getClassByColor} from '@/lib/util';
import {BuilderPackage, BuilderPackageStatus} from '@/types/BuilderPackage';
import {AreaChart, Card, DonutChart, List, ListItem} from '@tremor/react';
import {useEffect, useMemo, useState} from 'react';
import {toast} from 'react-toastify';

type StatsData = {[K in BuilderPackageStatus]?: number} & {monthYear: string};

const numberFormatter = (number: number) =>
  Intl.NumberFormat('us').format(number).toString();

const handleStats = (
  packages: BuilderPackage[],
  callback: (stats: StatsData[]) => void
) => {
  if (!packages.length) {
    return;
  }
  const minDate = new Date(packages[0].updated * 1000);
  const maxDate = new Date(packages[packages.length - 1].updated * 1000);
  const data: {
    [monthYear: string]: {
      [status: string]: number;
    };
  } = {};
  const monthStatusCounts = packages.reduce((acc, doc) => {
    const date = new Date(doc.updated * 1000);
    const monthYear = `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
    const {status} = doc;
    if (!acc[monthYear]) {
      acc[monthYear] = {};
    }
    if (!acc[monthYear][status]) {
      acc[monthYear][status] = 0;
    }
    acc[monthYear][status]++;
    return acc;
  }, data);
  const currentDate = new Date(minDate.getFullYear(), minDate.getMonth());
  while (currentDate <= maxDate) {
    const monthYear = `${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getFullYear()}`;
    if (!monthStatusCounts[monthYear]) {
      monthStatusCounts[monthYear] = {};
    }
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  const monthStatusCountsArray = Object.entries(monthStatusCounts).map(
    ([monthYear, statusCounts]) => {
      return {
        monthYear,
        ...statusCounts,
      };
    }
  );
  callback(monthStatusCountsArray);
};

const colors = ['green', 'amber', 'blue', 'red', 'sky', 'violet', 'pink'];

export default function Statistics({
  db,
}: Readonly<{db: BuilderPackageDatabase}>) {
  const [stats, setStats] = useState<StatsData[]>([]);
  const {extraKpiCards, kpiCards} = useKpiCards(db);
  const data = useMemo(
    () =>
      [...kpiCards, ...extraKpiCards].map(x => ({
        name: x.name,
        amount: x.current,
        color: x.color,
        share: ((x.current / x.total) * 100).toFixed(2) + '%',
      })),
    [extraKpiCards, kpiCards]
  );
  const packageCollection = useMemo(() => db.collections.packages, [db]);
  const query = useMemo(
    () =>
      packageCollection.find().sort({
        updated: 'asc',
      }),
    [packageCollection]
  );
  useEffect(() => {
    const querySubscription = query.$.subscribe(packages => {
      if (!packages.length) {
        return;
      }
      const id = toast.loading('Updating statistics...');
      handleStats(packages, computedStats => setStats(computedStats));
      toast.update(id, {
        render: 'Statistics updated!',
        type: 'success',
        isLoading: false,
        autoClose: 5000,
        closeButton: true,
      });
    });

    return () => {
      querySubscription.unsubscribe();
    };
  }, [query]);
  return (
    <Card className="p-4 mt-6 h-full flex flex-col gap-8 xl:flex-row">
      <Card className="mx-auto md:max-w-7xl">
        <h3 className="text-tremor-default font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong text-center">
          Total builds by month
        </h3>
        <AreaChart
          className="mt-4 h-72 lg:h-[512px]"
          data={stats}
          index="monthYear"
          categories={[
            BuilderPackageStatus.LATEST,
            BuilderPackageStatus.BUILDING,
            BuilderPackageStatus.QUEUED,
            BuilderPackageStatus.FAILED,
            BuilderPackageStatus.DONE,
            BuilderPackageStatus.SKIPPED,
            BuilderPackageStatus.UNKNOWN,
          ]}
          yAxisWidth={64}
          onValueChange={v => v}
          noDataText="Crunching the numbers..."
          colors={colors}
          customTooltip={props => {
            const {payload, active, label} = props;
            if (!active || !payload) {
              return null;
            }
            return (
              <div className="w-56 rounded-tremor-default border border-tremor-border bg-tremor-background dark:border-dark-tremor-border dark:bg-dark-tremor-background p-2 text-tremor-content dark:text-dark-tremor-content shadow-tremor-dropdown">
                <div className="flex flex-1 space-x-2.5">
                  <div
                    className={`flex w-1 flex-col ${getClassByColor('sky')} rounded`}
                  />
                  <div className="text-tremor-content dark:text-dark-tremor-content">
                    Date: {label}
                    <hr className="p-1" />
                  </div>
                </div>
                {payload.map((category, idx) => (
                  <div key={idx} className="flex flex-1 space-x-2.5">
                    <div
                      className={`flex w-1 flex-col ${getClassByColor(category.color ?? '')} rounded`}
                    />
                    <div className="space-y-0.5">
                      <p className="text-tremor-content dark:text-dark-tremor-content">
                        {category.dataKey}
                      </p>
                      <p className="font-medium text-tremor-content-emphasis dark:text-dark-tremor-content-emphasis">
                        {category.value} packages
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            );
          }}
          connectNulls
          showAnimation
          showTooltip
        />
      </Card>
      <Card className="sm:mx-auto xl:max-w-lg">
        <h3 className="text-tremor-default font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong text-center">
          Total builds by category
        </h3>
        <DonutChart
          className="mt-8"
          data={data}
          category="amount"
          index="name"
          valueFormatter={numberFormatter}
          colors={colors}
          onValueChange={v => v}
          noDataText="Crunching the numbers..."
          showAnimation
        />
        <p className="mt-8 flex items-center justify-between text-tremor-label text-tremor-content dark:text-dark-tremor-content">
          <span>Category</span>
          <span>Amount / Share</span>
        </p>
        <List className="mt-2">
          {data.map(item => (
            <ListItem key={item.name} className="space-x-6">
              <div className="flex items-center space-x-2.5 truncate">
                <span
                  className={
                    getClassByColor(item.color) +
                    ' h-2.5 w-2.5 shrink-0 rounded-sm'
                  }
                  aria-hidden={true}
                />
                <span className="truncate dark:text-dark-tremor-content-emphasis">
                  {item.name}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-medium tabular-nums text-tremor-content-strong dark:text-dark-tremor-content-strong">
                  {numberFormatter(item.amount)}
                </span>
                <span className="rounded-tremor-small bg-tremor-background-subtle px-1.5 py-0.5 text-tremor-label font-medium tabular-nums text-tremor-content-emphasis dark:bg-dark-tremor-background-subtle dark:text-dark-tremor-content-emphasis">
                  {item.share}
                </span>
              </div>
            </ListItem>
          ))}
        </List>
      </Card>
    </Card>
  );
}
