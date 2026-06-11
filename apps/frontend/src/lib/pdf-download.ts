"use client";

import { api } from "@/lib/api";
import type { AxiosError } from "axios";

export async function downloadAuthenticatedPdf(
  path: string,
  filename: string,
) {
  const response = await api.get<Blob>(path, { responseType: "blob" });
  triggerBlobDownload(response.data, filename);
}

export async function downloadAuthenticatedFile(
  path: string,
  filename: string,
) {
  try {
    const response = await api.get<Blob>(path, { responseType: "blob" });
    triggerBlobDownload(response.data, filename);
  } catch (error) {
    throw new Error(await readDownloadError(error, "Could not download file."));
  }
}

export async function downloadPortalPdf({
  path,
  filename,
  token,
  baseUrl,
}: {
  path: string;
  filename: string;
  token: string;
  baseUrl: string;
}) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || "Could not download PDF.");
  }

  triggerBlobDownload(await response.blob(), filename);
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = sanitizeFilename(filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function sanitizeFilename(filename: string) {
  return filename.replace(/[\\/:*?"<>|]+/g, "-");
}

async function readDownloadError(error: unknown, fallback: string): Promise<string> {
  const response = (error as AxiosError<Blob>)?.response;
  const data = response?.data;

  if (data instanceof Blob) {
    const text = await data.text().catch(() => "");
    if (text) {
      try {
        const parsed = JSON.parse(text) as { message?: string | string[] };
        if (Array.isArray(parsed.message)) return parsed.message[0] ?? fallback;
        if (parsed.message) return parsed.message;
      } catch {
        return text.slice(0, 240);
      }
    }
  }

  return error instanceof Error && error.message ? error.message : fallback;
}
