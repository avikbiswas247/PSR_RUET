"use client";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: { label: string; href: string };
  icon?: string;
}

export function EmptyState({
  title,
  description,
  action,
  icon = "\u260E",
}: EmptyStateProps) {
  return (
    <div className="empty-state flex flex-col items-center justify-center py-24 px-6 text-center">
      <span className="text-6xl mb-6 opacity-50" aria-hidden="true">
        {icon}
      </span>
      <h2 className="text-[32px] tracking-tight font-bold mb-4">{title}</h2>
      {description && (
        <p className="text-muted text-lg max-w-[420px] mb-8">{description}</p>
      )}
      {action && (
        <a href={action.href} className="button button-primary">
          {action.label}
        </a>
      )}
    </div>
  );
}
