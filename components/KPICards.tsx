import {BuilderPackageDatabase} from '@/lib/db';
import {BuilderPackageStatus} from '@/types/BuilderPackage';
import {Card} from '@tremor/react';
import {useEffect, useMemo, useState} from 'react';

export default function KPICards({db}: Readonly<{db: BuilderPackageDatabase}>) {
  const [total, setTotal] = useState(0);
  const [queued, setQueued] = useState(0);
  const [failed, setFailed] = useState(0);
  const [latest, setLatest] = useState(0);
  const [building, setBuilding] = useState(0);
  const kpiCards = useMemo(
    () => [
      {
        current: latest,
        id: 1,
        name: 'Latest Packages',
        total,
      },
      {
        current: building,
        id: 2,
        name: 'Building Packages',
        total,
      },
      {
        current: queued,
        id: 3,
        name: 'Queued Packages',
        total,
      },
      {
        current: failed,
        id: 4,
        name: 'Failed Packages',
        total,
      },
    ],
    [total, queued, failed, latest, building]
  );
  const packageCollection = useMemo(() => db.collections.packages, [db]);
  const totalQuery = useMemo(
    () => packageCollection.count({}),
    [packageCollection]
  );
  const queuedQuery = useMemo(
    () =>
      packageCollection.count({
        selector: {
          status: BuilderPackageStatus.QUEUED,
        },
      }),
    [packageCollection]
  );
  const buildingQuery = useMemo(
    () =>
      packageCollection.count({
        selector: {
          status: BuilderPackageStatus.BUILDING,
        },
      }),
    [packageCollection]
  );
  const failedQuery = useMemo(
    () =>
      packageCollection.count({
        selector: {
          status: BuilderPackageStatus.FAILED,
        },
      }),
    [packageCollection]
  );
  const latestQuery = useMemo(
    () =>
      packageCollection.count({
        selector: {
          status: BuilderPackageStatus.LATEST,
        },
      }),
    [packageCollection]
  );
  useEffect(() => {
    totalQuery.exec().then(x => setTotal(x));
    queuedQuery.exec().then(x => setQueued(x));
    failedQuery.exec().then(x => setFailed(x));
    latestQuery.exec().then(x => setLatest(x));
    buildingQuery.exec().then(x => setBuilding(x));

    const totalSub = totalQuery.$.subscribe(x => setTotal(x));
    const queuedSub = queuedQuery.$.subscribe(x => setQueued(x));
    const failedSub = failedQuery.$.subscribe(x => setFailed(x));
    const latestSub = latestQuery.$.subscribe(x => setLatest(x));
    const buildingSub = buildingQuery.$.subscribe(x => setBuilding(x));

    return () => {
      totalSub.unsubscribe();
      queuedSub.unsubscribe();
      failedSub.unsubscribe();
      latestSub.unsubscribe();
      buildingSub.unsubscribe();
    };
  }, [totalQuery, queuedQuery, failedQuery, latestQuery, buildingQuery]);
  return (
    <div className="mt-6 flex flex-row flex-wrap gap-4">
      {kpiCards.map(kpi => (
        <Card
          className="p-4 hover:bg-tremor-background-muted hover:dark:bg-dark-tremor-background-muted w-72 flex-grow"
          key={kpi.id}
        >
          <p className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">
            <span className="focus:outline-none">
              <span aria-hidden={true} className="absolute inset-0" />
              {kpi.name}
            </span>
          </p>
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
        </Card>
      ))}
    </div>
  );
}
