import { useCallback, useEffect, useState } from "react";
import { cardRepository } from "@/lib/card/repository";
import type { SavedCardRecord } from "@/lib/card/types";

export function useCardRecords() {
  const [records, setRecords] = useState<SavedCardRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const nextRecords = await cardRepository.getAll();
      setRecords(nextRecords);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, "讀取名片列表失敗"));
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    records,
    isLoading,
    error,
    refresh,
  };
}

export function useCardRecord(id: string | null) {
  const [record, setRecord] = useState<SavedCardRecord | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(id));
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!id) {
      setRecord(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const nextRecord = await cardRepository.getById(id);
      setRecord(nextRecord);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, "讀取名片資料失敗"));
      setRecord(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    record,
    isLoading,
    error,
    refresh,
  };
}

function getErrorMessage(caughtError: unknown, fallback: string) {
  return caughtError instanceof Error ? caughtError.message : fallback;
}
