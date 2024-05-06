'use client';

import {BaseBuilderPackageWithName} from '@/types/BuilderPackage';
import {
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHeaderCell,
  TableRow,
} from '@tremor/react';
import {useMemo, useState} from 'react';

export function BasePackageList({
  packages,
  title,
}: Readonly<{
  packages: BaseBuilderPackageWithName[];
  title?: string;
}>) {
  const [showAll, setShowAll] = useState(false);
  const pkgs = useMemo(
    () => (showAll ? packages : packages.slice(0, 5)),
    [packages, showAll]
  );
  return (
    <Card className="mx-auto w-full">
      <h3 className="text-tremor-content-strong dark:text-dark-tremor-content-strong font-medium">
        {title}
      </h3>
      <Table className="mt-2">
        <TableRow className="border-b border-tremor-border dark:border-dark-tremor-border">
          <TableHeaderCell className="text-tremor-content-strong dark:text-dark-tremor-content-strong">
            Base (Name)
          </TableHeaderCell>
          <TableHeaderCell className="text-tremor-content-strong dark:text-dark-tremor-content-strong">
            Arch
          </TableHeaderCell>
          <TableHeaderCell className="text-tremor-content-strong dark:text-dark-tremor-content-strong text-right">
            Repository
          </TableHeaderCell>
        </TableRow>
        <TableBody>
          {pkgs.map(item => (
            <TableRow
              key={item.pkgbase + item.pkgname + item.march + item.repository}
            >
              <TableCell>
                {item.pkgbase} ({item.pkgname})
              </TableCell>
              <TableCell>{item.march}</TableCell>
              <TableCell className="text-right">{item.repository}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Button
        className="w-full"
        type="button"
        onClick={() => setShowAll(!showAll)}
      >
        Show {showAll ? 'less' : 'more'}
      </Button>
    </Card>
  );
}
