import { PresentationalArticlesProps } from "@/types/Articles";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import ArticlesState from "./_components/ArticlesState";
const ArticleImage = dynamic(() => import("./_components/ArticleImage"), {
  ssr: false,
  loading: () => (
    <div className=" w-full h-75 rounded-2xl aspect-video bg-gray-600 animate-pulse" />
  ),
});
const PresentationalArticles: React.FC<PresentationalArticlesProps> = ({
  isError,
  isLoading,
  articles,
  hasNextPage,
  inViewRef,
  admin,
}) => {
  const router = useRouter();
  return (
    <>
      {isLoading && (
        <ArticlesState>
          <ArticlesState.loading />
        </ArticlesState>
      )}
      {isError && (
        <ArticlesState>
          <ArticlesState.error />
        </ArticlesState>
      )}
      {articles.length === 0 && !isLoading && (
        <ArticlesState>
          <ArticlesState.empty />
        </ArticlesState>
      )}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 px-0 py-5 sm:p-5 gap-x-10 gap-y-16">
        {articles.map((article, i: number) => (
          <div key={article._id} className="space-y-4">
            <Link
              href={
                !admin
                  ? `/article/${article.slug}`
                  : `/dashboard/article/${article.slug}`
              }
              onMouseEnter={() => router.prefetch(`/article/${article.slug}`)}
              className="block"
            >
              <ArticleImage banner={article.banner} i={i} />
            </Link>
            <p className="flex justify-center items-center gap-5">
              <span className="text-secondary/75">
                {new Date(article.createdAt).toLocaleDateString("en-GB")}
              </span>
              <Link
                href={`/tags/${article.tag}`}
                className="capitalize truncate max-w-32 text-secondary bg-[#1e293999] hover:bg-[#1e2939] py-1 px-4 rounded-2xl transition-all"
              >
                {article.tag}
              </Link>
            </p>
            <Link
              href={
                !admin
                  ? `/article/${article.slug}`
                  : `/dashboard/article/${article.slug}`
              }
              onMouseEnter={() => router.prefetch(`/article/${article.slug}`)}
            >
              <h2 className="text-xl font-bold mt-2 mb-4 truncate max-w-full">
                {article.title}
              </h2>
              <p className="line-clamp-3 text-secondary max-w-full">
                {article.description}
              </p>
            </Link>
          </div>
        ))}
      </section>
      {hasNextPage && (
        <div ref={inViewRef} className="w-full h-40">
          {/* {isFetchingNextPage ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="text-secondary">جاري تحميل المزيد...</span>
            </div>
          ) : (
            <div className="text-secondary">اسحب لأسفل لتحميل المزيد</div>
          )} */}
        </div>
      )}
    </>
  );
};
export default PresentationalArticles;
