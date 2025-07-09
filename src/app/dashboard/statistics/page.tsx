'use client';

import {useEffect, useMemo, useState} from 'react';

import {getPackageStats} from '@/app/actions';
import {CategoryChart, MonthlyChart} from '@/components/charts';
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
  PackageStatsByMonthList,
  PackageStatsList,
  PackageStatsType,
} from '@/lib/typings';

export default function StatisticsPage() {
  const [statsByCategory, setStatsByCategory] = useState<
    PackageStatsList | {error: string}
  >([]);
  const [statsByMonth, setStatsByMonth] = useState<
    PackageStatsByMonthList | {error: string}
  >([]);
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString()
  );

  useEffect(() => {
    getPackageStats(PackageStatsType.CATEGORY).then(setStatsByCategory);
    getPackageStats(PackageStatsType.MONTH).then(setStatsByMonth);
  }, []);

  const years = useMemo(() => {
    if (Array.isArray(statsByMonth)) {
      const years = new Set(
        statsByMonth.map(stat =>
          new Date(stat.reporting_month).getFullYear().toString()
        )
      );
      return Array.from(years);
    }
    return [new Date().getFullYear().toString()];
  }, [statsByMonth]);

  const filteredStatsByMonth = useMemo(() => {
    if (Array.isArray(statsByMonth)) {
      return statsByMonth.filter(
        stat =>
          new Date(stat.reporting_month).getFullYear().toString() ===
          selectedYear
      );
    }
    return [];
  }, [statsByMonth, selectedYear]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>Stats by Category</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          {Array.isArray(statsByCategory) && (
            <CategoryChart data={statsByCategory} />
          )}
        </CardContent>
      </Card>
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
              className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
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
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          {Array.isArray(statsByMonth) && (
            <MonthlyChart data={filteredStatsByMonth} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
