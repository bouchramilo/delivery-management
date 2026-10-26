export type ApiErrorPayload = {
  error?: { code?: string; message?: string };
};

export async function apiFetch<T>(
  input: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const data = (await response.json().catch(() => ({}))) as T & ApiErrorPayload;

  if (!response.ok) {
    const message =
      data.error?.message ?? `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data;
}
