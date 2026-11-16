export async function uploadAdminImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);

  const response = await fetch("/api/media/upload", {
    method: "POST",
    body: form,
  });
  const result = (await response.json().catch(() => ({}))) as {
    data?: { url?: unknown };
    error?: { message?: string };
  };

  if (!response.ok || typeof result.data?.url !== "string") {
    throw new Error(result.error?.message || "Image upload failed. Please try again.");
  }

  return result.data.url;
}
