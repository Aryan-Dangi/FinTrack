const Avatar = ({ name = "Aryan", size = "md" }) => {
  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
  };

  const initial = name.charAt(0).toUpperCase();

  return (
    <div
      className={`flex items-center justify-center rounded-full bg-emerald-500 font-semibold text-black ${sizes[size]}`}
    >
      {initial}
    </div>
  );
};

export default Avatar;