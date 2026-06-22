"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
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
  const { data } = useQuery({
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
    window.history.pushState({ modal: true }, "");
    if (Open && inputRef.current) inputRef.current.focus();
    const handleSearchBarClose = (event: MouseEvent | KeyboardEvent) => {
      if (
        (event as KeyboardEvent).key === "Escape" ||
        (containerRef.current &&
          !containerRef.current.contains(event.target as Node))
      ) {
        setOpen(false);
        queryClient.cancelQueries({ queryKey: ["searchArticles", query] });
      }
    };
    document.addEventListener("click", handleSearchBarClose);
    document.addEventListener("keydown", handleSearchBarClose);
    return () => {
      document.removeEventListener("click", handleSearchBarClose);
      document.removeEventListener("keydown", handleSearchBarClose);
      document.body.style.overflow = "auto";
    };
  }, [Open, query, queryClient]);
  return (
    <PresentationalSearch
      setOpen={setOpen}
      Open={Open}
      containerRef={containerRef}
      inputRef={inputRef}
      query={query}
      setQuery={setQuery}
      data={data}
    />
  );
};
export default Page;
