import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import PasswordInput from "./PasswordInput";

export default function LoginForm({ onSuccess }) {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const errs = {};
    if (!formData.email.trim()) {
      errs.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      errs.password = "Password is required";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (generalError) {
      setGeneralError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setGeneralError("");

    try {
      await login({
        email: formData.email.trim(),
        password: formData.password,
      });
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setGeneralError(err.message || "Email or password is incorrect.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {generalError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-4 py-3 rounded-sm">
          {generalError}
        </div>
      )}

      {/* Email */}
      <div>
        <label
          htmlFor="login-email"
          className="block text-xs font-semibold uppercase tracking-widest text-stone-700 mb-1.5"
        >
          Email <span className="text-amber-700">*</span>
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          value={formData.email}
          onChange={handleChange}
          disabled={isSubmitting}
          placeholder="your.email@example.com"
          className={`w-full border rounded-sm px-3.5 py-3 text-sm font-body text-stone-900 placeholder:text-stone-400 focus:outline-none transition-colors bg-white ${
            errors.email
              ? "border-rose-400 focus:border-rose-600"
              : "border-stone-200 focus:border-stone-900"
          } ${isSubmitting ? "bg-stone-50 text-stone-400 cursor-not-allowed" : ""}`}
        />
        {errors.email && (
          <p className="text-xs text-rose-600 mt-1 font-body">{errors.email}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <PasswordInput
          id="login-password"
          name="password"
          label="Password"
          required
          autoComplete="current-password"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          disabled={isSubmitting}
          placeholder="Enter your password"
        />

        <div className="flex justify-end mt-2">
          <Link
            to="/forgot-password"
            className="text-xs text-stone-500 hover:text-stone-900 underline underline-offset-4 transition-colors"
          >
            Forgot password?
          </Link>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-stone-900 text-white py-3.5 text-xs font-semibold tracking-widest uppercase hover:bg-amber-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2 rounded-sm"
      >
        {isSubmitting ? "SIGNING IN..." : "SIGN IN"}
      </button>

      {/* Link to Register */}
      <div className="text-center pt-3 border-t border-stone-100">
        <p className="text-xs text-stone-500">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-stone-900 font-semibold underline underline-offset-4 hover:text-amber-700 transition-colors"
          >
            Create an account
          </Link>
        </p>
      </div>
    </form>
  );
}
