import { useState, useEffect, useCallback } from "react";

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useFetch<T>(url: string, pollIntervalMs = 10_000): FetchState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status} ${res.statusText}: ${text}`);
      }
      const json = (await res.json()) as T;
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    setLoading(true);
    void fetchData();
    const interval = setInterval(() => void fetchData(), pollIntervalMs);
    return () => clearInterval(interval);
  }, [fetchData, pollIntervalMs]);

  return { data, loading, error, refetch: fetchData };
}

export function useServerHealth(): "online" | "offline" | "loading" {
  const [status, setStatus] = useState<"online" | "offline" | "loading">("loading");

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/health");
        setStatus(res.ok ? "online" : "offline");
      } catch {
        setStatus("offline");
      }
    };
    void check();
    const interval = setInterval(() => void check(), 15_000);
    return () => clearInterval(interval);
  }, []);

  return status;
}
