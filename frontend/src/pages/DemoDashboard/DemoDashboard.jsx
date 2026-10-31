
import { useState } from "react";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Target,
  ChartNoAxesCombined,
  Settings,
  Search,
  Bell,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  CreditCard,
  ShoppingBag,
  Coffee,
  Car,
  Home,
  Utensils,
  Briefcase,
  Menu,
  X,
  ChevronDown,
  MoreHorizontal,
  CalendarDays,
  Download,
  PiggyBank,
  Sparkles,
  LogIn,
  CircleHelp,
} from "lucide-react";
import { Link } from "react-router-dom";

const navigation = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Transactions", icon: ArrowLeftRight },
  { label: "Accounts", icon: Wallet },
  { label: "Budgets", icon: ChartNoAxesCombined },
  { label: "Savings Goals", icon: Target },
];

const summaryCards = [
  {
    title: "Total Balance",
    amount: "₹1,24,580",
    change: "+12.8%",
    description: "Compared to last month",
    icon: Wallet,
    positive: true,
  },
  {
    title: "Total Income",
    amount: "₹65,000",
    change: "+8.2%",
    description: "Compared to last month",
    icon: ArrowDownRight,
    positive: true,
  },
  {
    title: "Total Expenses",
    amount: "₹28,450",
    change: "-4.5%",
    description: "Compared to last month",
    icon: ArrowUpRight,
    positive: true,
  },
  {
    title: "Total Savings",
    amount: "₹36,550",
    change: "+18.6%",
    description: "Compared to last month",
    icon: PiggyBank,
    positive: true,
  },
];

const transactions = [
  {
    name: "Monthly Salary",
    category: "Salary",
    date: "31 Oct 2026",
    amount: "+₹45,000",
    type: "income",
    icon: Briefcase,
    color: "emerald",
  },
  {
    name: "Grocery Shopping",
    category: "Food & Groceries",
    date: "30 Oct 2026",
    amount: "-₹2,450",
    type: "expense",
    icon: ShoppingBag,
    color: "orange",
  },
  {
    name: "Netflix Subscription",
    category: "Entertainment",
    date: "29 Oct 2026",
    amount: "-₹649",
    type: "expense",
    icon: CreditCard,
    color: "red",
  },
  {
    name: "Restaurant",
    category: "Food & Dining",
    date: "28 Oct 2026",
    amount: "-₹850",
    type: "expense",
    icon: Utensils,
    color: "yellow",
  },
  {
    name: "Cab Booking",
    category: "Transportation",
    date: "27 Oct 2026",
    amount: "-₹320",
    type: "expense",
    icon: Car,
    color: "blue",
  },
];

const categories = [
  { name: "Food & Dining", amount: "₹8,500", percent: 85, color: "bg-emerald-400" },
  { name: "Shopping", amount: "₹6,200", percent: 62, color: "bg-blue-400" },
  { name: "Transportation", amount: "₹4,500", percent: 45, color: "bg-purple-400" },
  { name: "Entertainment", amount: "₹3,250", percent: 32, color: "bg-orange-400" },
  { name: "Other", amount: "₹6,000", percent: 60, color: "bg-pink-400" },
];

const goals = [
  {
    name: "New Laptop",
    saved: 45000,
    target: 80000,
    icon: CreditCard,
    color: "bg-emerald-400",
  },
  {
    name: "Emergency Fund",
    saved: 25000,
    target: 50000,
    icon: ShieldIcon,
    color: "bg-blue-400",
  },
  {
    name: "Vacation",
    saved: 12000,
    target: 30000,
    icon: Target,
    color: "bg-purple-400",
  },
];

const chartData = [
  { month: "May", income: 65, expense: 42 },
  { month: "Jun", income: 75, expense: 48 },
  { month: "Jul", income: 60, expense: 40 },
  { month: "Aug", income: 85, expense: 52 },
  { month: "Sep", income: 72, expense: 44 },
  { month: "Oct", income: 95, expense: 56 },
];

function ShieldIcon(props) {
  return <Target {...props} />;
}

const formatAmount = (amount) =>
  `₹${Number(amount).toLocaleString("en-IN")}`;

