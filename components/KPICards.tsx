import {BuilderPackageDatabase} from '@/lib/db';
import {useKpiCards} from '@/lib/hooks';
import {BuilderPackageStatus} from '@/types/BuilderPackage';
import {Badge, Card, ProgressCircle} from '@tremor/react';

export default function KPICards({
  db,
  handleClick,
}: Readonly<{
  db: BuilderPackageDatabase;
  handleClick: (type: BuilderPackageStatus) => void;
}>) {
  const {kpiCards, total} = useKpiCards(db);
  return (
    <div className="mt-6 flex flex-row flex-wrap gap-4">
      {kpiCards.map(kpi => {
        const percentage = total
          ? parseFloat(((kpi.current / total) * 100).toFixed(2))
          : 0;
        return (
          <Card
            className="p-4 hover:bg-tremor-background-muted hover:dark:bg-dark-tremor-background-muted w-72 flex-grow hover:cursor-pointer"
            key={kpi.id}
            onClick={() => handleClick(kpi.type)}
          >
            <div className="flex items-center justify-between">
              <p className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">
                <span className="focus:outline-none">
                  <span aria-hidden={true} className="absolute inset-0" />
                  {kpi.name}
                </span>
              </p>
              <Badge color={kpi.color}>{percentage}%</Badge>
            </div>
            <div className="flex items-center justify-between pt-2">
              <p className="mt-3 flex items-end">
                <span className="text-tremor-metric font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
                  {kpi.current}
                </span>
                {kpi.total ? (
                  <span className="font-semibold text-tremor-content-subtle dark:text-dark-tremor-content-subtle">
                    /{kpi.total}
                  </span>
                ) : (
                  <></>
                )}
              </p>
              <ProgressCircle color={kpi.color} size="md" value={percentage}>
                <span className="text-xs font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                  {percentage}%
                </span>
              </ProgressCircle>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
