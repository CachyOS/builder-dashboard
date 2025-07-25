import {NextRequest, NextResponse} from 'next/server';

import {getPackageLog} from '@/app/actions';
import {PackageMArch, packageMArchValues} from '@/lib/typings';

export async function GET(
  req: NextRequest,
  context: {
    params: {
      march: PackageMArch;
      pkgbase: string;
    };
  }
) {
  const {march, pkgbase} = context.params;
  if (!march || !pkgbase) {
    return new NextResponse('Not found', {status: 404});
  }
  if (!packageMArchValues.includes(march)) {
    return new NextResponse('Not found', {status: 404});
  }
  const log = await getPackageLog(pkgbase, march, true);
  if (typeof log !== 'string') {
    return new NextResponse('Not found', {status: 404});
  }
  return new NextResponse(log, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}

export const runtime = 'edge';
