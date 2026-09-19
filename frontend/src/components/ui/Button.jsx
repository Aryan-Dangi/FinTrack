const Button = ({
  children,
  variant = "primary",
  type = "button",
  className = "",
  ...props
}) => {
  const variants = {
    primary:
      "bg-emerald-500 text-black hover:bg-emerald-400",
    secondary:
      "bg-zinc-900 text-white border border-zinc-700 hover:bg-zinc-800",
    danger:
      "bg-red-500 text-white hover:bg-red-400",
  };

  return (
    <button
      type={type}
      className={`rounded-xl px-4 py-2 font-medium transition-all duration-200 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;