import { PresentationalSearchProps } from "@/types/Search";
import Link from "next/link";
import React from "react";
import { createPortal } from "react-dom";
const PresentationalSearch: React.FC<PresentationalSearchProps> = ({
  setOpen,
  Open,
  containerRef,
  inputRef,
  query,
  setQuery,
  data,
  isFetching,
}) => {
  console.log(isFetching);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-foreground cursor-pointer bg-primary hover:bg-primary/35 transition-all flex items-center gap-1 outline-none font-medium rounded-lg text-sm px-3 py-2"
      >
        <span className="sr-only sm:not-sr-only">ابحث في المدونة</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="size-6 relative -top-[1.5px]"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m15.75 15.75-2.489-2.489m0 0a3.375 3.375 0 1 0-4.773-4.773 3.375 3.375 0 0 0 4.774 4.774ZM21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
      </button>
      {Open &&
        createPortal(
          <div className="fixed backdrop-blur-xl w-full h-dvh left-0 top-0 z-50 p-5 flex justify-center items-start">
            <div
              ref={containerRef}
              className="w-full md:w-[60%] mx-auto space-y-5 p-5 rounded bg-gray-900"
            >
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full border-2 border-primary h-10 rounded outline-0 bg-gray-800 py-2 px-5"
                placeholder="ابحث بين المقالات"
              />
              {isFetching ? (
                <div className="flex justify-center items-center">
                  <svg
                    className="animate-spin h-5 w-5 text-primary"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.046 1.137 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </div>
              ) : (
                <ul className="space-y-1 overflow-y-auto max-h-52 bg-gray-800 rounded">
                  {data?.articles.length ? (
                    data.articles.map((article) => (
                      <li onClick={() => setOpen(false)} key={article.slug}>
                        <Link
                          href={`/article/${article.slug}`}
                          className="block rounded-lg px-4 py-2 text-sm font-medium text-gray-400 hover:bg-gray-700 hover:text-gray-200 transition-all"
                        >
                          {article.title}
                        </Link>
                      </li>
                    ))
                  ) : query ? (
                    <li className="px-4 py-2 text-sm text-gray-500">
                      لا توجد نتائج
                    </li>
                  ) : null}
                </ul>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};
export default PresentationalSearch;
