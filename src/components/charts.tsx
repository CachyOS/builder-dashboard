'use client';

import {useMemo} from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Label,
  Pie,
  PieChart,
  XAxis,
} from 'recharts';

import {
  ChartConfig,
  ChartConfigValue,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  MonthlyChartData,
  PackageStatsList,
  PackageStatus,
  packageStatusValues,
} from '@/lib/typings';

const chartConfig: Record<PackageStatus, ChartConfigValue> = {
  BUILDING: {
    color: 'var(--chart-1)',
    label: 'Building',
  },
  DONE: {
    color: 'var(--chart-2)',
    label: 'Done',
  },
  FAILED: {
    color: 'var(--chart-3)',
    label: 'Failed',
  },
  LATEST: {
    color: 'var(--chart-4)',
    label: 'Latest',
  },
  QUEUED: {
    color: 'var(--chart-5)',
    label: 'Queued',
  },
  SKIPPED: {
    color: 'var(--chart-6)',
    label: 'Skipped',
  },
  UNKNOWN: {
    color: 'var(--chart-7)',
    label: 'Unknown',
  },
} satisfies ChartConfig;

export function CategoryStatsDonutChart({
  chartData,
}: Readonly<{chartData: PackageStatsList}>) {
  const processedChartData = useMemo(
    () =>
      chartData
        .filter(item => item.package_count > 0)
        .map(item => ({
          ...item,
          fill: chartConfig[item.status_name].color,
        })),
    [chartData]
  );
  const totalPackages = useMemo(
    () => chartData.reduce((acc, item) => acc + item.package_count, 0),
    [chartData]
  );
  return (
    <ChartContainer
      className="[&_.recharts-pie-label-text]:fill-foreground mx-auto aspect-square max-h-[32rem] pb-0"
      config={chartConfig}
    >
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <Pie
          data={processedChartData}
          dataKey="package_count"
          innerRadius={60}
          label
          nameKey="status_name"
          outerRadius={80}
        >
          {totalPackages && (
            <Label
              className="fill-foreground text-2xl font-bold"
              position="center"
              value={totalPackages}
            />
          )}
        </Pie>
        <ChartLegend
          className="-translate-y-2 flex-wrap gap-2 *:basis-1/4 *:justify-center"
          content={<ChartLegendContent nameKey="status_name" />}
        />
      </PieChart>
    </ChartContainer>
  );
}

export function MonthlyStatsAreaChart({
  chartData,
}: Readonly<{
  chartData: MonthlyChartData;
}>) {
  return (
    <ChartContainer config={chartConfig}>
      <AreaChart
        accessibilityLayer
        data={chartData}
        margin={{
          left: 12,
          right: 12,
        }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          axisLine={false}
          dataKey="reporting_month"
          tickLine={false}
          tickMargin={8}
        />
        <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
        <defs>
          {packageStatusValues.map(status => (
            <linearGradient
              id={`fill${status}`}
              key={status}
              x1="0"
              x2="0"
              y1="0"
              y2="1"
            >
              <stop
                offset="5%"
                stopColor={chartConfig[status].color}
                stopOpacity={0.8}
              />
              <stop
                offset="95%"
                stopColor={chartConfig[status].color}
                stopOpacity={0.1}
              />
            </linearGradient>
          ))}
        </defs>
        {packageStatusValues.map(status => (
          <Area
            dataKey={status}
            fill={`url(#fill${status})`}
            fillOpacity={0.4}
            key={`monthly-chart-area-${status}`}
            stroke={chartConfig[status].color}
            type="bump"
          />
        ))}
        <ChartLegend content={<ChartLegendContent />} />
      </AreaChart>
    </ChartContainer>
  );
}
