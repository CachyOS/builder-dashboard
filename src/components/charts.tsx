'use client';

import {Area, AreaChart, CartesianGrid, Pie, PieChart, XAxis} from 'recharts';

import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {PackageStatsByMonthList, PackageStatsList} from '@/lib/typings';

interface ChartProps {
  data: PackageStatsByMonthList | PackageStatsList;
}

export function CategoryChart({data}: ChartProps) {
  const statusKeys = Array.from(
    new Set((data as PackageStatsList).map(({status_name}) => status_name))
  );

  const chartConfig = statusKeys.reduce((config, key) => {
    config[key] = {
      color: `var(--chart-${statusKeys.indexOf(key) + 1})`,
      label: key,
    };
    return config;
  }, {} as ChartConfig);

  return (
    <ChartContainer
      className="[&_.recharts-pie-label-text]:fill-foreground mx-auto aspect-square max-h-[250px] pb-0"
      config={chartConfig}
    >
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <Pie
          data={data as PackageStatsList}
          dataKey="package_count"
          label
          nameKey="status"
        />
      </PieChart>
    </ChartContainer>
  );
}

export function MonthlyChart({data}: ChartProps) {
  const transformedData = (data as PackageStatsByMonthList).reduce(
    (acc, {package_count, reporting_month, status_name}) => {
      const month = new Date(reporting_month).toISOString().slice(0, 7);
      let monthData = acc.find(item => item.month === month);
      if (!monthData) {
        monthData = {month};
        acc.push(monthData);
      }
      monthData[status_name] = package_count;
      return acc;
    },
    []
  );

  const statusKeys = Array.from(
    new Set(
      (data as PackageStatsByMonthList).map(({status_name}) => status_name)
    )
  );

  const chartConfig = statusKeys.reduce((config, key) => {
    config[key] = {
      color: `var(--chart-${statusKeys.indexOf(key) + 1})`,
      label: key,
    };
    return config;
  }, {} as ChartConfig);

  return (
    <ChartContainer
      className="aspect-auto h-[250px] w-full"
      config={chartConfig}
    >
      <AreaChart data={transformedData}>
        <defs>
          {statusKeys.map((key, index) => (
            <linearGradient
              id={`fill${key}`}
              key={key}
              x1="0"
              x2="0"
              y1="0"
              y2="1"
            >
              <stop
                offset="5%"
                stopColor={`var(--chart-${index + 1})`}
                stopOpacity={0.8}
              />
              <stop
                offset="95%"
                stopColor={`var(--chart-${index + 1})`}
                stopOpacity={0.1}
              />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis
          axisLine={false}
          dataKey="month"
          minTickGap={32}
          tickFormatter={value => {
            const date = new Date(value);
            return date.toLocaleDateString('en-US', {
              month: 'short',
            });
          }}
          tickLine={false}
          tickMargin={8}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              indicator="dot"
              labelFormatter={value => {
                return new Date(value).toLocaleDateString('en-US', {
                  month: 'short',
                });
              }}
            />
          }
          cursor={false}
        />
        {statusKeys.map(key => (
          <Area
            dataKey={key}
            fill={`url(#fill${key})`}
            key={key}
            stackId="a"
            stroke={`var(--chart-${statusKeys.indexOf(key) + 1})`}
            type="natural"
          />
        ))}
        <ChartLegend content={<ChartLegendContent />} />
      </AreaChart>
    </ChartContainer>
  );
}
