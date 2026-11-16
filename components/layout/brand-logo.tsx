import Image from "next/image";

interface BrandLogoProps {
  height?: number;
  className?: string;
  preload?: boolean;
}

export function BrandLogo({ height = 40, className = "", preload = false }: BrandLogoProps) {
  const width = (height * 2156) / 719;

  return (
    <span className={`psr-brand-logo ${className}`} style={{ height, width }}>
      <Image
        src="/psr-logo.png"
        alt="PSR Photographic Society logo"
        fill
        sizes={`${Math.ceil(width)}px`}
        preload={preload}
      />
      <span className="psr-brand-logo-ink" aria-hidden="true" />
    </span>
  );
}

interface BrandSymbolProps {
  size: number;
  className?: string;
}

export function BrandSymbol({ size, className = "" }: BrandSymbolProps) {
  return (
    <span className={`psr-brand-symbol ${className}`} style={{ width: size, height: size }}>
      <Image src="/psr-icon.png" alt="" aria-hidden="true" fill sizes={`${size}px`} />
      <span className="psr-brand-symbol-ink" aria-hidden="true" />
    </span>
  );
}
