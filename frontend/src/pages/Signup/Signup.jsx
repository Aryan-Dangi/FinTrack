
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { signupUser } from "../../services/authService";
import {
  ArrowRight,
  ArrowUpRight,
  Eye,
  EyeOff,
  ShieldCheck,
  Wallet,
  TrendingUp,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

const signupSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name cannot exceed 50 characters"),

  email: z
    .string()
    .trim()
    .email("Enter a valid email address"),

  password: z
    .string()
    .min(8, "Password must contain at least 8 characters")
    .regex(/[A-Z]/, "Include at least one uppercase letter")
    .regex(/[a-z]/, "Include at least one lowercase letter")
    .regex(/[0-9]/, "Include at least one number"),
});

const Signup = () => {
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (formData) => {
    setServerError("");
    setSuccessMessage("");

    try {
      const result = await signupUser(formData);

      if (!result.accessToken || !result.user) {
        throw new Error(
          "Account created, but the authentication response is incomplete. Please try logging in."
        );
      }

      login(result.user, result.accessToken);

      setSuccessMessage(
        result.message || "Account created successfully."
      );

      navigate("/dashboard", { replace: true });
    } catch (error) {
      setServerError(
        error.response?.data?.message ||
          error.message ||
          "Unable to create your account. Please try again."
      );
    }
  };

  return (
    <main className="fixed inset-0 z-[100] min-h-screen w-screen overflow-y-auto overflow-x-hidden bg-[#080d13] text-white selection:bg-emerald-400/30">

      {/* Background decoration */}
      <div className="pointer-events-none fixed -left-40 top-0 h-[500px] w-[500px] rounded-full bg-emerald-500/[0.07] blur-[120px]" />
      <div className="pointer-events-none fixed -bottom-40 right-0 h-[500px] w-[500px] rounded-full bg-teal-500/[0.06] blur-[120px]" />

      <div className="relative mx-auto flex min-h-screen w-full items-center justify-center p-4 sm:p-8 lg:p-10">

        <div className="grid w-full max-w-[1200px] min-w-0 overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#0d141b]/90 shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-xl xl:min-h-[720px] xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">

          {/* Left branding panel */}
          <section className="relative hidden min-w-0 flex-col justify-between overflow-hidden border-r border-white/[0.06] bg-gradient-to-br from-[#101f20] via-[#101b20] to-[#0d141b] p-8 xl:flex xl:p-12">

            <div className="pointer-events-none absolute -right-28 top-20 h-80 w-80 rounded-full border border-emerald-400/[0.08]" />
            <div className="pointer-events-none absolute -right-16 top-32 h-56 w-56 rounded-full border border-emerald-400/[0.08]" />
            <div className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-emerald-400/[0.06] blur-[90px]" />

            <div className="relative z-10">

              <Link to="/signup" className="inline-flex items-center gap-3">
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
                  A smarter way to manage money
                </div>

                <h1 className="text-[42px] font-semibold leading-[1.15] tracking-tight">
                  Your financial
                  <br />
                  journey starts
                  <br />
                  <span className="text-emerald-400">
                    with one step.
                  </span>
                </h1>

                <p className="mt-6 max-w-sm text-[15px] leading-7 text-slate-400">
                  Get a clearer picture of your finances. Track expenses,
                  set meaningful goals, and turn better decisions into
                  lasting habits.
                </p>

              </div>
            </div>

            {/* Feature cards */}
            <div className="relative z-10 mt-12 space-y-3">

              <div className="flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 backdrop-blur-xl">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-400">
                  <TrendingUp size={21} />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-200">
                    Understand your spending
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Get insights into where your money goes.
                  </p>
                </div>

                <ArrowUpRight size={17} className="ml-auto shrink-0 text-slate-600" />
              </div>

              <div className="flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 backdrop-blur-xl">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-400/10 text-teal-400">
                  <ShieldCheck size={21} />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-200">
                    Keep your finances organised
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Your money management, all in one place.
                  </p>
                </div>

                <ArrowUpRight size={17} className="ml-auto shrink-0 text-slate-600" />
              </div>

              <p className="flex items-center gap-2 pt-3 text-xs text-slate-500">
                <CheckCircle2 size={15} className="text-emerald-400" />
                Simple tools. Better financial habits.
              </p>

            </div>
          </section>

          {/* Signup form */}
          <section className="flex min-w-0 items-center justify-center px-5 py-10 sm:px-10 xl:px-14">

            <div className="w-full max-w-[390px]">

              {/* Mobile branding */}
              <div className="mb-8 flex items-center gap-3 xl:hidden">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400 text-[#07110e]">
                  <Wallet size={21} />
                </div>

                <span className="text-xl font-bold">
                  Fin<span className="text-emerald-400">Track</span>
                </span>
              </div>

              <div className="mb-8">

                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
                  Get started
                </p>

                <h2 className="text-3xl font-semibold tracking-tight sm:text-[34px]">
                  Create your account
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-400">
                  Set up your account and take the first step towards
                  smarter money management.
                </p>

              </div>

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4"
              >

                {/* Full name */}
                <div>
                  <label
                    htmlFor="fullName"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Full name
                  </label>

                  <input
                    id="fullName"
                    type="text"
                    autoComplete="name"
                    placeholder="Your full name"
                    {...register("fullName")}
                    className={`w-full rounded-xl border bg-[#080f15] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400/70 focus:ring-4 focus:ring-emerald-400/[0.08] ${
                      errors.fullName
                        ? "border-red-400/60"
                        : "border-white/[0.09] hover:border-white/20"
                    }`}
                  />

                  {errors.fullName && (
                    <p className="mt-2 text-xs text-red-400">
                      {errors.fullName.message}
                    </p>
                  )}
                </div>

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
                      autoComplete="new-password"
                      placeholder="Create a strong password"
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

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    At least 8 characters, with uppercase, lowercase, and
                    one number.
                  </p>
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

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3.5 text-sm font-bold text-[#07110e] shadow-lg shadow-emerald-500/10 transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-300 hover:shadow-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {isSubmitting ? "Creating account..." : "Create account"}

                  {!isSubmitting && (
                    <ArrowRight
                      size={17}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  )}
                </button>

              </form>

              <div className="my-7 flex items-center gap-4">
                <div className="h-px flex-1 bg-white/[0.08]" />

                <span className="text-[11px] uppercase tracking-wider text-slate-600">
                  Almost there
                </span>

                <div className="h-px flex-1 bg-white/[0.08]" />
              </div>

              <p className="text-center text-sm text-slate-400">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-emerald-400 transition hover:text-emerald-300"
                >
                  Sign in
                </Link>
              </p>

              <p className="mt-8 text-center text-[11px] text-slate-600">
                © {new Date().getFullYear()} FinTrack. Make every rupee count.
              </p>

            </div>
          </section>

        </div>
      </div>
    </main>
  );
};

export default Signup;
