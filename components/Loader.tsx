import Image from 'next/image';

export function LogoLoader({animate = true}: Readonly<{animate?: boolean}>) {
  return (
    <Image
      alt="CachyOS Logo"
      className="invert dark:invert-0 motion-safe:data-[animate=true]:animate-pulse"
      data-animate={animate}
      height={128}
      priority
      src="/logo.png"
      width={128}
    />
  );
}

export default function Loader({
  animate = true,
  text,
}: Readonly<{animate?: boolean; text?: string}>) {
  return (
    <div className="flex flex-col gap-2 w-full justify-center items-center min-h-screen">
      <LogoLoader animate={animate} />
      <p className="text-tremor-content-strong dark:text-dark-tremor-content-strong text-center">
        {text}
      </p>
    </div>
  );
}
