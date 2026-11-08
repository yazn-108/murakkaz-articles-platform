"use client";
import HandleUploadImage from "@/hooks/HandleUploadImage";
import { ArticleTY } from "@/types/Articles";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { Activity, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import Calendar from "./Calendar";
import { Input, Textarea } from "./FormElements";
const CreateArticle = () => {
  const [IsOpen, setIsOpen] = useState<boolean>(false);
  const [newArticleLoader, setNewArticleLoader] = useState<boolean>(false);
  const queryClient = useQueryClient();
  const CreateNewArticle = useMutation({
    mutationFn: (data: ArticleTY) =>
      axios.post(`/api/admin/articles`, data).then((res) => res.data),
    onSuccess: (res) => {
      toast.success(res.message);
      setNewArticleLoader(false);
      setIsOpen(false);
      queryClient.invalidateQueries({ queryKey: ["articles"] });
    },
    onError: (err: AxiosError) => {
      const data = err.response?.data as { error?: string };
      toast.error(data?.error);
      setNewArticleLoader(false);
    },
  });
  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setNewArticleLoader(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    const image = await HandleUploadImage({
      file: data.banner as File,
    });
    const utcMidnight = new Date(
      Date.UTC(
        new Date(data.createdAt as string).getUTCFullYear(),
        new Date(data.createdAt as string).getUTCMonth(),
        new Date(data.createdAt as string).getUTCDate(),
      ),
    );
    const articleData: ArticleTY = {
      slug: data.slug as string,
      title: data.title as string,
      tag: (data.tag as string).toLowerCase(),
      description: data.description as string,
      createdAt: utcMidnight,
      SubscribersNotified: false,
      banner: {
        url: image!.secure_url,
        public_id: image!.public_id,
        alt: data["banner-description"] as string,
      },
      blocks: [],
    };
    CreateNewArticle.mutate(articleData);
  };
  return (
    <div className="m-4">
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 rounded-md bg-primary cursor-pointer"
      >
        انشاء مقالة
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
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-md bg-primary cursor-pointer w-fit"
                >
                  x
                </button>
                <div className="overflow-x-auto p-4 space-y-3">
                  <Input name="title" type="text" placeholder="عنوان المقالة" />
                  <Input
                    name="slug"
                    type="text"
                    placeholder="Slug (عنوان في الرابط)"
                  />
                  <Input name="tag" type="text" placeholder="التاغ (tag)" />
                  <Textarea
                    name="description"
                    placeholder="وصف المقالة"
                    className="mt-4 resize-none h-48"
                  />
                  <Calendar name="createdAt" />
                  <Input name="banner" type="file" />
                  <Input
                    name="banner-description"
                    type="text"
                    placeholder="وصف الصورة (alt)"
                  />
                </div>
                <button
                  type="submit"
                  className="py-2 rounded-md bg-primary cursor-pointer w-full"
                >
                  {newArticleLoader ? "جاري النشر..." : "انشاء مقالة"}
                </button>
              </form>
            </section>,
            document.body,
          )}
      </Activity>
    </div>
  );
};
export default CreateArticle;
