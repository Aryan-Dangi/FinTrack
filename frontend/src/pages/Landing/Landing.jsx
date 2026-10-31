
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  BarChart3,
  ShieldCheck,
  Target,
  CreditCard,
  PieChart,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

import Logo from "../../components/common/Logo";
import Button from "../../components/ui/Button";

const stats = [
  { label: "Total balance", value: "₹1,24,580.00", change: "+12.8%", positive: true },
  { label: "Monthly income", value: "₹65,000.00", change: "+8.2%", positive: true },
  { label: "Monthly expenses", value: "₹28,450.00", change: "-4.5%", positive: true },
];

const transactions = [
  { name: "Salary credited", category: "Income", date: "Today", amount: "+₹45,000", income: true, icon: ArrowDownRight },
  { name: "Grocery shopping", category: "Food & Groceries", date: "Today", amount: "-₹2,450", income: false, icon: Wallet },
  { name: "Netflix subscription", category: "Entertainment", date: "Yesterday", amount: "-₹649", income: false, icon: CreditCard },
];

const features = [
  {
    icon: Wallet,
    title: "All your money, one place",
    description: "Keep track of your bank accounts, cash, UPI and other financial accounts from a single dashboard.",
    tag: "Account management",
  },
  {
    icon: BarChart3,
    title: "Understand your spending",
    description: "Visualize income, expenses and spending patterns with meaningful financial analytics.",
    tag: "Smart analytics",
  },
  {
    icon: Target,
    title: "Make goals achievable",
    description: "Set savings goals, monitor your progress and stay focused on the financial milestones that matter.",
    tag: "Savings goals",
  },
  {
    icon: PieChart,
    title: "Stay ahead of budgets",
    description: "Set monthly budgets, monitor category-wise spending and keep unnecessary expenses under control.",
    tag: "Budget planning",
  },
  {
    icon: CreditCard,
    title: "Track every transaction",
    description: "Record income and expenses, organize transactions and understand where your money goes.",
    tag: "Transactions",
  },
  {
    icon: ShieldCheck,
    title: "Your finances stay yours",
    description: "Protected account access with authentication and secure session management.",
    tag: "Account security",
  },
];

const chartBars = [35, 52, 43, 70, 55, 83, 63, 95, 68, 78, 58, 88];

