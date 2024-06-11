'use client';

import {BuilderPackageStatus} from '@/types/BuilderPackage';
import {useEffect, useMemo, useState} from 'react';

import {BuilderPackageDatabase} from './db';
import {getColor} from './util';

const clearTimer = (timer: NodeJS.Timeout | null) => {
  if (timer) {
    clearTimeout(timer);
  }
};

export function useKpiCards(db: BuilderPackageDatabase) {
  const [total, setTotal] = useState(0);
  const [queued, setQueued] = useState(0);
  const [failed, setFailed] = useState(0);
  const [latest, setLatest] = useState(0);
  const [building, setBuilding] = useState(0);
  const [done, setDone] = useState(0);
  const [skipped, setSkipped] = useState(0);
  const [unknown, setUnknown] = useState(0);
  const kpiCards = useMemo(
    () => [
      {
        color: getColor(BuilderPackageStatus.LATEST),
        current: latest,
        id: 1,
        name: 'Latest Packages',
        total,
        type: BuilderPackageStatus.LATEST,
      },
      {
        color: getColor(BuilderPackageStatus.BUILDING),
        current: building,
        id: 2,
        name: 'Building Packages',
        total,
        type: BuilderPackageStatus.BUILDING,
      },
      {
        color: getColor(BuilderPackageStatus.QUEUED),
        current: queued,
        id: 3,
        name: 'Queued Packages',
        total,
        type: BuilderPackageStatus.QUEUED,
      },
      {
        color: getColor(BuilderPackageStatus.FAILED),
        current: failed,
        id: 4,
        name: 'Failed Packages',
        total,
        type: BuilderPackageStatus.FAILED,
      },
    ],
    [total, queued, failed, latest, building]
  );
  const extraKpiCards = useMemo(
    () => [
      {
        color: getColor(BuilderPackageStatus.DONE),
        current: done,
        id: 1,
        name: 'Done Packages',
        total,
        type: BuilderPackageStatus.DONE,
      },
      {
        color: getColor(BuilderPackageStatus.SKIPPED),
        current: skipped,
        id: 2,
        name: 'Skipped Packages',
        total,
        type: BuilderPackageStatus.SKIPPED,
      },
      {
        color: getColor(BuilderPackageStatus.UNKNOWN),
        current: unknown,
        id: 3,
        name: 'Unknown Packages',
        total,
        type: BuilderPackageStatus.UNKNOWN,
      },
    ],
    [total, done, skipped, unknown]
  );
  const packageCollection = useMemo(() => db.collections.packages, [db]);
  const totalQuery = useMemo(
    () => packageCollection.count({}),
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
  const doneQuery = useMemo(
    () =>
      packageCollection.count({
        selector: {
          status: BuilderPackageStatus.DONE,
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
  const queuedQuery = useMemo(
    () =>
      packageCollection.count({
        selector: {
          status: BuilderPackageStatus.QUEUED,
        },
      }),
    [packageCollection]
  );
  const skippedQuery = useMemo(
    () =>
      packageCollection.count({
        selector: {
          status: BuilderPackageStatus.SKIPPED,
        },
      }),
    [packageCollection]
  );
  const unknownQuery = useMemo(
    () =>
      packageCollection.count({
        selector: {
          status: BuilderPackageStatus.UNKNOWN,
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
    doneQuery.exec().then(x => setDone(x));
    skippedQuery.exec().then(x => setSkipped(x));
    unknownQuery.exec().then(x => setUnknown(x));

    const totalSub = totalQuery.$.subscribe(x => setTotal(x));
    const queuedSub = queuedQuery.$.subscribe(x => setQueued(x));
    const failedSub = failedQuery.$.subscribe(x => setFailed(x));
    const latestSub = latestQuery.$.subscribe(x => setLatest(x));
    const buildingSub = buildingQuery.$.subscribe(x => setBuilding(x));
    const doneSub = doneQuery.$.subscribe(x => setDone(x));
    const skippedSub = skippedQuery.$.subscribe(x => setSkipped(x));
    const unknownSub = unknownQuery.$.subscribe(x => setUnknown(x));

    return () => {
      totalSub.unsubscribe();
      queuedSub.unsubscribe();
      failedSub.unsubscribe();
      latestSub.unsubscribe();
      buildingSub.unsubscribe();
      doneSub.unsubscribe();
      skippedSub.unsubscribe();
      unknownSub.unsubscribe();
    };
  }, [
    totalQuery,
    queuedQuery,
    failedQuery,
    latestQuery,
    buildingQuery,
    doneQuery,
    skippedQuery,
    unknownQuery,
  ]);
  return {extraKpiCards, kpiCards, total};
}

export function useLogoutShortcutListener(callback: () => void) {
  const [colonQPressed, setColonQPressed] = useState(false);
  let timer: NodeJS.Timeout | null = null;

  useEffect(() => {
    let colonPressed = false;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === ':') {
        colonPressed = true;
        timer = setTimeout(() => {
          colonPressed = false;
        }, 800);
      } else if (colonPressed && event.key.toLowerCase() === 'q') {
        setColonQPressed(true);
        colonPressed = false;
        clearTimer(timer);
      } else {
        colonPressed = false;
        clearTimer(timer);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimer(timer);
    };
  }, []);

  useEffect(() => {
    if (colonQPressed) {
      callback();
      setColonQPressed(false);
    }
  }, [callback, colonQPressed]);
}

export function useCtrlFShortcutListener(callback: () => void) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  });
}
