import {getPackageLog} from '@/app/actions';
import {BuilderPackageArchitecture} from '@/types/BuilderPackage';
import {NextRequest, NextResponse} from 'next/server';

export async function GET(
  _: NextRequest,
  context: {
    params: {
      march: BuilderPackageArchitecture;
      pkgbase: string;
    };
  }
) {
  const {march, pkgbase} = context.params;
  if (!march || !pkgbase) {
    return new NextResponse('Not found', {status: 404});
  }
  if (!Object.values(BuilderPackageArchitecture).includes(march)) {
    return new NextResponse('Not found', {status: 404});
  }
  const log = await getPackageLog(pkgbase, march);
  return new NextResponse(log, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}

export const runtime = 'edge';
