export default function InputField({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder = "",
  step,
  disabled = false,
  readOnly = false,
  required = false,
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        step={step}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-teal-100 disabled:bg-slate-50"
      />
    </label>
  );
}
