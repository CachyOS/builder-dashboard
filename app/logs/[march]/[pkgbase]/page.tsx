import Loader from '@/components/Loader';
import {BuilderPackageArchitecture} from '@/types/BuilderPackage';
import dynamic from 'next/dynamic';

const TerminalComponent = dynamic(
  () => import('@/components/TerminalComponent'),
  {
    loading: () => <Loader text="Loading CachyTerm..." />,
    ssr: false,
  }
);

export default function LogsPage({
  params,
}: Readonly<{
  params: {
    march: BuilderPackageArchitecture;
    pkgbase: string;
  };
}>) {
  const {march, pkgbase} = params;
  if (!march || !pkgbase) {
    return <Loader animate={false} text="Invalid MARCH or PKGBASE" />;
  }
  if (!Object.values(BuilderPackageArchitecture).includes(march)) {
    return (
      <Loader
        animate={false}
        text={`Invalid MARCH, valid MARCH: ${Object.values(BuilderPackageArchitecture).join(', ')}, got: ${march}`}
      />
    );
  }
  return (
    <div className="h-full w-full min-h-screen flex">
      <TerminalComponent march={march} pkgbase={pkgbase} />
    </div>
  );
}
