'use client';

import {useEffect, useMemo, useState} from 'react';

import {getPackageStats} from '@/app/actions';
import {
  CategoryStatsDonutChart,
  MonthlyStatsAreaChart,
} from '@/components/charts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MonthlyChartData,
  PackageStatsList,
  PackageStatsType,
  PackageStatus,
} from '@/lib/typings';

export default function StatisticsPage() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <CategoryChart />
      <MonthlyChart />
    </div>
  );
}

function CategoryChart() {
  const [categoryChartData, setCategoryChartData] = useState<PackageStatsList>(
    []
  );

  useEffect(() => {
    getPackageStats(PackageStatsType.CATEGORY).then(response => {
      if (Array.isArray(response)) {
        setCategoryChartData(response);
      }
    });
  }, []);

  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Stats by Month</CardTitle>
          <CardDescription>
            Showing total packages status by month
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <CategoryStatsDonutChart chartData={categoryChartData} />
      </CardContent>
    </Card>
  );
}

function MonthlyChart() {
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString()
  );
  const [years, setYears] = useState<string[]>([]);
  const [monthlyChartData, setMonthlyChartData] = useState<MonthlyChartData>(
    []
  );
  const filteredMonthlyChartData = useMemo(
    () =>
      monthlyChartData.filter(x => x.reporting_month.startsWith(selectedYear)),
    [monthlyChartData, selectedYear]
  );
  useEffect(() => {
    getPackageStats(PackageStatsType.MONTH).then(response => {
      if (Array.isArray(response)) {
        const chartDataMap = new Map<
          string,
          Record<PackageStatus, number> & {
            reporting_month: string;
          }
        >();
        const years = new Set<string>();

        response.forEach(item => {
          const month = item.reporting_month;
          if (!chartDataMap.has(month)) {
            chartDataMap.set(month, {
              [PackageStatus.BUILDING]: 0,
              [PackageStatus.DONE]: 0,
              [PackageStatus.FAILED]: 0,
              [PackageStatus.LATEST]: 0,
              [PackageStatus.QUEUED]: 0,
              [PackageStatus.SKIPPED]: 0,
              [PackageStatus.UNKNOWN]: 0,
              reporting_month: month,
            });
          }
          const statusMap = chartDataMap.get(month)!;
          statusMap[item.status_name] = item.package_count;
          years.add(month.slice(0, 4));
        });

        setMonthlyChartData(
          Array.from(chartDataMap.values()).sort((a, b) =>
            a.reporting_month.localeCompare(b.reporting_month)
          )
        );
        setYears(Array.from(years).sort((a, b) => b.localeCompare(a)));
      }
    });
  }, []);
  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Stats by Month</CardTitle>
          <CardDescription>
            Showing total packages status by month
          </CardDescription>
        </div>
        <Select onValueChange={setSelectedYear} value={selectedYear}>
          <SelectTrigger
            aria-label="Select a value"
            className="max-w-3xs rounded-lg ml-auto flex"
          >
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            {years.map(year => (
              <SelectItem className="rounded-lg" key={year} value={year}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-12">
        <MonthlyStatsAreaChart chartData={filteredMonthlyChartData} />
      </CardContent>
    </Card>
  );
}
