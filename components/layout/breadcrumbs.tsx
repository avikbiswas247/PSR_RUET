interface BreadcrumbsProps {
  items: { label: string; href: string }[];
  className?: string;
}

export function Breadcrumbs({
  items,
  className,
}: BreadcrumbsProps) {
  if (items.length <= 1) return null;
  return (
    <nav
      aria-label="Breadcrumb"
      className={`breadcrumbs text-[10px] uppercase tracking-wider text-muted ${className || ""}`}
    >
      <ol className="flex gap-2" style={{ listStyle: "none" }}>
        {items.map((item, index) => (
          <li key={item.href} className="flex items-center gap-2">
            {index > 0 && <span>/</span>}
            <a href={item.href}>{item.label}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
