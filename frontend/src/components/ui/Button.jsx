export default function Button({
  children,
  type = "button",
  variant = "primary",
  className = "",
  loading = false,
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
      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 ${variants[variant]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span>{children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
