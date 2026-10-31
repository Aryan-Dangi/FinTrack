
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { loginUser } from "../../services/authService";
import {
  ArrowRight,
  ArrowUpRight,
  Eye,
  EyeOff,
  Fingerprint,
  ShieldCheck,
  Wallet,
  TrendingUp,
  Sparkles,
} from "lucide-react";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Enter a valid email address"),

  password: z
    .string()
    .min(1, "Password is required"),
});

const Login = () => {
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (formData) => {
    setServerError("");
    setSuccessMessage("");

    try {
      const result = await loginUser(formData);

      if (!result.accessToken || !result.user) {
        throw new Error("Invalid login response from server.");
      }

      // Store the user and access token in shared React state.
      login(result.user, result.accessToken);

      setSuccessMessage(result.message || "Login successful.");

      // Return to the originally requested page, if available.
      const destination =
        location.state?.from?.pathname || "/dashboard";

      navigate(destination, { replace: true });
    } catch (error) {
      setServerError(
        error.response?.data?.message ||
          error.message ||
          "Unable to log in. Please try again."
      );
    }
  };

  return (
    <main className="fixed inset-0 z-[100] min-h-screen w-screen overflow-y-auto overflow-x-hidden bg-[#080d13] text-white selection:bg-emerald-400/30">

      {/* Background decoration */}
      <div className="pointer-events-none fixed -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-emerald-500/[0.07] blur-[120px]" />
      <div className="pointer-events-none fixed -bottom-40 right-0 h-[500px] w-[500px] rounded-full bg-teal-500/[0.06] blur-[120px]" />

      <div className="relative mx-auto flex min-h-screen w-full items-center justify-center p-4 sm:p-8 lg:p-10">

        <div className="grid w-full max-w-[1200px] min-w-0 overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#0d141b]/90 shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-xl xl:min-h-[690px] xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">

          {/* Left branding panel */}
          <section className="relative hidden min-w-0 flex-col justify-between overflow-hidden border-r border-white/[0.06] bg-gradient-to-br from-[#101f20] via-[#101b20] to-[#0d141b] p-8 xl:flex xl:p-12">

            <div className="pointer-events-none absolute -right-28 top-20 h-80 w-80 rounded-full border border-emerald-400/[0.08]" />
            <div className="pointer-events-none absolute -right-16 top-32 h-56 w-56 rounded-full border border-emerald-400/[0.08]" />
            <div className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-emerald-400/[0.06] blur-[90px]" />

            <div className="relative z-10">

              <Link to="/login" className="inline-flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400 text-[#07110e] shadow-lg shadow-emerald-500/20">
                  <Wallet size={23} strokeWidth={2.3} />
                </div>

                <span className="text-xl font-bold tracking-tight">
                  Fin<span className="text-emerald-400">Track</span>
                </span>
              </Link>

              <div className="mt-20 max-w-md">

                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-3 py-1.5 text-xs font-medium text-emerald-300">
                  <Sparkles size={13} />
                  Your money, in focus
                </div>

                <h1 className="text-[42px] font-semibold leading-[1.15] tracking-tight">
                  Take control of
                  <br />
                  your money.
                  <br />
                  <span className="text-emerald-400">
                    Own your future.
                  </span>
                </h1>

                <p className="mt-6 max-w-sm text-[15px] leading-7 text-slate-400">
                  Understand your spending, build better habits, and make
                  every financial decision count — all in one place.
                </p>

              </div>
            </div>

            {/* Decorative finance card */}
            <div className="relative z-10 mt-12 max-w-md">

              <div className="rounded-2xl border border-white/[0.09] bg-white/[0.045] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">

                <div className="flex items-center justify-between">

                  <div>
                    <p className="text-xs text-slate-400">
                      Your financial overview
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-200">
                      Stay ahead of your goals
                    </p>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-400">
                    <TrendingUp size={20} />
                  </div>

                </div>

                <div className="mt-7 flex items-end justify-between">

                  <div>
                    <p className="text-xs text-slate-500">
                      Smarter money management
                    </p>

                    <p className="mt-1 text-2xl font-semibold tracking-tight">
                      Starts here.
                    </p>
                  </div>

                  <div className="mb-1 flex items-center gap-1 text-xs font-medium text-emerald-400">
                    <ArrowUpRight size={15} />
                    Your journey
                  </div>

                </div>

                <div className="mt-6 flex h-2 gap-1.5 overflow-hidden rounded-full">
                  <div className="w-[45%] rounded-full bg-emerald-400" />
                  <div className="w-[30%] rounded-full bg-teal-400/60" />
                  <div className="flex-1 rounded-full bg-white/10" />
                </div>

                <div className="mt-3 flex justify-between text-[11px] text-slate-500">
                  <span>Track</span>
                  <span>Plan</span>
                  <span>Grow</span>
                </div>

              </div>

              <div className="mt-6 flex items-center gap-3 text-xs text-slate-500">
                <ShieldCheck size={16} className="shrink-0 text-emerald-400" />
                Your financial data deserves to stay protected.
              </div>

            </div>
          </section>

          {/* Login form */}
          <section className="flex min-w-0 items-center justify-center px-5 py-10 sm:px-10 xl:px-14">

            <div className="w-full max-w-[390px]">

              {/* Mobile branding */}
              <div className="mb-10 flex items-center gap-3 xl:hidden">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400 text-[#07110e]">
                  <Wallet size={21} />
                </div>

                <span className="text-xl font-bold">
                  Fin<span className="text-emerald-400">Track</span>
                </span>

              </div>

              {/* Heading */}
              <div className="mb-9">

                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
                  Welcome back
                </p>

                <h2 className="text-3xl font-semibold tracking-tight sm:text-[34px]">
                  Sign in to FinTrack
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-400">
                  Pick up where you left off. Your finances are waiting.
                </p>

              </div>

              {/* Login form */}
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-5"
              >

                {/* Email */}
                <div>

                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Email address
                  </label>

                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@example.com"
                    {...register("email")}
                    className={`w-full rounded-xl border bg-[#080f15] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400/70 focus:ring-4 focus:ring-emerald-400/[0.08] ${
                      errors.email
                        ? "border-red-400/60"
                        : "border-white/[0.09] hover:border-white/20"
                    }`}
                  />

                  {errors.email && (
                    <p className="mt-2 text-xs text-red-400">
                      {errors.email.message}
                    </p>
                  )}

                </div>

                {/* Password */}
                <div>

                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Password
                  </label>

                  <div className="relative">

                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      {...register("password")}
                      className={`w-full rounded-xl border bg-[#080f15] px-4 py-3.5 pr-12 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400/70 focus:ring-4 focus:ring-emerald-400/[0.08] ${
                        errors.password
                          ? "border-red-400/60"
                          : "border-white/[0.09] hover:border-white/20"
                      }`}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-emerald-400"
                    >
                      {showPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>

                  </div>

                  {errors.password && (
                    <p className="mt-2 text-xs text-red-400">
                      {errors.password.message}
                    </p>
                  )}

                </div>

                {/* Server error */}
                {serverError && (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-400/20 bg-red-400/[0.07] px-4 py-3 text-sm text-red-300"
                  >
                    {serverError}
                  </div>
                )}

                {/* Success message */}
                {successMessage && (
                  <div
                    role="status"
                    className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.07] px-4 py-3 text-sm text-emerald-300"
                  >
                    {successMessage}
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3.5 text-sm font-bold text-[#07110e] shadow-lg shadow-emerald-500/10 transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-300 hover:shadow-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {isSubmitting ? "Signing in..." : "Sign in"}

                  {!isSubmitting && (
                    <ArrowRight
                      size={17}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  )}
                </button>

              </form>

              {/* Divider */}
              <div className="my-8 flex items-center gap-4">

                <div className="h-px flex-1 bg-white/[0.08]" />

                <span className="text-[11px] uppercase tracking-wider text-slate-600">
                  Secure access
                </span>

                <div className="h-px flex-1 bg-white/[0.08]" />

              </div>

              {/* Security message */}
              <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                <Fingerprint size={15} className="text-emerald-400" />
                Protected access to your personal finances
              </div>

              {/* Signup navigation */}
              <p className="mt-8 text-center text-sm text-slate-400">
                New to FinTrack?{" "}
                <Link
                  to="/signup"
                  className="font-semibold text-emerald-400 transition hover:text-emerald-300"
                >
                  Create an account
                </Link>
              </p>

              {/* Footer */}
              <p className="mt-10 text-center text-[11px] text-slate-600">
                © {new Date().getFullYear()} FinTrack. Make every rupee count.
              </p>

            </div>
          </section>

        </div>
      </div>
    </main>
  );
};

export default Login;
