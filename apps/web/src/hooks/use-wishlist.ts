"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

const STORAGE_KEY = "ookf_wishlist";
const EMPTY_IDS: string[] = [];

type Listener = () => void;

let listeners = new Set<Listener>();
let cachedIds: string[] = EMPTY_IDS;

function readIds(): string[] {
  if (typeof window === "undefined") return EMPTY_IDS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_IDS;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return EMPTY_IDS;
    const ids = parsed.filter((id): id is string => typeof id === "string");
    return ids.length === 0 ? EMPTY_IDS : ids;
  } catch {
    return EMPTY_IDS;
  }
}

function getSnapshot(): string[] {
  return cachedIds;
}

function getServerSnapshot(): string[] {
  return EMPTY_IDS;
}

function emit() {
  cachedIds = readIds();
  listeners.forEach((listener) => listener());
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function writeIds(ids: string[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  emit();
}

export function useWishlist() {
  const ids = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    cachedIds = readIds();
    setHydrated(true);
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) emit();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const isSaved = useCallback(
    (productId: string) => ids.includes(productId),
    [ids]
  );

  const toggle = useCallback((productId: string) => {
    const current = readIds();
    const next = current.includes(productId)
      ? current.filter((id) => id !== productId)
      : [...current, productId];
    writeIds(next.length === 0 ? [] : next);
  }, []);

  return {
    ids,
    hydrated,
    isSaved,
    toggle,
    count: ids.length,
  };
}
