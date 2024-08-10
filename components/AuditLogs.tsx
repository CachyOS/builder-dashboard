'use client';

import {getAuditLogs} from '@/app/actions';
import {BuilderPackageDatabase} from '@/lib/db';
import {parseAuditLogEntry} from '@/lib/util';
import {
  AuditLogEventName,
  DistinctAuditLogUsers,
  ParsedAuditLogWithID,
} from '@/types/AuditLog';
import {
  BuilderPackageArchitecture,
  BuilderPackageRepository,
} from '@/types/BuilderPackage';
import {RiRefreshLine, RiSearchLine, RiSoundModuleFill} from '@remixicon/react';
import {
  Accordion,
  AccordionBody,
  AccordionHeader,
  AccordionList,
  Badge,
  Button,
  Card,
  Icon,
  List,
  ListItem,
  MultiSelect,
  MultiSelectItem,
  NumberInput,
  TextInput,
} from '@tremor/react';
import {useEffect, useMemo, useState} from 'react';
import {toast} from 'react-toastify';
import {MangoQuery} from 'rxdb';
import {useRxQuery} from 'rxdb-hooks';

export default function AuditLogs({
  db,
}: Readonly<{db: BuilderPackageDatabase}>) {
  const [pkgQuery, setPkgQuery] = useState('');
  const [distinctUsers, setDistinctUsers] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<string[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [selectedRepositories, setSelectedRepositories] = useState<string[]>(
    []
  );
  const [selectedMarch, setSelectedMarch] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState(10);
  const auditLogCollection = useMemo(() => db.collections.audit_logs, [db]);
  useEffect(() => {
    auditLogCollection
      .getLocal$<DistinctAuditLogUsers>('users')
      .subscribe(data => {
        if (data) {
          setDistinctUsers(data.get('users') ?? []);
        }
      });
  }, [db]);
  const query = useMemo(() => {
    const searchQuery: MangoQuery<ParsedAuditLogWithID> = {
      selector: {
        ...(selectedUser.length
          ? {
              username: {
                $in: selectedUser,
              },
            }
          : {}),
        ...(pkgQuery.trim().length
          ? {
              'packages.pkgbase': {
                $options: 'ig',
                $regex: pkgQuery.trim(),
              },
            }
          : {}),
        ...(selectedRepositories.length
          ? {
              'packages.repository': {
                $in: selectedRepositories,
              },
            }
          : {}),
        ...(selectedMarch.length
          ? {
              'packages.march': {
                $in: selectedMarch,
              },
            }
          : {}),
        ...(selectedEvents.length
          ? {
              event_name: {
                $in: selectedEvents,
              },
            }
          : {}),
      },
    };
    return auditLogCollection.find(searchQuery).sort({
      updated: 'desc',
    });
  }, [
    auditLogCollection,
    pkgQuery,
    selectedUser,
    selectedRepositories,
    selectedMarch,
    selectedEvents,
  ]);
  const {
    currentPage,
    fetchPage,
    pageCount,
    result: auditLogs,
  } = useRxQuery(query, {
    pageSize,
    pagination: 'Traditional',
  });
  return (
    <Card className="p-4 mt-6 h-full flex flex-col gap-2">
      <div className="mt-4 flex flex-col sm:flex-row sm:justify-start md:gap-8 gap-4 flex-wrap">
        <div className="max-w-full sm:max-w-xs flex w-full">
          <MultiSelect
            className="max-w-full sm:max-w-xs"
            icon={RiSoundModuleFill}
            onValueChange={events => {
              if (currentPage !== 1) {
                fetchPage(1);
              }
              setSelectedEvents(events);
            }}
            placeholder="Filter by event"
          >
            {Object.values(AuditLogEventName).map(event => (
              <MultiSelectItem key={event} value={event}>
                {event}
              </MultiSelectItem>
            ))}
          </MultiSelect>
        </div>
        <div className="max-w-full sm:max-w-xs flex w-full">
          <MultiSelect
            className="max-w-full sm:max-w-xs"
            icon={RiSoundModuleFill}
            onValueChange={users => {
              if (currentPage !== 1) {
                fetchPage(1);
              }
              setSelectedUser(users);
            }}
            placeholder="Filter by user"
          >
            {distinctUsers.map(user => (
              <MultiSelectItem key={user} value={user}>
                {user}
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
                getAuditLogs().then(data => {
                  if (data.length) {
                    let users: string[] = [];
                    data.forEach(log => {
                      if (!users.includes(log.username)) {
                        users.push(log.username);
                      }
                      db.audit_logs.upsert(parseAuditLogEntry(log));
                    });
                    return db.audit_logs.upsertLocal<DistinctAuditLogUsers>(
                      'users',
                      {users}
                    );
                  }
                }),
                {
                  error: 'Failed to refresh audit logs',
                  pending: 'Refreshing audit logs...',
                  success: 'Audit logs refreshed!',
                }
              )
            }
          >
            Refresh Logs
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
      <AccordionList>
        {auditLogs.map(log => (
          <Accordion className="rounded-lg" key={log.auditLogID}>
            <AccordionHeader className="text-sm font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
              <Icon
                icon={RiRefreshLine}
                color="gray"
                variant="solid"
                tooltip={log.event_name}
                size="lg"
              />
              <div
                className="relative right-3 top-6 h-5 w-5 rounded-lg data-[show=false]:invisible"
                data-show={log.packages.length > 1}
              >
                x{log.packages.length}
              </div>
              <div className="my-auto pl-4">
                {log.username} performed {log.event_name} on{' '}
                {log.packages.length > 3
                  ? `${log.packages
                      .slice(3)
                      .map(pkg => pkg.pkgbase)
                      .join(', ')} and ${log.packages.length - 3} more`
                  : log.packages.map(pkg => pkg.pkgbase).join(', ')}{' '}
                at {new Date(log.updated).toLocaleString()}
              </div>
            </AccordionHeader>
            <AccordionBody className="leading-6">
              <Accordion className="mb-2 rounded-lg">
                <AccordionHeader className="text-sm font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                  Parsed Event Description
                </AccordionHeader>
                <AccordionBody className="leading-6">
                  <div className="flex gap-2 flex-wrap">
                    {log.packages.map(pkg => (
                      <Card className="flex w-72 flex-col" key={pkg.pkgbase}>
                        <List>
                          <ListItem>
                            <span className="font-semibold">Package:</span>
                            <span className="decoration-dotted underline">
                              {pkg.pkgbase}
                            </span>
                          </ListItem>
                          <ListItem>
                            <span className="font-semibold">Repository:</span>
                            <span className="decoration-dotted underline">
                              {pkg.repository}
                            </span>
                          </ListItem>
                          <ListItem>
                            <span className="font-semibold">Architecture:</span>
                            <span className="decoration-dotted underline">
                              {pkg.march}
                            </span>
                          </ListItem>
                        </List>
                      </Card>
                    ))}
                  </div>
                </AccordionBody>
              </Accordion>
              <Accordion className="mt-2 rounded-lg">
                <AccordionHeader className="text-sm font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong">
                  Raw Event Description
                </AccordionHeader>
                <AccordionBody className="leading-6">
                  <p className="font-mono">{log.event_desc}</p>
                </AccordionBody>
              </Accordion>
            </AccordionBody>
          </Accordion>
        ))}
      </AccordionList>
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
