/**
 * QuraniHub API Service
 *
 * Thin wrapper around the QuraniHub public API (https://api.quranhub.com).
 * Provides Uthmani script pages with word-level data for the Mushaf viewer.
 *
 * Caching Strategy:
 * - Pages cached in localStorage with 30-day TTL (Quran text never changes)
 * - LRU eviction: max 50 pages cached at a time
 * - Pre-fetches adjacent pages (n-1, n+1) for instant swiping
 */

import type { MushafPage } from "@halaqat/types";

const QURANI_BASE_URL = "https://api.quranhub.com/v1";
const CACHE_PREFIX = "mushaf_page_";
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const MAX_CACHED_PAGES = 50;

interface CacheEntry {
  data: MushafPage;
  timestamp: number;
}

/**
 * Get all localStorage keys that are mushaf page cache entries
 */
function getCacheKeys(): string[] {
  if (typeof window === "undefined") return [];
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(CACHE_PREFIX)) {
      keys.push(key);
    }
  }
  return keys;
}

/**
 * Evict oldest entries if cache exceeds MAX_CACHED_PAGES
 */
function evictOldEntries(): void {
  if (typeof window === "undefined") return;
  const keys = getCacheKeys();
  if (keys.length <= MAX_CACHED_PAGES) return;

  // Parse timestamps and sort oldest first
  const entries = keys.map((key) => {
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? (JSON.parse(raw) as CacheEntry) : null;
      return { key, timestamp: parsed?.timestamp ?? 0 };
    } catch {
      return { key, timestamp: 0 };
    }
  });

  entries.sort((a, b) => a.timestamp - b.timestamp);

  // Remove oldest entries until we're at capacity
  const toRemove = entries.length - MAX_CACHED_PAGES;
  entries.slice(0, toRemove).forEach((entry) => {
    localStorage.removeItem(entry.key);
  });
}

/**
 * Read a page from localStorage cache
 */
function readFromCache(pageNumber: number): MushafPage | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${pageNumber}`);
    if (!raw) return null;

    const entry: CacheEntry = JSON.parse(raw);

    // Check TTL
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(`${CACHE_PREFIX}${pageNumber}`);
      return null;
    }

    return entry.data;
  } catch {
    return null;
  }
}

/**
 * Write a page to localStorage cache
 */
function writeToCache(pageNumber: number, data: MushafPage): void {
  if (typeof window === "undefined") return;
  try {
    const entry: CacheEntry = { data, timestamp: Date.now() };
    localStorage.setItem(`${CACHE_PREFIX}${pageNumber}`, JSON.stringify(entry));
    evictOldEntries();
  } catch {
    // localStorage might be full — silently fail
  }
}

/**
 * Fetch a single Mushaf page with word-level data from QuraniHub API
 */
export async function fetchMushafPage(pageNumber: number): Promise<MushafPage> {
  // Validate page range
  if (pageNumber < 1 || pageNumber > 604) {
    throw new Error(`Invalid page number: ${pageNumber}. Must be 1-604.`);
  }

  // Check cache first
  const cached = readFromCache(pageNumber);
  if (cached) return cached;

  // Fetch from QuraniHub API
  const response = await fetch(`${QURANI_BASE_URL}/page/${pageNumber}?words=true`);

  if (!response.ok) {
    throw new Error(`QuraniHub API error: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  const page: MushafPage = json.data;

  // Cache the result
  writeToCache(pageNumber, page);

  return page;
}

/**
 * Pre-fetch adjacent pages for instant swiping.
 * Runs silently in the background — errors are swallowed.
 */
export function prefetchAdjacentPages(currentPage: number): void {
  const pagesToPrefetch = [currentPage - 1, currentPage + 1].filter(
    (p) => p >= 1 && p <= 604
  );

  for (const page of pagesToPrefetch) {
    // Only prefetch if not already cached
    if (!readFromCache(page)) {
      fetchMushafPage(page).catch(() => {
        /* silent */
      });
    }
  }
}

/**
 * Clear all cached Mushaf pages
 */
export function clearMushafCache(): void {
  if (typeof window === "undefined") return;
  const keys = getCacheKeys();
  for (const key of keys) {
    localStorage.removeItem(key);
  }
}
