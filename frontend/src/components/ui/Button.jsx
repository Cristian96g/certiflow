export default function Button({
  children,
  type = "button",
  variant = "primary",
  className = "",
  ...props
}) {
  const variants = {
    primary: "bg-accent text-white hover:bg-teal-700",
    secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200",
    ghost: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50",
  };

  return (
    <button
      type={type}
      className={`rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
