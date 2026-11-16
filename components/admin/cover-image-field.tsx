"use client";

import * as React from "react";

interface CoverImageFieldProps {
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
}

export function CoverImageField({ label, file, onChange }: CoverImageFieldProps) {
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const inputId = `${label.toLowerCase()}-cover-image`;

  return (
    <div className="grid gap-2 rounded-lg border border-line-border bg-[#171717] p-4 md:col-span-2">
      <label htmlFor={inputId} className="text-sm font-semibold text-text">
        {label} cover image <span className="font-normal text-muted">(optional)</span>
      </label>
      <input
        id={inputId}
        name="coverImage"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        onChange={(event) => onChange(event.currentTarget.files?.[0] ?? null)}
        className="block w-full cursor-pointer text-sm text-muted file:mr-4 file:rounded-md file:border-0 file:bg-orange file:px-4 file:py-2 file:font-semibold file:text-black hover:file:bg-orange-deep"
      />
      <p className="text-xs text-muted">Choose a landscape photo, up to 10 MB. It will appear in the public {label.toLowerCase()} listing and detail page.</p>
      {previewUrl && (
        <img
          src={previewUrl}
          alt={`${label} cover preview`}
          className="mt-2 aspect-video w-full max-w-2xl rounded-lg border border-line-border object-cover"
        />
      )}
    </div>
  );
}
