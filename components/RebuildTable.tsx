'use client';

import {getRebuildPackages} from '@/app/actions';
import {BuilderPackageDatabase} from '@/lib/db';
import {getColor} from '@/lib/util';
import {
  BuilderPackageArchitecture,
  BuilderPackageRepository,
  BuilderPackageStatus,
  BuilderRebuildPackageWithID,
} from '@/types/BuilderPackage';
import {
  RiArticleLine,
  RiRefreshLine,
  RiSearchLine,
  RiSoundModuleFill,
} from '@remixicon/react';
import {
  Badge,
  Button,
  Card,
  MultiSelect,
  MultiSelectItem,
  NumberInput,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TextInput,
} from '@tremor/react';
import Link from 'next/link';
import {useMemo, useState} from 'react';
import {toast} from 'react-toastify';
import {MangoQuery} from 'rxdb';
import {useRxQuery} from 'rxdb-hooks';

export default function RebuildTable({
  db,
}: Readonly<{db: BuilderPackageDatabase}>) {
  const [pkgQuery, setPkgQuery] = useState('');
  const [selectedBuildStatus, setSelectedBuildStatus] = useState<string[]>([]);
  const [selectedRepositories, setSelectedRepositories] = useState<string[]>(
    []
  );
  const [selectedMarch, setSelectedMarch] = useState<string[]>([]);
  const packageCollection = useMemo(
    () => db.collections.rebuild_packages,
    [db]
  );
  const query = useMemo(() => {
    const searchQuery: MangoQuery<BuilderRebuildPackageWithID> = {
      selector: {
        ...(selectedBuildStatus.length
          ? {
              status: {
                $in: selectedBuildStatus,
              },
            }
          : {}),
        ...(pkgQuery.trim().length
          ? {
              pkgbase: {
                $options: 'ig',
                $regex: pkgQuery.trim(),
              },
            }
          : {}),
        ...(selectedRepositories.length
          ? {
              repository: {
                $in: selectedRepositories,
              },
            }
          : {}),
        ...(selectedMarch.length
          ? {
              march: {
                $in: selectedMarch,
              },
            }
          : {}),
      },
    };
    return packageCollection.find(searchQuery).sort({
      updated: 'desc',
    });
  }, [
    packageCollection,
    pkgQuery,
    selectedBuildStatus,
    selectedRepositories,
    selectedMarch,
  ]);
  const {
    currentPage,
    fetchPage,
    pageCount,
    result: packages,
  } = useRxQuery(query, {
    pageSize: 10,
    pagination: 'Traditional',
  });
  return (
    <Card className="p-4 mt-6 h-full flex flex-col gap-2">
      <div className="mt-4 flex flex-col sm:flex-row sm:justify-start md:gap-8 gap-4 flex-wrap">
        <div className="max-w-full sm:max-w-xs flex w-full">
          <MultiSelect
            className="max-w-full sm:max-w-xs"
            icon={RiSoundModuleFill}
            onValueChange={status => {
              if (currentPage !== 1) {
                fetchPage(1);
              }
              setSelectedBuildStatus(status);
            }}
            placeholder="Filter by build status"
          >
            {Object.values(BuilderPackageStatus).map(status => (
              <MultiSelectItem key={status} value={status}>
                {status}
              </MultiSelectItem>
            ))}
          </MultiSelect>
        </div>
        <div className="max-w-full sm:max-w-xs flex w-full">
          <MultiSelect
            className="max-w-full sm:max-w-xs"
            icon={RiSoundModuleFill}
            onValueChange={repositories => {
              if (currentPage !== 1) {
                fetchPage(1);
              }
              setSelectedRepositories(repositories);
            }}
            placeholder="Filter by repository"
          >
            {Object.values(BuilderPackageRepository).map(repo => (
              <MultiSelectItem key={repo} value={repo}>
                {repo}
              </MultiSelectItem>
            ))}
          </MultiSelect>
        </div>
        <div className="max-w-full sm:max-w-xs flex w-full">
          <MultiSelect
            className="max-w-full sm:max-w-xs"
            icon={RiSoundModuleFill}
            onValueChange={arch => {
              if (currentPage !== 1) {
                fetchPage(1);
              }
              setSelectedMarch(arch);
            }}
            placeholder="Filter by march"
          >
            {Object.values(BuilderPackageArchitecture).map(arch => (
              <MultiSelectItem key={arch} value={arch}>
                {arch}
              </MultiSelectItem>
            ))}
          </MultiSelect>
        </div>
        <div className="flex sm:flex-row flex-col gap-2 2xl:ml-auto xl:justify-end">
          <Button
            className="rounded-tremor-default bg-tremor-brand text-center text-tremor-default font-medium text-tremor-brand-inverted shadow-tremor-input hover:bg-tremor-brand-emphasis dark:bg-dark-tremor-brand dark:text-dark-tremor-brand-inverted dark:shadow-dark-tremor-input dark:hover:bg-dark-tremor-brand-emphasis"
            icon={RiRefreshLine}
            onClick={() =>
              toast.promise(
                getRebuildPackages().then(data =>
                  db.rebuild_packages.bulkUpsert(data)
                ),
                {
                  error: 'Failed to refresh packages',
                  pending: 'Refreshing packages...',
                  success: 'Packages list refreshed!',
                }
              )
            }
          >
            Refresh Packages
          </Button>
        </div>
      </div>
      <div className="flex w-full mt-2">
        <TextInput
          icon={RiSearchLine}
          onValueChange={value => {
            if (currentPage !== 1) {
              fetchPage(1);
            }
            setPkgQuery(value);
          }}
          placeholder="Search for a package"
          value={pkgQuery}
        />
      </div>
      <Table className="mt-2">
        <TableHead>
          <TableRow className="border-b border-tremor-border dark:border-dark-tremor-border">
            <TableHeaderCell className="text-tremor-content-strong dark:text-dark-tremor-content-strong">
              Base
            </TableHeaderCell>
            <TableHeaderCell className="text-tremor-content-strong dark:text-dark-tremor-content-strong">
              Arch
            </TableHeaderCell>
            <TableHeaderCell className="text-tremor-content-strong dark:text-dark-tremor-content-strong">
              Repository
            </TableHeaderCell>
            <TableHeaderCell className="text-tremor-content-strong dark:text-dark-tremor-content-strong">
              Status
            </TableHeaderCell>
            <TableHeaderCell className="text-tremor-content-strong dark:text-dark-tremor-content-strong text-right">
              Updated At
            </TableHeaderCell>
            <TableHeaderCell className="text-tremor-content-strong dark:text-dark-tremor-content-strong text-right">
              Build Log
            </TableHeaderCell>
            <TableHeaderCell className="text-tremor-content-strong dark:text-dark-tremor-content-strong text-right">
              Raw Build Log
            </TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {packages.map(pkg => (
            <TableRow key={pkg.packageID}>
              <TableCell>{pkg.pkgbase}</TableCell>
              <TableCell>{pkg.march}</TableCell>
              <TableCell>{pkg.repository}</TableCell>
              <TableCell>
                <Badge color={getColor(pkg.status)}>{pkg.status}</Badge>
              </TableCell>
              <TableCell className="text-right">
                {new Date(pkg.updated / 1000000).toLocaleString()}
              </TableCell>
              <TableCell className="text-right">
                <Link
                  href={`/logs/${pkg.march}/${pkg.pkgbase}`}
                  prefetch={false}
                  target="_blank"
                >
                  <Button
                    className="text-dark-tremor-content-strong dark:text-tremor-content-strong dark:bg-white bg-black hover:bg-gray-700 dark:hover:bg-gray-200 text-right"
                    disabled={pkg.status !== BuilderPackageStatus.FAILED}
                    icon={RiArticleLine}
                  >
                    View
                  </Button>
                </Link>
              </TableCell>
              <TableCell className="text-right">
                <Link
                  href={`/logs/${pkg.march}/${pkg.pkgbase}?raw=true`}
                  prefetch={false}
                  target="_blank"
                >
                  <Button
                    className="text-dark-tremor-content-strong dark:text-tremor-content-strong dark:bg-white bg-black hover:bg-gray-700 dark:hover:bg-gray-200 text-right"
                    disabled={pkg.status !== BuilderPackageStatus.FAILED}
                    icon={RiArticleLine}
                  >
                    View
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex justify-center gap-8 mt-4">
        <Button
          className="text-dark-tremor-content-strong dark:text-tremor-content-strong dark:bg-white bg-black hover:bg-gray-700 dark:hover:bg-gray-200"
          disabled={currentPage === 1}
          onClick={() => fetchPage(currentPage - 1)}
        >
          Previous
        </Button>
        <div className="text-dark-tremor-content-strong dark:text-tremor-content-strong dark:bg-white bg-black rounded-md text-center flex flex-col justify-center p-2">
          {currentPage} / {pageCount}
        </div>
        <Button
          className="text-dark-tremor-content-strong dark:text-tremor-content-strong dark:bg-white bg-black hover:bg-gray-700 dark:hover:bg-gray-200"
          disabled={currentPage === pageCount}
          onClick={() => fetchPage(currentPage + 1)}
        >
          Next
        </Button>
      </div>
      <div className="flex justify-center gap-8 mt-4">
        <div className="flex flex-col">
          <label
            className="text-tremor-default text-tremor-content dark:text-dark-tremor-content text-center mb-2"
            htmlFor="page"
          >
            Page Number
          </label>
          <NumberInput
            id="page"
            max={pageCount}
            min={1}
            name="page"
            onValueChange={value =>
              isNaN(value) || value > pageCount ? null : fetchPage(value)
            }
            placeholder="Page Number"
            value={currentPage}
          />
        </div>
      </div>
    </Card>
  );
}
