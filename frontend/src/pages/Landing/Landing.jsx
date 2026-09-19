import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, Wallet, BarChart3 } from "lucide-react";

import Logo from "../../components/common/Logo";
import Button from "../../components/ui/Button";

const Landing = () => {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Navbar */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Logo />

        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="secondary">Login</Button>
          </Link>

          <Link to="/signup">
            <Button>Create Account</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto flex max-w-7xl flex-col items-center px-6 py-24 text-center">
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">
          Personal Finance Management Platform
        </span>

        <h1 className="mt-8 max-w-4xl text-5xl font-bold leading-tight md:text-7xl">
          Track Every Rupee.
          <br />
          Build Better Money Habits.
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-zinc-400">
          FinTrack helps you manage transactions, budgets, goals, accounts and
          analytics — all in one place.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link to="/signup">
            <Button className="flex items-center gap-2">
              Get Started <ArrowRight size={18} />
            </Button>
          </Link>

          <Link to="/dashboard">
            <Button variant="secondary">View Demo Dashboard</Button>
          </Link>
        </div>
      </section>

      {/* Feature Preview */}
      <section className="mx-auto grid max-w-7xl gap-6 px-6 pb-24 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <Wallet className="mb-4 text-emerald-400" size={30} />
          <h3 className="text-xl font-semibold">Multi-Account Wallets</h3>
          <p className="mt-2 text-zinc-400">
            Cash, UPI, bank accounts and credit cards in one dashboard.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <BarChart3 className="mb-4 text-emerald-400" size={30} />
          <h3 className="text-xl font-semibold">Smart Analytics</h3>
          <p className="mt-2 text-zinc-400">
            Spending trends, category insights and monthly budget tracking.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <ShieldCheck className="mb-4 text-emerald-400" size={30} />
          <h3 className="text-xl font-semibold">Secure Authentication</h3>
          <p className="mt-2 text-zinc-400">
            JWT authentication with refresh tokens and protected routes.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Landing;