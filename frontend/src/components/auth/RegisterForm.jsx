import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import PasswordInput from "./PasswordInput";

export default function RegisterForm({ onSuccess }) {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) {
      errs.name = "Full name is required";
    } else if (formData.name.trim().length < 2) {
      errs.name = "Name must be at least 2 characters";
    }

    if (!formData.email.trim()) {
      errs.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      errs.password = "Password is required";
    } else if (formData.password.length < 6) {
      errs.password = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      errs.confirmPassword = "Confirm password is required";
    } else if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = "Passwords do not match";
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
      const response = await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });
      if (onSuccess) {
        onSuccess(response);
      }
    } catch (err) {
      setGeneralError(err.message || "An account with this email already exists.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {generalError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-4 py-3 rounded-sm">
          {generalError}
        </div>
      )}

      {/* Full Name */}
      <div>
        <label
          htmlFor="register-name"
          className="block text-xs font-semibold uppercase tracking-widest text-stone-700 mb-1.5"
        >
          Full Name <span className="text-amber-700">*</span>
        </label>
        <input
          id="register-name"
          name="name"
          type="text"
          autoComplete="name"
          value={formData.name}
          onChange={handleChange}
          disabled={isSubmitting}
          placeholder="e.g. Jane Doe"
          className={`w-full border rounded-sm px-3.5 py-3 text-sm font-body text-stone-900 placeholder:text-stone-400 focus:outline-none transition-colors bg-white ${
            errors.name
              ? "border-rose-400 focus:border-rose-600"
              : "border-stone-200 focus:border-stone-900"
          } ${isSubmitting ? "bg-stone-50 text-stone-400 cursor-not-allowed" : ""}`}
        />
        {errors.name && (
          <p className="text-xs text-rose-600 mt-1 font-body">{errors.name}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="register-email"
          className="block text-xs font-semibold uppercase tracking-widest text-stone-700 mb-1.5"
        >
          Email <span className="text-amber-700">*</span>
        </label>
        <input
          id="register-email"
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
          id="register-password"
          name="password"
          label="Password"
          required
          autoComplete="new-password"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          disabled={isSubmitting}
          placeholder="At least 6 characters"
        />
      </div>

      {/* Confirm Password */}
      <div>
        <PasswordInput
          id="register-confirm-password"
          name="confirmPassword"
          label="Confirm Password"
          required
          autoComplete="new-password"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          disabled={isSubmitting}
          placeholder="Repeat your password"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-stone-900 text-white py-3.5 text-xs font-semibold tracking-widest uppercase hover:bg-amber-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2 rounded-sm"
      >
        {isSubmitting ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
      </button>

      {/* Link to Login */}
      <div className="text-center pt-3 border-t border-stone-100">
        <p className="text-xs text-stone-500">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-stone-900 font-semibold underline underline-offset-4 hover:text-amber-700 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </form>
  );
}
