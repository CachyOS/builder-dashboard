'use client';

import {BuilderPackageDatabase} from '@/lib/db';
import {useKpiCards} from '@/lib/hooks';
import {Card, DonutChart, List, ListItem} from '@tremor/react';
import {useMemo} from 'react';

const numberFormatter = (number: number) =>
  Intl.NumberFormat('us').format(number).toString();

export default function Statistics({
  db,
}: Readonly<{db: BuilderPackageDatabase}>) {
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
  return (
    <Card className="p-4 mt-6 h-full flex flex-col gap-2">
      <Card className="sm:mx-auto sm:max-w-lg">
        <h3 className="text-tremor-default font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
          Total builds by category
        </h3>
        <DonutChart
          className="mt-8"
          data={data}
          category="amount"
          index="name"
          valueFormatter={numberFormatter}
          colors={['green', 'amber', 'blue', 'red', 'sky', 'violet', 'pink']}
          onValueChange={v => v}
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
                  className={item.color + ' h-2.5 w-2.5 shrink-0 rounded-sm'}
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