const DemoDashboard = () => {
  const [activePage, setActivePage] = useState("Overview");
  const [period, setPeriod] = useState("This month");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [transactionType, setTransactionType] = useState("expense");

  const filteredTransactions = transactions.filter((transaction) => {
    const query = searchQuery.toLowerCase();

    return (
      transaction.name.toLowerCase().includes(query) ||
      transaction.category.toLowerCase().includes(query)
    );
  });

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-[#090b0a] text-white">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-zinc-800 bg-[#101311] transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-zinc-800 px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500 p-2.5 text-zinc-950">
              <Wallet size={22} />
            </div>
            <div>
              <h1 className="text-lg font-bold">FinTrack</h1>
              <p className="text-[11px] text-zinc-500">Personal Finance OS</p>
            </div>
          </Link>

          <button
            onClick={closeSidebar}
            className="text-zinc-400 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-7">
          <p className="mb-4 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-600">
            Workspace
          </p>

          <nav className="space-y-1.5">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = activePage === item.label;

              return (
                <button
                  key={item.label}
                  onClick={() => {
                    setActivePage(item.label);
                    closeSidebar();
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
                    active
                      ? "bg-emerald-500/10 font-semibold text-emerald-400"
                      : "text-zinc-400 hover:bg-zinc-800/70 hover:text-white"
                  }`}
                >
                  <Icon size={19} />
                  {item.label}
                  {active && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="my-8 border-t border-zinc-800" />

          <p className="mb-4 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-600">
            Preferences
          </p>

          <button
            onClick={() => setActivePage("Settings")}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
              activePage === "Settings"
                ? "bg-emerald-500/10 text-emerald-400"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            <Settings size={19} />
            Settings
          </button>

          <button
            onClick={() => setActivePage("Help")}
            className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <CircleHelp size={19} />
            Help & Support
          </button>
        </div>

        {/* Demo account */}
        <div className="border-t border-zinc-800 p-4">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4">
            <div className="flex items-center gap-2 text-emerald-400">
              <Sparkles size={15} />
              <span className="text-xs font-semibold">Demo Environment</span>
            </div>
            <p className="mt-2 text-xs leading-5 text-zinc-400">
              You're exploring FinTrack with sample financial data.
            </p>
            <Link
              to="/signup"
              className="mt-4 flex items-center justify-center rounded-lg bg-emerald-500 py-2.5 text-xs font-semibold text-zinc-950 transition hover:bg-emerald-400"
            >
              Create your account
            </Link>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="min-h-screen lg:pl-64">
        {/* Top navbar */}
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-zinc-800 bg-[#090b0a]/90 px-4 backdrop-blur-xl sm:px-7 lg:px-9">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg border border-zinc-800 p-2 text-zinc-300 lg:hidden"
            >
              <Menu size={20} />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold sm:text-lg">
                  {activePage}
                </h2>
                <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-emerald-400">
                  Demo
                </span>
              </div>
              <p className="hidden text-xs text-zinc-500 sm:block">
                Your financial workspace at a glance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative hidden md:block">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
              />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search transactions..."
                className="w-56 rounded-xl border border-zinc-800 bg-zinc-900 py-2.5 pl-9 pr-3 text-xs text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-500"
              />
            </div>

            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative rounded-xl border border-zinc-800 p-2.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
              >
                <Bell size={18} />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full border border-[#090b0a] bg-emerald-400" />
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-14 z-50 w-72 rounded-xl border border-zinc-700 bg-zinc-900 p-4 shadow-2xl">
                  <p className="text-sm font-semibold">Notifications</p>
                  <p className="mt-3 text-xs leading-5 text-zinc-400">
                    Your monthly budget is on track. Keep monitoring your
                    spending!
                  </p>
                </div>
              )}
            </div>

            <div className="hidden h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-zinc-950 sm:flex">
              A
            </div>

            <Link
              to="/signup"
              className="hidden items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-semibold text-zinc-950 transition hover:bg-emerald-400 sm:flex"
            >
              <LogIn size={15} />
              Sign up
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="mx-auto max-w-[1600px] space-y-7 px-4 py-7 sm:px-7 lg:px-9">
          {/* Welcome section */}
          <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm text-zinc-500">
                Saturday, October 31, 2026
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                Welcome back, Aryan <span className="text-2xl">👋</span>
              </h1>
              <p className="mt-2 text-sm text-zinc-400">
                Here's an overview of your financial activity.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5">
                <CalendarDays size={16} className="text-zinc-500" />
                <select
                  value={period}
                  onChange={(event) => setPeriod(event.target.value)}
                  className="bg-transparent text-xs text-zinc-300 outline-none"
                >
                  <option>This month</option>
                  <option>Last month</option>
                  <option>Last 3 months</option>
                  <option>This year</option>
                </select>
                <ChevronDown size={14} className="text-zinc-500" />
              </div>

              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-semibold text-zinc-950 transition hover:bg-emerald-400"
              >
                <Plus size={16} />
                Add transaction
              </button>
            </div>
          </section>

          {/* Demo notice */}
          <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3">
            <Sparkles size={17} className="shrink-0 text-emerald-400" />
            <p className="text-xs leading-5 text-zinc-400">
              You're viewing a live interactive demo. All financial figures
              are sample data and changes are not saved.
            </p>
          </div>

          {/* Summary cards */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => {
              const Icon = card.icon;

              return (
                <div
                  key={card.title}
                  className="group rounded-2xl border border-zinc-800 bg-[#111513] p-5 transition duration-300 hover:-translate-y-1 hover:border-emerald-500/30"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-zinc-400">{card.title}</p>
                    <div className="rounded-xl bg-zinc-800/80 p-2.5 text-emerald-400">
                      <Icon size={19} />
                    </div>
                  </div>

                  <h3 className="mt-5 text-2xl font-bold tracking-tight text-white">
                    {card.amount}
                  </h3>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
                      <TrendingUp size={13} />
                      {card.change}
                    </span>
                    <span className="text-[11px] text-zinc-600">
                      {card.description}
                    </span>
                  </div>
                </div>
              );
            })}
          </section>

          {/* Main charts */}
          <section className="grid gap-5 xl:grid-cols-[1.65fr_1fr]">
            {/* Cash flow chart */}
            <div className="rounded-2xl border border-zinc-800 bg-[#111513] p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-white">Cash flow</h3>
                  <p className="mt-1 text-xs text-zinc-500">
                    Your income and expenses over time
                  </p>
                </div>

                <button className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-800 hover:text-white">
                  <MoreHorizontal size={19} />
                </button>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-5 text-xs">
                <span className="flex items-center gap-2 text-zinc-400">
                  <span className="h-2.5 w-2.5 rounded-sm bg-emerald-400" />
                  Income
                </span>
                <span className="flex items-center gap-2 text-zinc-400">
                  <span className="h-2.5 w-2.5 rounded-sm bg-zinc-600" />
                  Expenses
                </span>
              </div>

              <div className="mt-7 grid grid-cols-[38px_1fr] gap-3">
                <div className="flex h-52 flex-col justify-between pb-5 text-[10px] text-zinc-600">
                  <span>₹80k</span>
                  <span>₹60k</span>
                  <span>₹40k</span>
                  <span>₹20k</span>
                  <span>₹0</span>
                </div>

                <div className="relative flex h-52 items-end justify-around gap-3 border-b border-zinc-800 pb-0">
                  {[20, 40, 60, 80].map((line) => (
                    <div
                      key={line}
                      className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-zinc-800/70"
                      style={{ bottom: `${line}%` }}
                    />
                  ))}

                  {chartData.map((data) => (
                    <div
                      key={data.month}
                      className="relative z-10 flex h-full flex-1 items-end justify-center gap-1.5"
                    >
                      <div
                        title={`Income: ${data.income}%`}
                        style={{ height: `${data.income}%` }}
                        className="w-3 rounded-t-md bg-emerald-400 transition hover:bg-emerald-300 sm:w-5"
                      />
                      <div
                        title={`Expenses: ${data.expense}%`}
                        style={{ height: `${data.expense}%` }}
                        className="w-3 rounded-t-md bg-zinc-600 transition hover:bg-zinc-500 sm:w-5"
                      />
                      <span className="absolute -bottom-6 text-[10px] text-zinc-500">
                        {data.month}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-10 grid grid-cols-2 gap-4 border-t border-zinc-800 pt-5">
                <div>
                  <p className="text-xs text-zinc-500">Total income</p>
                  <p className="mt-1 text-lg font-bold text-emerald-400">
                    ₹65,000
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Total expenses</p>
                  <p className="mt-1 text-lg font-bold text-white">
                    ₹28,450
                  </p>
                </div>
              </div>
            </div>

            {/* Expense categories */}
            <div className="rounded-2xl border border-zinc-800 bg-[#111513] p-5 sm:p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-white">
                    Expense breakdown
                  </h3>
                  <p className="mt-1 text-xs text-zinc-500">
                    Where your money goes
                  </p>
                </div>
                <PieChartIcon />
              </div>

              <div className="mt-7 flex items-center justify-center">
                <div
                  className="relative flex h-40 w-40 items-center justify-center rounded-full"
                  style={{
                    background:
                      "conic-gradient(#34d399 0% 30%, #60a5fa 30% 52%, #a78bfa 52% 68%, #fb923c 68% 80%, #ec4899 80% 100%)",
                  }}
                >
                  <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-[#111513]">
                    <span className="text-[10px] text-zinc-500">
                      Total spent
                    </span>
                    <span className="mt-1 text-xl font-bold">₹28.4k</span>
                  </div>
                </div>
              </div>

              <div className="mt-7 space-y-4">
                {categories.map((category) => (
                  <div key={category.name}>
                    <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                      <span className="text-zinc-400">
                        {category.name}
                      </span>
                      <span className="font-semibold text-zinc-200">
                        {category.amount}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className={`h-full rounded-full ${category.color}`}
                        style={{ width: `${category.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Lower section */}
          <section className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
            {/* Transactions */}
            <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#111513]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 p-5 sm:px-6">
                <div>
                  <h3 className="font-semibold text-white">
                    Recent transactions
                  </h3>
                  <p className="mt-1 text-xs text-zinc-500">
                    Your latest financial activity
                  </p>
                </div>

                <button
                  onClick={() => setActivePage("Transactions")}
                  className="text-xs font-semibold text-emerald-400 transition hover:text-emerald-300"
                >
                  View all
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-left">
                  <thead>
                    <tr className="border-b border-zinc-800 text-[10px] uppercase tracking-wider text-zinc-600">
                      <th className="px-5 py-3 font-medium sm:px-6">Name</th>
                      <th className="px-5 py-3 font-medium">Date</th>
                      <th className="px-5 py-3 text-right font-medium sm:px-6">
                        Amount
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredTransactions.map((transaction) => {
                      const Icon = transaction.icon;

                      return (
                        <tr
                          key={transaction.name}
                          className="border-b border-zinc-800/70 transition hover:bg-zinc-900/60 last:border-0"
                        >
                          <td className="px-5 py-4 sm:px-6">
                            <div className="flex items-center gap-3">
                              <div className="rounded-xl bg-zinc-800 p-2.5 text-zinc-300">
                                <Icon size={16} />
                              </div>
                              <div>
                                <p className="text-xs font-medium text-zinc-200">
                                  {transaction.name}
                                </p>
                                <p className="mt-1 text-[10px] text-zinc-500">
                                  {transaction.category}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4 text-xs text-zinc-500">
                            {transaction.date}
                          </td>

                          <td
                            className={`px-5 py-4 text-right text-xs font-semibold sm:px-6 ${
                              transaction.type === "income"
                                ? "text-emerald-400"
                                : "text-zinc-200"
                            }`}
                          >
                            {transaction.amount}
                          </td>
                        </tr>
                      );
                    })}

                    {filteredTransactions.length === 0 && (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-5 py-10 text-center text-xs text-zinc-500"
                        >
                          No matching transactions found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Budget */}
            <div className="rounded-2xl border border-zinc-800 bg-[#111513] p-5 sm:p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-white">
                    Monthly budget
                  </h3>
                  <p className="mt-1 text-xs text-zinc-500">
                    Your spending limit
                  </p>
                </div>
                <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-400">
                  <Wallet size={19} />
                </div>
              </div>

              <div className="mt-7">
                <p className="text-3xl font-bold">₹28,450</p>
                <p className="mt-1 text-xs text-zinc-500">
                  of ₹40,000 total monthly budget
                </p>
              </div>

              <div className="mt-6 h-3 overflow-hidden rounded-full bg-zinc-800">
                <div className="h-full w-[71%] rounded-full bg-gradient-to-r from-emerald-500 to-teal-300" />
              </div>

              <div className="mt-3 flex justify-between text-xs">
                <span className="font-semibold text-emerald-400">
                  71% utilized
                </span>
                <span className="text-zinc-500">₹11,550 remaining</span>
              </div>

              <div className="mt-7 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={15} className="text-emerald-400" />
                  <span className="text-xs font-semibold text-zinc-200">
                    Budget status
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-zinc-400">
                  You're within your monthly budget. Keep it up!
                </p>
              </div>
            </div>
          </section>

          {/* Savings goals */}
          <section className="rounded-2xl border border-zinc-800 bg-[#111513] p-5 sm:p-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-white">Savings goals</h3>
                <p className="mt-1 text-xs text-zinc-500">
                  Small steps towards bigger milestones
                </p>
              </div>
              <button
                onClick={() => setActivePage("Savings Goals")}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
              >
                View all goals
              </button>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {goals.map((goal) => {
                const Icon = goal.icon;
                const percentage = Math.round(
                  (goal.saved / goal.target) * 100
                );

                return (
                  <div
                    key={goal.name}
                    className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="rounded-lg bg-zinc-800 p-2 text-emerald-400">
                        <Icon size={18} />
                      </div>
                      <span className="text-xs font-semibold text-emerald-400">
                        {percentage}%
                      </span>
                    </div>

                    <h4 className="mt-4 text-sm font-semibold text-white">
                      {goal.name}
                    </h4>

                    <p className="mt-2 text-xs text-zinc-400">
                      {formatAmount(goal.saved)}{" "}
                      <span className="text-zinc-600">
                        of {formatAmount(goal.target)}
                      </span>
                    </p>

                    <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className={`h-full rounded-full ${goal.color}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Footer */}
          <footer className="flex flex-col items-center justify-between gap-3 border-t border-zinc-800 py-6 text-xs text-zinc-600 sm:flex-row">
            <p>© 2026 FinTrack. Personal Finance OS.</p>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-emerald-500/80">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Demo environment
              </span>
              <Link to="/" className="transition hover:text-white">
                Back to homepage
              </Link>
            </div>
          </footer>
        </main>
      </div>

      {/* Add transaction demo modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-zinc-700 bg-[#111513] p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Add transaction</h3>
                <p className="mt-1 text-xs text-zinc-500">
                  Try the demo transaction form
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800"
              >
                <X size={19} />
              </button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2 rounded-xl bg-zinc-900 p-1">
              <button
                onClick={() => setTransactionType("expense")}
                className={`rounded-lg py-2.5 text-xs font-semibold transition ${
                  transactionType === "expense"
                    ? "bg-zinc-700 text-white"
                    : "text-zinc-500"
                }`}
              >
                Expense
              </button>
              <button
                onClick={() => setTransactionType("income")}
                className={`rounded-lg py-2.5 text-xs font-semibold transition ${
                  transactionType === "income"
                    ? "bg-emerald-500 text-zinc-950"
                    : "text-zinc-500"
                }`}
              >
                Income
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block text-xs text-zinc-400">
                Amount
                <input
                  type="number"
                  placeholder="Enter amount in ₹"
                  className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
                />
              </label>

              <label className="block text-xs text-zinc-400">
                Description
                <input
                  type="text"
                  placeholder="e.g. Grocery shopping"
                  className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
                />
              </label>

              <label className="block text-xs text-zinc-400">
                Category
                <select className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500">
                  <option>Food & Dining</option>
                  <option>Shopping</option>
                  <option>Transportation</option>
                  <option>Entertainment</option>
                  <option>Salary</option>
                  <option>Other</option>
                </select>
              </label>
            </div>

            <button
              onClick={() => setShowAddModal(false)}
              className="mt-6 w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400"
            >
              Got it — this is a demo
            </button>

            <p className="mt-3 text-center text-[10px] text-zinc-600">
              Sample data only. No transaction will be saved.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

function PieChartIcon() {
  return (
    <div className="rounded-xl bg-zinc-800 p-2.5 text-emerald-400">
      <ChartNoAxesCombined size={18} />
    </div>
  );
}

export default DemoDashboard;
