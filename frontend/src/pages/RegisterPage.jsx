import { useState } from "react";
import { useNavigate } from "react-router-dom";
import RegisterForm from "../components/auth/RegisterForm";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [successMessage, setSuccessMessage] = useState("");

  const handleSuccess = (response) => {
    // If backend auto-authenticates user and returns token/user
    if (response?.user || response?.accessToken || response?.token) {
      navigate("/", { replace: true });
    } else {
      // Backend requires separate login after registration
      setSuccessMessage("Account created successfully. Please sign in to continue.");
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1500);
    }
  };

  return (
    <div className="min-h-[75vh] flex flex-col justify-center py-16 sm:py-24 px-4 sm:px-6">
      <div className="w-full max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl sm:text-5xl font-medium text-stone-900 tracking-tight">
            Create your ShopWave account
          </h1>
          <p className="text-sm font-body text-stone-500 mt-3">
            Join us and discover your personal style.
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white border border-stone-200/80 p-8 sm:p-10 shadow-xs">
          {successMessage ? (
            <div className="bg-amber-50 border border-amber-200 text-stone-900 text-sm p-4 text-center rounded-sm">
              <p className="font-display text-lg mb-1">Welcome to ShopWave</p>
              <p className="text-stone-600 text-xs">{successMessage}</p>
            </div>
          ) : (
            <RegisterForm onSuccess={handleSuccess} />
          )}
        </div>
      </div>
    </div>
  );
}
