import Image from "next/image";
const ArticleImage = ({
  banner,
}: {
  banner: {
    url: string;
    alt: string;
  };
}) => {
  return (
    <Image
      className="object-cover w-full md:w-100 h-75 rounded-2xl"
      src={banner.url}
      width={400}
      height={300}
      alt={banner.alt}
    />
  );
};
export default ArticleImage;
