"use client";
import Calendar from "@/app/dashboard/_components/Calendar";
import { Input, Textarea } from "@/app/dashboard/_components/FormElements";
import HandleUploadImage from "@/hooks/HandleUploadImage";
import { ArticleBlock, ArticleTY } from "@/types/Articles";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { Activity, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
const EditArticle = ({ article }: { article: ArticleTY }) => {
  const queryClient = useQueryClient();
  const [IsOpen, setIsOpen] = useState<boolean>(false);
  const [newArticleLoader, setNewArticleLoader] = useState<boolean>(false);
  const router = useRouter();
  const [deleteBlocksImageByIds, setDeleteBlocksImageByIds] = useState<
    string[]
  >([]);
  const [articleBlocks, setArticleBlocks] = useState<ArticleBlock[]>(
    article.blocks || ([] as ArticleBlock[]),
  );
  const moveBlock = ({
    index,
    direction,
  }: {
    index: number;
    direction: "up" | "down";
  }) => {
    setArticleBlocks((prev) => {
      const newBlocks = [...prev];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newBlocks.length) return prev;
      [newBlocks[index], newBlocks[targetIndex]] = [
        newBlocks[targetIndex],
        newBlocks[index],
      ];
      return newBlocks;
    });
  };
  const EditArticleInfo = useMutation({
    mutationFn: (data: {
      updatedArticle: ArticleTY;
      deleteBlocksImageByIds?: string[];
    }) =>
      axios
        .put(`/api/admin/articles/${article.slug}`, data)
        .then((res) => res.data),
    onSuccess: (res) => {
      toast.success(res.message);
      setNewArticleLoader(false);
      setIsOpen(false);
      queryClient.invalidateQueries({ queryKey: ["articles"] });
    },
    onError: (err: AxiosError) => {
      const data = err.response?.data as { error: string };
      toast.error(data.error);
      setNewArticleLoader(false);
    },
  });
  const SendNotifications = useMutation({
    mutationFn: ({ slug, title }: { slug: string; title: string }) =>
      axios
        .post(`/api/admin/newsletter`, { slug, title })
        .then((res) => res.data),
    onSuccess: (res) => {
      toast.success(res.message);
    },
    onError: (err: AxiosError) => {
      const data = err.response?.data as { error: string };
      toast.error(data.error);
    },
  });
  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setNewArticleLoader(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    const bannerFile = data.banner as File;
    const image =
      bannerFile.size > 0
        ? await HandleUploadImage({
            file: bannerFile,
            public_id: article.banner.alt,
          })
        : null;
    const utcMidnight = new Date(
      Date.UTC(
        new Date(data.createdAt as string).getUTCFullYear(),
        new Date(data.createdAt as string).getUTCMonth(),
        new Date(data.createdAt as string).getUTCDate(),
      ),
    );
    const finalBlocks = await Promise.all(
      articleBlocks.map(async (block, index) => {
        const title = data[`block-${index}-title`] as string;
        const content = data[`block-${index}-content`] as string;
        const imageAlt = data[`block-${index}-image-alt`] as string;
        const imageFile = data[`block-${index}-image-file`] as File;
        const blockImage =
          imageFile.size > 0 && imageAlt
            ? await HandleUploadImage({
                file: imageFile,
                public_id: articleBlocks[index].image?.public_id,
              })
            : null;
        const codeLanguage = data[`block-${index}-code-language`] as string;
        const codeContent = data[`block-${index}-code-content`] as string;
        return {
          id: block.id,
          title: title || null,
          content: content || null,
          code:
            codeLanguage && codeContent
              ? {
                  language: codeLanguage,
                  content: codeContent,
                }
              : null,
          image:
            blockImage?.public_id && blockImage.secure_url && imageAlt
              ? {
                  alt: imageAlt,
                  public_id: blockImage.public_id,
                  url: blockImage.secure_url,
                }
              : block.image?.public_id && block.image.url && imageAlt
                ? {
                    alt: imageAlt,
                    public_id: block.image.public_id,
                    url: block.image.url,
                  }
                : null,
        };
      }),
    ).then((blocks) =>
      blocks.filter(
        (block) => block.title || block.content || block.image || block.code,
      ),
    );
    const articleData: ArticleTY = {
      ...article,
      slug: (data.slug as string) ?? article.slug,
      title: (data.title as string) ?? article.title,
      tag: (data.tag as string).toLowerCase() ?? article.tag,
      description: (data.description as string) ?? article.description,
      createdAt: utcMidnight,
      SubscribersNotified: data["subscribers-notified"] === "on",
      banner: {
        url: image?.secure_url ?? article.banner.url,
        public_id: image?.public_id ?? article.banner.public_id,
        alt: (data["banner-description"] as string) ?? article.banner.alt,
      },
      blocks: finalBlocks,
    };
    if (JSON.stringify(articleData) !== JSON.stringify(article)) {
      EditArticleInfo.mutate(
        {
          updatedArticle: articleData,
          deleteBlocksImageByIds,
        },
        {
          onSuccess: () => {
            if (
              !article.SubscribersNotified &&
              articleData.SubscribersNotified
            ) {
              SendNotifications.mutate({
                slug: articleData.slug,
                title: articleData.title,
              });
            }
            router.prefetch(`/dashboard/article/${article.slug}`);
            router.push(`/dashboard/article/${article.slug}`);
          },
        },
      );
      setIsOpen(false);
    } else {
      toast.warning("لم يتم إجراء أي تغييرات على المقالة");
      setNewArticleLoader(false);
    }
  };
  return (
    <div>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 rounded-md bg-primary cursor-pointer"
      >
        تعديل المقالة
      </button>
      <Activity mode={IsOpen ? "visible" : "hidden"}>
        {IsOpen &&
          createPortal(
            <section
              onClick={() => setIsOpen(false)}
              className="backdrop-blur-3xl size-full z-50 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
            >
              <form
                onSubmit={handleSubmit}
                onClick={(e) => e.stopPropagation()}
                className="bg-background size-[90%] rounded-md border-primary border-2 p-4 grid gap-4 grid-cols-1 grid-rows-[auto_1fr_auto]"
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setArticleBlocks(article.blocks || ([] as ArticleBlock[]));
                  }}
                  className="px-4 py-2 rounded-md bg-primary cursor-pointer w-fit"
                >
                  x
                </button>
                <div className="overflow-x-auto p-4 space-y-3">
                  <Input
                    name="title"
                    type="text"
                    placeholder="عنوان المقالة"
                    defaultValue={article.title}
                  />
                  <Input
                    name="slug"
                    type="text"
                    placeholder="Slug (عنوان في الرابط)"
                    defaultValue={article.slug}
                  />
                  <Input
                    name="tag"
                    type="text"
                    placeholder="التاغ (tag)"
                    defaultValue={article.tag}
                  />
                  <Textarea
                    name="description"
                    placeholder="وصف المقالة"
                    className="h-24"
                    defaultValue={article.description}
                  />
                  <Calendar
                    name="createdAt"
                    date={new Date(article.createdAt)}
                  />
                  <div className="flex max-sm:flex-col items-center gap-4">
                    <Input name="banner" type="file" />
                    <button
                      type="button"
                      className="bg-primary/20 rounded-md w-fit max-sm:w-full py-1 px-2 cursor-pointer flex-2/4"
                      onClick={() => {
                        const input = document.querySelector(
                          `input[name="banner"]`,
                        ) as HTMLInputElement | null;
                        if (input) input.value = "";
                      }}
                    >
                      ازالة الصورة المختارة
                    </button>
                  </div>
                  <Input
                    name="banner-description"
                    type="text"
                    placeholder="وصف الصورة (alt)"
                    defaultValue={article.banner.alt}
                  />
                  <div>
                    <input
                      id="subscribers-notified"
                      name="subscribers-notified"
                      type="checkbox"
                      defaultChecked={article.SubscribersNotified}
                      className="peer sr-only"
                    />
                    <label
                      htmlFor="subscribers-notified"
                      className={`cursor-pointer bg-gray-800 px-2 py-1 rounded-md peer-checked:bg-primary ${article.SubscribersNotified && "pointer-events-none cursor-not-allowed! bg-gray-600!"}`}
                    >
                      إعلام المشتركين عند النشر
                    </label>
                  </div>
                  <div>
                    {articleBlocks.map((block, index) => (
                      <section key={block.id} className="my-8 space-y-2">
                        <div className="*:bg-primary *:rounded-md *:p-2 *:cursor-pointer [&_svg]:size-6 flex justify-between gap-4 bg-primary/20 py-1 px-4 rounded-md">
                          <button
                            onClick={() =>
                              moveBlock({ index, direction: "up" })
                            }
                            type="button"
                          >
                            <svg
                              fill="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path d="M19,20H5a1,1,0,0,0,0,2H19a1,1,0,0,0,0-2ZM8.71,7.71,11,5.41V17a1,1,0,0,0,2,0V5.41l2.29,2.3a1,1,0,0,0,1.42,0,1,1,0,0,0,0-1.42l-4-4a1,1,0,0,0-.33-.21,1,1,0,0,0-.76,0,1,1,0,0,0-.33.21l-4,4A1,1,0,1,0,8.71,7.71Z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => {
                              setArticleBlocks((prev) =>
                                prev.filter(
                                  (prevBlock) => prevBlock.id !== block.id,
                                ),
                              );
                              if (block.image?.public_id) {
                                setDeleteBlocksImageByIds((prev) =>
                                  prev.includes(
                                    block.image?.public_id as string,
                                  )
                                    ? prev
                                    : [
                                        ...prev,
                                        block.image?.public_id as string,
                                      ],
                                );
                              }
                            }}
                            type="button"
                          >
                            <svg
                              viewBox="18 18 20.000003814697266 22"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <defs>
                                <filter
                                  id="a"
                                  width="200%"
                                  height="200%"
                                  x="-50%"
                                  y="-50%"
                                  filterUnits="objectBoundingBox"
                                >
                                  <feOffset
                                    dy="1"
                                    in="SourceAlpha"
                                    result="shadowOffsetOuter1"
                                  />
                                  <feGaussianBlur
                                    stdDeviation="10"
                                    in="shadowOffsetOuter1"
                                    result="shadowBlurOuter1"
                                  />
                                  <feColorMatrix
                                    values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0"
                                    in="shadowBlurOuter1"
                                    result="shadowMatrixOuter1"
                                  />
                                  <feMerge>
                                    <feMergeNode in="shadowMatrixOuter1" />
                                    <feMergeNode in="SourceGraphic" />
                                  </feMerge>
                                </filter>
                              </defs>
                              <path
                                fill="currentColor"
                                // fillRule="evenodd"
                                d="M36 26v10.997c0 1.659-1.337 3.003-3.009 3.003h-9.981c-1.662 0-3.009-1.342-3.009-3.003v-10.997h16zm-2 0v10.998c0 .554-.456 1.002-1.002 1.002h-9.995c-.554 0-1.002-.456-1.002-1.002v-10.998h12zm-9-5c0-.552.451-1 .991-1h4.018c.547 0 .991.444.991 1 0 .552-.451 1-.991 1h-4.018c-.547 0-.991-.444-.991-1zm0 6.997c0-.551.444-.997 1-.997.552 0 1 .453 1 .997v6.006c0 .551-.444.997-1 .997-.552 0-1-.453-1-.997v-6.006zm4 0c0-.551.444-.997 1-.997.552 0 1 .453 1 .997v6.006c0 .551-.444.997-1 .997-.552 0-1-.453-1-.997v-6.006zm-6-5.997h-4.008c-.536 0-.992.448-.992 1 0 .556.444 1 .992 1h18.016c.536 0 .992-.448.992-1 0-.556-.444-1-.992-1h-4.008v-1c0-1.653-1.343-3-3-3h-3.999c-1.652 0-3 1.343-3 3v1z"
                                filter="url(#a)"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() =>
                              moveBlock({ index, direction: "down" })
                            }
                            type="button"
                          >
                            <svg
                              fill="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path d="M15.29,16.29,13,18.59V7a1,1,0,0,0-2,0V18.59l-2.29-2.3a1,1,0,1,0-1.42,1.42l4,4a1,1,0,0,0,.33.21.94.94,0,0,0,.76,0,1,1,0,0,0,.33-.21l4-4a1,1,0,0,0-1.42-1.42ZM19,2H5A1,1,0,0,0,5,4H19a1,1,0,0,0,0-2Z" />
                            </svg>
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Input
                            type="text"
                            placeholder="عنوان البلوك (اختياري)"
                            className={`order-1 ${!block.title && "border-gray-600"}`}
                            defaultValue={block.title ?? ""}
                            name={`block-${index}-title`}
                          />
                          <Textarea
                            placeholder="محتوى البلوك (اختياري)"
                            className={`h-24 order-2 sm:order-3 ${!block.content && "border-gray-600"}`}
                            defaultValue={block.content ?? ""}
                            name={`block-${index}-content`}
                          />
                          <Input
                            type="text"
                            placeholder="وصف الصورة (alt)"
                            defaultValue={block.image?.alt}
                            className={`order-3 sm:order-2 ${!block.image && "border-gray-600"}`}
                            name={`block-${index}-image-alt`}
                          />
                          <div className="order-4 space-y-1">
                            <Input
                              type="file"
                              className={`${!block.image && "border-gray-600"}`}
                              name={`block-${index}-image-file`}
                            />
                            <button
                              type="button"
                              className="bg-primary/20 rounded-md w-full cursor-pointer"
                              onClick={() => {
                                const input = document.querySelector(
                                  `input[name="block-${index}-image-file"]`,
                                ) as HTMLInputElement | null;
                                if (input) input.value = "";
                              }}
                            >
                              ازالة الصورة المختارة
                            </button>
                            <button
                              type="button"
                              className="bg-primary/20 rounded-md w-full cursor-pointer"
                              onClick={() => {
                                const alt = document.querySelector(
                                  `input[name="block-${index}-image-alt"]`,
                                ) as HTMLInputElement | null;
                                if (alt) alt.value = "";
                                if (block.image?.public_id) {
                                  setDeleteBlocksImageByIds((prev) =>
                                    prev.includes(
                                      block.image?.public_id as string,
                                    )
                                      ? prev
                                      : [
                                          ...prev,
                                          block.image?.public_id as string,
                                        ],
                                  );
                                }
                              }}
                            >
                              حذف الصورة الاساسية
                            </button>
                          </div>
                          <Input
                            dir="ltr"
                            type="text"
                            className={`order-5 sm:col-span-2 ${!block.code && "border-gray-600"}`}
                            placeholder="لغة الكود (اختياري)"
                            defaultValue={block.code?.language ?? ""}
                            name={`block-${index}-code-language`}
                          />
                          <Textarea
                            dir="ltr"
                            placeholder="كود البلوك (اختياري)"
                            defaultValue={block.code?.content ?? ""}
                            className={`order-6 sm:col-span-2 min-h-24 max-h-96 ${!block.code && "border-gray-600"}`}
                            name={`block-${index}-code-content`}
                          />
                        </div>
                      </section>
                    ))}
                    <button
                      type="button"
                      className="py-2 rounded-md bg-primary/35 cursor-pointer w-full"
                      onClick={() => {
                        setArticleBlocks((prev) => [
                          ...prev,
                          {
                            id: crypto.randomUUID(),
                            title: null,
                            content: null,
                            image: null,
                            code: null,
                          },
                        ]);
                      }}
                    >
                      اضافة بلوك جديد
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  className="py-2 rounded-md bg-primary cursor-pointer w-full"
                >
                  {newArticleLoader ? "جاري النشر..." : "تعديل المقالة"}
                </button>
              </form>
            </section>,
            document.body,
          )}
      </Activity>
    </div>
  );
};
export default EditArticle;
