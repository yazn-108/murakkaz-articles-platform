export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({
  className,
  ...props
}) => {
  return (
    <input
      {...props}
      className={`border-[#55b0e9] border-2 rounded-md w-full px-2 py-0.5 outline-none focus:ring-2 focus:ring-primary ${className ?? ""}`}
    />
  );
};
export const Textarea: React.FC<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
> = ({ className, ...props }) => {
  return (
    <textarea
      {...props}
      className={`border-[#55b0e9] border-2 rounded-md w-full field-sizing-content px-2 py-0.5 m-0 outline-none focus:ring-2 focus:ring-primary ${className ?? ""}`}
    />
  );
};
