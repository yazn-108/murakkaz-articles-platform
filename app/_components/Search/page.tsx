"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import PresentationalSearch from "./PresentationalSearch";
const Page = () => {
  const [Open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(handler);
  }, [query]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { data, isFetching } = useQuery({
    queryKey: ["searchArticles", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery) return { articles: [] };
      const res = await axios.get(
        `/api/search/${encodeURIComponent(debouncedQuery)}`,
      );
      return res.data;
    },
    enabled: Open && !!debouncedQuery,
  });
  useEffect(() => {
    document.body.style.overflow = Open ? "hidden" : "auto";
    if (Open && inputRef.current) {
      inputRef.current.focus();
      window.history.pushState({ modal: true }, "");
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [Open]);
  const handleClose = useCallback(() => {
    setOpen(false);
    queryClient.cancelQueries({
      queryKey: ["searchArticles"],
    });
  }, [queryClient]);
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        Open &&
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        handleClose();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };
    const handlePopState = () => {
      handleClose();
    };
    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("popstate", handlePopState);
    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [Open, handleClose]);
  return (
    <PresentationalSearch
      setOpen={setOpen}
      Open={Open}
      containerRef={containerRef}
      inputRef={inputRef}
      query={query}
      setQuery={setQuery}
      data={data}
      isFetching={isFetching}
    />
  );
};
export default Page;
