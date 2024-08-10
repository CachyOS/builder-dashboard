'use client';

import {getPackages} from '@/app/actions';
import {BuilderPackageDatabase} from '@/lib/db';
import {getColor} from '@/lib/util';
import {
  BaseBuilderPackageWithName,
  BuilderPackageArchitecture,
  BuilderPackageRepository,
  BuilderPackageStatus,
  BuilderPackageWithID,
} from '@/types/BuilderPackage';
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
} from '@headlessui/react';
import {CheckedState} from '@radix-ui/react-checkbox';
import {
  RiAddLine,
  RiArrowDownSLine,
  RiArticleLine,
  RiRefreshLine,
  RiRestartLine,
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
import {Fragment, useEffect, useMemo, useState} from 'react';
import {toast} from 'react-toastify';
import {MangoQuery} from 'rxdb';
import {useRxQuery} from 'rxdb-hooks';

import AddPackageModal from './AddPackageModal';
import Checkbox from './Checkbox';
import ConfirmBulkRebuildModal from './ConfirmBulkRebuildModal';
import ConfirmRebuildModal from './ConfirmRebuildModal';

export default function PackageTable({
  db,
  filterStatus,
}: Readonly<{
  db: BuilderPackageDatabase;
  filterStatus?: BuilderPackageStatus;
}>) {
  const [selectedPackages, setSelectedPackages] = useState<
    BaseBuilderPackageWithName[]
  >([]);
  const [checked, setChecked] = useState<CheckedState>(false);
  const [addPkgModalOpen, setAddPkgModalOpen] = useState(false);
  const [bulkRebuildModalOpen, setBulkRebuildModalOpen] = useState(false);
  const [rebuildPackage, setRebuildPackage] = useState<BuilderPackageWithID>();
  const [pkgQuery, setPkgQuery] = useState('');
  const [selectedBuildStatus, setSelectedBuildStatus] = useState<string[]>([]);
  const [selectedRepositories, setSelectedRepositories] = useState<string[]>(
    []
  );
  const [selectedMarch, setSelectedMarch] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState(10);
  useEffect(() => {
    if (filterStatus) {
      setSelectedBuildStatus([filterStatus]);
    }
  }, [filterStatus]);
  const packageCollection = useMemo(() => db.collections.packages, [db]);
  const query = useMemo(() => {
    const searchQuery: MangoQuery<BuilderPackageWithID> = {
      selector: {
        $or: [
          {
            ...(selectedBuildStatus.length
              ? {
                  status: {
                    $in: selectedBuildStatus,
                  },
                }
              : {}),
            ...(pkgQuery.trim().length
              ? {
                  pkgname: {
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
          ...(selectedPackages.length
            ? [
                {
                  $or: selectedPackages.map(pkg => ({
                    march: pkg.march,
                    pkgbase: pkg.pkgbase,
                    repository: pkg.repository,
                  })),
                },
              ]
            : []),
        ],
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
    pageSize,
    pagination: 'Traditional',
  });
  useEffect(() => {
    if (selectedPackages.length === 0) {
      setChecked(false);
    } else if (
      packages.filter(pkg =>
        selectedPackages.some(
          x => x.pkgbase === pkg.pkgbase && x.march === pkg.march
        )
      ).length === packages.length
    ) {
      setChecked(true);
    } else {
      setChecked('indeterminate');
    }
  }, [packages, selectedPackages]);
  return (
    <Card className="p-4 mt-6 h-full flex flex-col gap-2">
      {bulkRebuildModalOpen ? (
        <ConfirmBulkRebuildModal
          isOpen={bulkRebuildModalOpen}
          onClose={() => {
            setBulkRebuildModalOpen(false);
            setSelectedPackages([]);
          }}
          packages={selectedPackages}
        />
      ) : null}
      {addPkgModalOpen ? (
        <AddPackageModal
          isOpen={addPkgModalOpen}
          onClose={() => setAddPkgModalOpen(false)}
        />
      ) : null}
      {rebuildPackage ? (
        <ConfirmRebuildModal
          isOpen={!!rebuildPackage}
          onClose={() => setRebuildPackage(undefined)}
          pkg={rebuildPackage}
        />
      ) : null}
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
            value={selectedBuildStatus}
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
            value={selectedRepositories}
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
            value={selectedMarch}
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
                getPackages().then(data => db.packages.bulkUpsert(data)),
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
          <Button
            className="rounded-tremor-default bg-tremor-brand text-center text-tremor-default font-medium text-tremor-brand-inverted shadow-tremor-input hover:bg-tremor-brand-emphasis dark:bg-dark-tremor-brand dark:text-dark-tremor-brand-inverted dark:shadow-dark-tremor-input dark:hover:bg-dark-tremor-brand-emphasis"
            icon={RiAddLine}
            onClick={() => setAddPkgModalOpen(true)}
          >
            Add Package
          </Button>
          <Menu
            as="div"
            className="relative text-left z-50 data-[visible=true]:inline-block data-[visible=false]:hidden"
            data-visible={selectedPackages.length !== 0}
          >
            <div>
              <MenuButton className="inline-flex w-full justify-center rounded-md bg-black dark:bg-white dark:text-black text-white px-4 py-2 text-sm font-medium hover:bg-opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75">
                Options
                <RiArrowDownSLine
                  aria-hidden="true"
                  className="ml-2 -mr-1 h-5 w-5 dark:text-black text-white"
                />
              </MenuButton>
            </div>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <MenuItems className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white dark:bg-black dark:text-white text-black shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="px-1 py-1 ">
                  <MenuItem>
                    <button
                      className="dark:ui-active:bg-white ui-active:bg-black ui-active:text-white dark:ui-active:text-black group flex w-full items-center rounded-md px-2 py-2 text-sm"
                      onClick={() => setBulkRebuildModalOpen(true)}
                    >
                      <RiRestartLine
                        aria-hidden="true"
                        className="mr-2 h-5 w-5 dark:ui-active:bg-white ui-active:bg-black ui-active:stroke-white dark:ui-active:stroke-black stroke-black dark:stroke-white fill-black dark:fill-white ui-active:fill-white dark:ui-active:fill-black"
                      />
                      Rebuild
                    </button>
                  </MenuItem>
                </div>
              </MenuItems>
            </Transition>
          </Menu>
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
              <Checkbox
                checked={checked}
                onCheckedChange={status => {
                  if (status === true) {
                    setSelectedPackages(
                      selectedPackages.concat(
                        packages.map(pkg => ({
                          march: pkg.march,
                          pkgbase: pkg.pkgbase,
                          pkgname: pkg.pkgname,
                          repository: pkg.repository,
                        }))
                      )
                    );
                  } else if (status === false) {
                    setSelectedPackages(
                      selectedPackages.filter(
                        x =>
                          packages.findIndex(
                            pkg =>
                              x.pkgbase === pkg.pkgbase && x.march === pkg.march
                          ) === -1
                      )
                    );
                  }
                }}
              />
            </TableHeaderCell>
            <TableHeaderCell className="text-tremor-content-strong dark:text-dark-tremor-content-strong">
              Name
            </TableHeaderCell>
            <TableHeaderCell className="text-tremor-content-strong dark:text-dark-tremor-content-strong">
              Arch
            </TableHeaderCell>
            <TableHeaderCell className="text-tremor-content-strong dark:text-dark-tremor-content-strong">
              Version
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
            <TableHeaderCell className="text-tremor-content-strong dark:text-dark-tremor-content-strong text-right">
              Rebuild
            </TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {packages.map(pkg => (
            <TableRow key={pkg.packageID}>
              <TableCell>
                <Checkbox
                  checked={selectedPackages.some(
                    x => x.pkgbase === pkg.pkgbase && x.march === pkg.march
                  )}
                  onCheckedChange={checked =>
                    setSelectedPackages(
                      checked
                        ? [
                            ...selectedPackages,
                            {
                              march: pkg.march,
                              pkgbase: pkg.pkgbase,
                              pkgname: pkg.pkgname,
                              repository: pkg.repository,
                            },
                          ]
                        : selectedPackages.filter(
                            x =>
                              x.pkgbase !== pkg.pkgbase || x.march !== pkg.march
                          )
                    )
                  }
                />
              </TableCell>
              <TableCell>
                {pkg.pkgname} ({pkg.pkgbase})
              </TableCell>
              <TableCell>{pkg.march}</TableCell>
              <TableCell>{pkg.version}</TableCell>
              <TableCell>{pkg.repository}</TableCell>
              <TableCell>
                <Badge color={getColor(pkg.status)}>{pkg.status}</Badge>
              </TableCell>
              <TableCell className="text-right">
                {new Date(pkg.updated * 1000).toLocaleString()}
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
              <TableCell className="text-right">
                <Button
                  className="text-dark-tremor-content-strong dark:text-tremor-content-strong dark:bg-white bg-black hover:bg-gray-700 dark:hover:bg-gray-200 text-right"
                  icon={RiRestartLine}
                  onClick={() => setRebuildPackage(pkg)}
                >
                  Rebuild
                </Button>
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
        <div className="flex flex-col gap-y-2">
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
          <label
            className="text-tremor-default text-tremor-content dark:text-dark-tremor-content text-center mb-2"
            htmlFor="pageSize"
          >
            Page Size
          </label>
          <NumberInput
            id="pageSize"
            max={50}
            min={1}
            name="pageSize"
            onValueChange={value =>
              isNaN(value) || value > 50 || value < 1
                ? null
                : setPageSize(value)
            }
            placeholder="Page Size"
            value={pageSize}
          />
        </div>
      </div>
    </Card>
  );
}
