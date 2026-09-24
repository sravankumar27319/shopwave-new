import { useNavigate, useLocation } from "react-router-dom";
import LoginForm from "../components/auth/LoginForm";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from || "/";

  const handleSuccess = () => {
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-[75vh] flex flex-col justify-center py-16 sm:py-24 px-4 sm:px-6">
      <div className="w-full max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl sm:text-5xl font-medium text-stone-900 tracking-tight">
            Sign in to ShopWave
          </h1>
          <p className="text-sm font-body text-stone-500 mt-3">
            Welcome back. Continue your shopping journey.
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white border border-stone-200/80 p-8 sm:p-10 shadow-xs">
          <LoginForm onSuccess={handleSuccess} />
        </div>
      </div>
    </div>
  );
}
