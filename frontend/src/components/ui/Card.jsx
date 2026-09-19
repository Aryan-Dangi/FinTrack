const Card = ({ title, value, children }) => {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      {title && (
        <p className="mb-2 text-sm text-zinc-400">{title}</p>
      )}

      {value && (
        <h2 className="text-3xl font-bold text-white">{value}</h2>
      )}

      {children}
    </div>
  );
};

export default Card;