import { useMemo, useState } from "react";

export const DEFAULT_PAGE_SIZE = 10;

export function usePagination<T>(items: T[], pageSize = DEFAULT_PAGE_SIZE) {
  const [page, setPage] = useState(1);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;

  const pageItems = useMemo(
    () => items.slice(start, start + pageSize),
    [items, start, pageSize]
  );

  function goToPage(next: number) {
    setPage(Math.min(Math.max(1, next), totalPages));
  }

  function resetPage() {
    setPage(1);
  }

  return {
    page: safePage,
    setPage: goToPage,
    resetPage,
    totalPages,
    pageItems,
    pageSize,
    totalItems,
    rangeStart: totalItems === 0 ? 0 : start + 1,
    rangeEnd: Math.min(start + pageSize, totalItems),
  };
}
