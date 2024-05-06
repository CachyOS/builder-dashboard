import Image from 'next/image';

export default function Loader() {
  return (
    <Image
      alt="CachyOS Logo"
      className="invert dark:invert-0 motion-safe:animate-pulse"
      height={128}
      src="/logo.png"
      width={128}
      priority
    />
  );
}