const DashboardPreview = () => {
  return (
    <div className="relative mx-auto mt-16 w-full max-w-6xl">
      <div className="absolute -inset-8 rounded-[40px] bg-emerald-500/10 blur-3xl" />

      <div className="relative overflow-hidden rounded-2xl border border-zinc-700/80 bg-[#111315] shadow-2xl shadow-black/60">
        {/* Window header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4 sm:px-7">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </div>

          <div className="hidden rounded-lg border border-zinc-800 bg-zinc-900 px-5 py-1.5 text-xs text-zinc-500 sm:block">
            app.fintrack.com/dashboard
          </div>

          <span className="text-xs font-medium text-emerald-400">
            LIVE PREVIEW
          </span>
        </div>

        <div className="grid md:grid-cols-[190px_1fr]">
          {/* Preview sidebar */}
          <aside className="hidden border-r border-zinc-800 bg-[#0d0f10] p-5 md:block">
            <div className="mb-9 flex items-center gap-2">
              <div className="rounded-lg bg-emerald-500 p-2 text-zinc-950">
                <Wallet size={18} />
              </div>
              <span className="font-bold text-white">FinTrack</span>
            </div>

            <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
              Workspace
            </p>

            {[
              ["Overview", BarChart3, true],
              ["Transactions", CreditCard, false],
              ["Accounts", Wallet, false],
              ["Budgets", PieChart, false],
              ["Goals", Target, false],
            ].map(([label, Icon, active]) => (
              <div
                key={label}
                className={`mb-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs ${
                  active
                    ? "bg-emerald-500/10 font-medium text-emerald-400"
                    : "text-zinc-500"
                }`}
              >
                <Icon size={15} />
                {label}
              </div>
            ))}

            <div className="mt-14 rounded-xl border border-zinc-800 bg-zinc-900 p-3">
              <div className="mb-2 flex items-center gap-2">
                <Sparkles size={14} className="text-emerald-400" />
                <span className="text-[11px] font-medium text-white">
                  Financial health
                </span>
              </div>
              <p className="text-xl font-bold text-emerald-400">Excellent</p>
              <p className="mt-1 text-[10px] text-zinc-500">
                You're on track this month.
              </p>
            </div>
          </aside>

          {/* Preview content */}
          <div className="min-w-0 p-4 sm:p-6 lg:p-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs text-zinc-500">Saturday, October 31, 2026</p>
                <h3 className="mt-1 text-xl font-bold text-white sm:text-2xl">
                  Good morning, Aryan
                </h3>
                <p className="mt-1 text-xs text-zinc-500">
                  Here's what's happening with your money.
                </p>
              </div>

              <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-300">
                October 2026
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4"
                >
                  <p className="text-xs text-zinc-500">{stat.label}</p>
                  <p className="mt-3 text-lg font-bold text-white sm:text-xl">
                    {stat.value}
                  </p>
                  <div className="mt-2 flex items-center gap-1">
                    {index === 2 ? (
                      <ArrowDownRight size={13} className="text-emerald-400" />
                    ) : (
                      <ArrowUpRight size={13} className="text-emerald-400" />
                    )}
                    <span className="text-[11px] text-emerald-400">
                      {stat.change}
                    </span>
                    <span className="text-[10px] text-zinc-600">
                      vs last month
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
              {/* Chart */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-white">
                      Cash flow
                    </h4>
                    <p className="mt-1 text-xs text-zinc-500">
                      Income and expenses overview
                    </p>
                  </div>
                  <TrendingUp size={18} className="text-emerald-400" />
                </div>

                <div className="mt-7 flex h-36 items-end gap-2 sm:gap-3">
                  {chartBars.map((height, index) => (
                    <div
                      key={index}
                      className="flex h-full flex-1 items-end"
                    >
                      <div
                        style={{ height: `${height}%` }}
                        className={`w-full rounded-t-sm ${
                          index % 3 === 0
                            ? "bg-emerald-400"
                            : "bg-emerald-500/25"
                        }`}
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex justify-between text-[10px] text-zinc-600">
                  <span>Jan</span>
                  <span>Mar</span>
                  <span>May</span>
                  <span>Jul</span>
                  <span>Sep</span>
                  <span>Dec</span>
                </div>
              </div>

              {/* Budget progress */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 sm:p-5">
                <h4 className="text-sm font-semibold text-white">
                  Monthly budget
                </h4>
                <p className="mt-1 text-xs text-zinc-500">
                  Your spending progress
                </p>

                <p className="mt-6 text-2xl font-bold text-white">
                  ₹28,450
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  of ₹40,000 monthly limit
                </p>

                <div className="mt-5 h-2 overflow-hidden rounded-full bg-zinc-800">
                  <div className="h-full w-[71%] rounded-full bg-emerald-400" />
                </div>

                <div className="mt-3 flex justify-between text-xs">
                  <span className="text-emerald-400">71% used</span>
                  <span className="text-zinc-500">₹11,550 left</span>
                </div>
              </div>
            </div>

            {/* Transactions */}
            <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-white">
                  Recent transactions
                </h4>
                <span className="text-xs text-emerald-400">
                  View all
                </span>
              </div>

              <div className="space-y-4">
                {transactions.map((transaction) => {
                  const Icon = transaction.icon;

                  return (
                    <div
                      key={transaction.name}
                      className="flex items-center justify-between gap-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="rounded-lg bg-zinc-800 p-2 text-zinc-300">
                          <Icon size={15} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-zinc-200">
                            {transaction.name}
                          </p>
                          <p className="mt-1 text-[10px] text-zinc-500">
                            {transaction.category} · {transaction.date}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`shrink-0 text-xs font-semibold ${
                          transaction.income
                            ? "text-emerald-400"
                            : "text-white"
                        }`}
                      >
                        {transaction.amount}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-5 left-1/2 hidden -translate-x-1/2 items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-5 py-2.5 text-xs text-zinc-300 shadow-xl sm:flex">
        <CheckCircle2 size={15} className="text-emerald-400" />
        Your finances, beautifully organized.
      </div>
    </div>
  );
};

const Landing = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen overflow-hidden bg-[#090b0a] text-white">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#090b0a]/90 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/" aria-label="FinTrack home">
            <Logo />
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-zinc-400 transition hover:text-white">
              Features
            </a>
            <a href="#how-it-works" className="text-sm text-zinc-400 transition hover:text-white">
              How it works
            </a>
            <Link to="/demo-dashboard" className="text-sm text-zinc-400 transition hover:text-emerald-400">
              Explore demo
            </Link>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <Link to="/login">
              <Button variant="secondary">Login</Button>
            </Link>
            <Link to="/signup">
              <Button className="flex items-center gap-2">
                Get Started <ArrowRight size={16} />
              </Button>
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg border border-zinc-800 p-2 text-zinc-300 md:hidden"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </nav>

        {mobileMenuOpen && (
          <div className="border-t border-zinc-800 bg-zinc-950 px-5 py-5 md:hidden">
            <div className="flex flex-col gap-5">
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-sm text-zinc-300">
                Features
              </a>
              <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-sm text-zinc-300">
                How it works
              </a>
              <Link to="/demo-dashboard" onClick={() => setMobileMenuOpen(false)} className="text-sm text-emerald-400">
                Explore demo
              </Link>
              <div className="flex gap-3 border-t border-zinc-800 pt-4">
                <Link to="/login" className="flex-1">
                  <Button variant="secondary" className="w-full">Login</Button>
                </Link>
                <Link to="/signup" className="flex-1">
                  <Button className="w-full">Get Started</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* Hero */}
        <section className="relative px-5 pb-20 pt-24 sm:px-8 sm:pt-32">
          <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-emerald-500/[0.07] blur-[130px]" />

          <div className="relative mx-auto max-w-5xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.07] px-4 py-2 text-xs font-medium text-emerald-400 sm:text-sm">
              <Sparkles size={14} />
              Your personal finance workspace
              <span className="h-1 w-1 rounded-full bg-emerald-400" />
              Built for better money habits
            </div>

            <h1 className="mx-auto mt-8 max-w-4xl text-5xl font-bold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
              Take control of your money.
              <span className="mt-2 block bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300 bg-clip-text text-transparent">
                Build a better financial future.
              </span>
            </h1>

            <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-zinc-400 sm:text-lg">
              Track your spending, manage budgets, organize accounts and
              monitor savings goals — all from one beautifully simple
              financial workspace.
            </p>

            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
              <Link to="/signup">
                <Button className="flex w-full items-center justify-center gap-2 px-7 py-3.5 sm:w-auto">
                  Start managing your money
                  <ArrowRight size={17} />
                </Button>
              </Link>

              <Link to="/demo-dashboard">
                <Button
                  variant="secondary"
                  className="flex w-full items-center justify-center gap-2 px-7 py-3.5 sm:w-auto"
                >
                  Explore live demo
                  <ArrowUpRight size={17} />
                </Button>
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-zinc-500">
              <span className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-400" />
                Simple to get started
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-400" />
                INR-focused tracking
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-400" />
                Your own financial workspace
              </span>
            </div>
          </div>

          <DashboardPreview />
        </section>

        {/* Trust / value strip */}
        <section className="border-y border-zinc-800/80 bg-zinc-900/30 px-5 py-8">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-12 gap-y-5 text-sm text-zinc-400">
            <span className="font-semibold text-zinc-200">
              Everything you need to stay financially organized
            </span>
            <span className="flex items-center gap-2">
              <Wallet size={17} className="text-emerald-400" /> Accounts
            </span>
            <span className="flex items-center gap-2">
              <BarChart3 size={17} className="text-emerald-400" /> Analytics
            </span>
            <span className="flex items-center gap-2">
              <Target size={17} className="text-emerald-400" /> Goals
            </span>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:py-32">
          <div className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
              Everything in one place
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">
              A clearer picture of your finances.
            </h2>
            <p className="mt-5 leading-7 text-zinc-400">
              From everyday expenses to long-term savings, FinTrack brings
              your financial activity together so you can make more informed
              decisions.
            </p>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="group rounded-2xl border border-zinc-800 bg-zinc-900/40 p-7 transition duration-300 hover:-translate-y-1 hover:border-emerald-500/30 hover:bg-zinc-900/80"
                >
                  <div className="flex items-center justify-between">
                    <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/10 p-3 text-emerald-400 transition group-hover:bg-emerald-500 group-hover:text-zinc-950">
                      <Icon size={23} />
                    </div>
                    <span className="text-xs text-zinc-600">
                      0{index + 1}
                    </span>
                  </div>

                  <h3 className="mt-7 text-lg font-semibold text-white">
                    {feature.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-zinc-400">
                    {feature.description}
                  </p>

                  <div className="mt-6 flex items-center gap-2 text-xs font-medium text-emerald-400">
                    {feature.tag}
                    <ChevronRight size={14} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="border-y border-zinc-800/70 bg-zinc-900/30 px-5 py-24 sm:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
                Get started in minutes
              </span>
              <h2 className="mt-4 text-3xl font-bold sm:text-5xl">
                Better money habits start here.
              </h2>
              <p className="mt-5 leading-7 text-zinc-400">
                A simple workflow to help you stay on top of your finances.
              </p>
            </div>

            <div className="mt-16 grid gap-10 md:grid-cols-3">
              {[
                {
                  number: "01",
                  title: "Create your account",
                  description: "Set up your personal FinTrack workspace and get started.",
                },
                {
                  number: "02",
                  title: "Organize your finances",
                  description: "Add accounts, record transactions and set monthly budgets.",
                },
                {
                  number: "03",
                  title: "Track your progress",
                  description: "Use analytics and savings goals to understand your financial journey.",
                },
              ].map((step) => (
                <div key={step.number} className="relative text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-lg font-bold text-emerald-400">
                    {step.number}
                  </div>
                  <h3 className="mt-6 text-lg font-semibold text-white">
                    {step.title}
                  </h3>
                  <p className="mx-auto mt-3 max-w-xs text-sm leading-7 text-zinc-400">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-5 py-24 sm:px-8 lg:py-32">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-zinc-900 to-zinc-950 px-6 py-16 text-center sm:px-12 sm:py-20">
            <div className="pointer-events-none absolute -right-20 -top-32 h-80 w-80 rounded-full bg-emerald-500/10 blur-[100px]" />

            <div className="relative">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                <TrendingUp size={27} />
              </div>

              <h2 className="mx-auto mt-7 max-w-3xl text-3xl font-bold sm:text-5xl">
                Your money deserves a better system.
              </h2>

              <p className="mx-auto mt-5 max-w-xl leading-7 text-zinc-400">
                Start building healthier financial habits with a clearer view
                of where your money goes and where you want it to go.
              </p>

              <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
                <Link to="/signup">
                  <Button className="flex w-full items-center justify-center gap-2 px-7 py-3.5 sm:w-auto">
                    Create your free account
                    <ArrowRight size={17} />
                  </Button>
                </Link>

                <Link to="/demo-dashboard">
                  <Button variant="secondary" className="w-full px-7 py-3.5 sm:w-auto">
                    View demo
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 sm:flex-row sm:items-center">
          <div>
            <Logo />
            <p className="mt-3 text-xs text-zinc-500">
              A simpler way to understand your money.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-sm text-zinc-400">
            <Link to="/login" className="transition hover:text-white">
              Login
            </Link>
            <Link to="/signup" className="transition hover:text-white">
              Create account
            </Link>
            <Link to="/demo-dashboard" className="transition hover:text-emerald-400">
              Explore demo
            </Link>
          </div>

          <p className="text-xs text-zinc-600">
            © {new Date().getFullYear()} FinTrack. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
