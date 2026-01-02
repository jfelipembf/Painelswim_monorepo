import { useCallback, useMemo, useState } from "react";

export const useSearchFilter = (
  data = [],
  searchableKeys = [],
  { hasMore = false, loadMore } = {}
) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    const lower = searchTerm.toLowerCase();
    return data.filter((item) =>
      searchableKeys.some((key) =>
        String(item?.[key] || "").toLowerCase().includes(lower)
      )
    );
  }, [data, searchableKeys, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, pageSize, currentPage]);

  const pageNumbers = useMemo(() => {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }, [totalPages]);

  const loadNextPage = useCallback(() => {
    if (hasMore && typeof loadMore === "function") {
      loadMore();
    }
  }, [hasMore, loadMore]);

  return {
    searchTerm,
    setSearchTerm,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    paginatedData,
    totalPages,
    pageNumbers,
    loadNextPage,
  };
};
