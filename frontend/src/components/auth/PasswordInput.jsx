import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function PasswordInput({
  id,
  name,
  value,
  onChange,
  placeholder = "Enter your password",
  required = false,
  autoComplete = "current-password",
  label = "Password",
  error,
  disabled = false,
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id || name}
          className="block text-xs font-semibold uppercase tracking-widest text-stone-700 mb-1.5"
        >
          {label} {required && <span className="text-amber-700">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          id={id || name}
          name={name}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          disabled={disabled}
          className={`w-full border rounded-sm px-3.5 py-3 pr-11 text-sm font-body text-stone-900 placeholder:text-stone-400 focus:outline-none transition-colors bg-white ${
            error
              ? "border-rose-400 focus:border-rose-600"
              : "border-stone-200 focus:border-stone-900"
          } ${disabled ? "bg-stone-50 text-stone-400 cursor-not-allowed" : ""}`}
        />

        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          disabled={disabled}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1 transition-colors focus:outline-none"
          aria-label={showPassword ? "Hide password" : "Show password"}
          tabIndex={0}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {error && <p className="text-xs text-rose-600 mt-1 font-body">{error}</p>}
    </div>
  );
}
