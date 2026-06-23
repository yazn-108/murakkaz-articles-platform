type Article = {
  title: string;
  slug: string;
};
export type PresentationalSearchProps = {
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  Open: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  query: string;
  setQuery: React.Dispatch<React.SetStateAction<string>>;
  data: { articles: Article[] } | undefined;
  isFetching: boolean;
}