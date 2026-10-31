
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  ShoppingBag,
  CreditCard,
  CalendarDays,
  RefreshCw,
  ArrowRight,
  Briefcase,
  Utensils,
  Car,
  Coffee,
  CircleDollarSign,
  Sparkles,
} from "lucide-react";

import { Link } from "react-router-dom";

import { getDashboardSummary } from "../../services/dashboardService";
import { getAnalytics } from "../../services/analyticsService";
import { getBudgets } from "../../services/budgetService";
import { getGoals } from "../../services/goalService";

const COLORS = [
  "#34d399",
  "#60a5fa",
  "#a78bfa",
  "#fb923c",
  "#f472b6",
  "#facc15",
  "#22d3ee",
  "#818cf8",
];

const formatINR = (amount = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

const formatCompactINR = (amount = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(amount) || 0);

const formatDate = (date) => {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getMonth = () => {
  const now = new Date();

  return `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;
};

const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";

  return "Good evening";
};

const getTransactionIcon = (category = "") => {
  const value = category.toLowerCase();

  if (value.includes("food") || value.includes("grocery"))
    return ShoppingBag;

  if (value.includes("transport") || value.includes("travel"))
    return Car;

  if (value.includes("salary") || value.includes("income"))
    return Briefcase;

  if (value.includes("dining") || value.includes("restaurant"))
    return Utensils;

  if (value.includes("coffee"))
    return Coffee;

  return CreditCard;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 shadow-xl">
      <p className="mb-2 text-sm font-semibold text-white">{label}</p>

      {payload.map((item) => (
        <p
          key={item.dataKey}
          className="mt-1 text-xs"
          style={{ color: item.color }}
        >
          {item.name}: {formatINR(item.value)}
        </p>
      ))}
    </div>
  );
};

const StatCard = ({
  title,
  amount,
  change,
  description,
  icon: Icon,
  color = "emerald",
}) => {
  const colorStyles = {
    emerald: "bg-emerald-500/10 text-emerald-400",
    blue: "bg-blue-500/10 text-blue-400",
    red: "bg-red-500/10 text-red-400",
    purple: "bg-purple-500/10 text-purple-400",
  };

  return (
    <div className="group rounded-2xl border border-zinc-800 bg-[#111513] p-5 transition duration-300 hover:-translate-y-1 hover:border-emerald-500/30">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-zinc-400">{title}</p>

        <div className={`rounded-xl p-2.5 ${colorStyles[color]}`}>
          <Icon size={20} />
        </div>
      </div>

      <h3 className="mt-5 break-words text-2xl font-bold tracking-tight text-white">
        {amount}
      </h3>

      <div className="mt-3">
        {change ? (
          <span className="text-xs font-medium text-emerald-400">
            {change}
          </span>
        ) : null}

        <span className="ml-2 text-xs text-zinc-600">
          {description}
        </span>
      </div>
    </div>
  );
};

const SectionHeading = ({ title, subtitle, action }) => (
  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
    <div>
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      {subtitle && (
        <p className="mt-1 text-xs text-zinc-500">{subtitle}</p>
      )}
    </div>

    {action}
  </div>
);

const Dashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [budgetSummary, setBudgetSummary] = useState({
    totalBudget: 0,
    totalSpent: 0,
    totalRemaining: 0,
  });

  const [goals, setGoals] = useState([]);
  const [goalSummary, setGoalSummary] = useState({
    totalGoals: 0,
    activeGoals: 0,
    completedGoals: 0,
    totalTarget: 0,
    totalSaved: 0,
    totalRemaining: 0,
  });

  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [budgetsLoading, setBudgetsLoading] = useState(true);
  const [goalsLoading, setGoalsLoading] = useState(true);

  const [errors, setErrors] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState("This month");
  const [showFullBreakdown, setShowFullBreakdown] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);

    try {
      const result = await getDashboardSummary();

      setDashboard(result);
      setErrors((previous) => ({ ...previous, dashboard: "" }));
    } catch (error) {
      setErrors((previous) => ({
        ...previous,
        dashboard:
          error.response?.data?.message ||
          "Unable to load dashboard information.",
      }));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);

    try {
      const result = await getAnalytics();

      setAnalytics(result);
      setErrors((previous) => ({ ...previous, analytics: "" }));
    } catch (error) {
      setErrors((previous) => ({
        ...previous,
        analytics:
          error.response?.data?.message ||
          "Unable to load analytics.",
      }));
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  const loadBudgets = useCallback(async () => {
    setBudgetsLoading(true);

    try {
      const result = await getBudgets(getMonth());

      setBudgets(Array.isArray(result.budgets) ? result.budgets : []);

      setBudgetSummary(
        result.summary || {
          totalBudget: 0,
          totalSpent: 0,
          totalRemaining: 0,
        }
      );

      setErrors((previous) => ({ ...previous, budgets: "" }));
    } catch (error) {
      setErrors((previous) => ({
        ...previous,
        budgets:
          error.response?.data?.message ||
          "Unable to load budgets.",
      }));
    } finally {
      setBudgetsLoading(false);
    }
  }, []);

  const loadGoals = useCallback(async () => {
    setGoalsLoading(true);

    try {
      const result = await getGoals();

      setGoals(Array.isArray(result.goals) ? result.goals : []);

      setGoalSummary(
        result.summary || {
          totalGoals: 0,
          activeGoals: 0,
          completedGoals: 0,
          totalTarget: 0,
          totalSaved: 0,
          totalRemaining: 0,
        }
      );

      setErrors((previous) => ({ ...previous, goals: "" }));
    } catch (error) {
      setErrors((previous) => ({
        ...previous,
        goals:
          error.response?.data?.message ||
          "Unable to load savings goals.",
      }));
    } finally {
      setGoalsLoading(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);

    await Promise.all([
      loadDashboard(),
      loadAnalytics(),
      loadBudgets(),
      loadGoals(),
    ]);

    setRefreshing(false);
  }, [loadDashboard, loadAnalytics, loadBudgets, loadGoals]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const summary = dashboard?.summary || {};

  const recentTransactions = dashboard?.recentTransactions || [];

  const monthlyTrends = useMemo(() => {
    return (analytics?.monthlyTrends || []).map((item) => ({
      month: item.label || item.month || "Unknown",
      income: Number(item.income) || 0,
      expenses: Number(item.expenses) || 0,
    }));
  }, [analytics]);

  const expenseBreakdown = useMemo(() => {
    return (analytics?.expenseBreakdown || [])
      .map((item) => ({
        category: item.category || "Other",
        amount: Number(item.amount) || 0,
        percentage: Number(item.percentage) || 0,
      }))
      .filter((item) => item.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [analytics]);

  const totalCategoryExpenses = expenseBreakdown.reduce(
    (total, item) => total + item.amount,
    0
  );

  const topGoals = useMemo(() => {
    return goals
      .filter((goal) => goal.status === "active")
      .sort((a, b) => {
        const progressA =
          Number(a.targetAmount) > 0
            ? Number(a.currentAmount) / Number(a.targetAmount)
            : 0;

        const progressB =
          Number(b.targetAmount) > 0
            ? Number(b.currentAmount) / Number(b.targetAmount)
            : 0;

        return progressB - progressA;
      })
      .slice(0, 3);
  }, [goals]);

  const budgetUsage =
    Number(budgetSummary.totalBudget) > 0
      ? (Number(budgetSummary.totalSpent) /
          Number(budgetSummary.totalBudget)) *
        100
      : 0;

  const currentDate = new Date();

  const dateLabel = currentDate.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-full space-y-7 pb-10 text-white">
      {/* Header */}
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-zinc-500">{dateLabel}</p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            {getGreeting()}!{" "}
            <span className="text-emerald-400">Welcome back.</span>
          </h1>

          <p className="mt-2 text-sm text-zinc-400">
            Here's what's happening with your finances.
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
          </div>

          <button
            type="button"
            onClick={refreshAll}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-xs font-medium text-zinc-300 transition hover:border-emerald-500/40 hover:text-white disabled:opacity-50"
          >
            <RefreshCw
              size={15}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>
      </section>

      {/* Dashboard error */}
      {errors.dashboard && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300"
        >
          <span>{errors.dashboard}</span>

          <button
            onClick={loadDashboard}
            className="font-semibold hover:text-white"
          >
            Retry
          </button>
        </div>
      )}

      {/* Financial overview */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Net Cash Flow"
          amount={
            loading ? "—" : formatINR(summary.netCashFlow)
          }
          description="All-time income minus expenses"
          icon={Wallet}
          color="emerald"
        />

        <StatCard
          title="Total Income"
          amount={
            loading ? "—" : formatINR(summary.totalIncome)
          }
          description="All-time income"
          icon={ArrowDownRight}
          color="blue"
        />

        <StatCard
          title="Total Expenses"
          amount={
            loading ? "—" : formatINR(summary.totalExpenses)
          }
          description="All-time expenses"
          icon={ArrowUpRight}
          color="red"
        />

        <StatCard
          title="Monthly Savings"
          amount={
            loading ? "—" : formatINR(summary.monthlyNetCashFlow)
          }
          description="Current month net cash flow"
          icon={PiggyBank}
          color="purple"
        />
      </section>

      {/* Monthly financial overview */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800 bg-[#111513] p-5">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <TrendingUp size={15} className="text-emerald-400" />
            Monthly income
          </div>

          <p className="mt-3 text-xl font-bold">
            {loading ? "—" : formatINR(summary.monthlyIncome)}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-[#111513] p-5">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <TrendingDown size={15} className="text-red-400" />
            Monthly expenses
          </div>

          <p className="mt-3 text-xl font-bold">
            {loading ? "—" : formatINR(summary.monthlyExpenses)}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-[#111513] p-5">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <CircleDollarIcon />
            Transactions this month
          </div>

          <p className="mt-3 text-xl font-bold">
            {loading ? "—" : summary.monthlyTransactionCount ?? 0}
          </p>
        </div>
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.6fr_1fr]">
        {/* Cash flow */}
        <div className="rounded-2xl border border-zinc-800 bg-[#111513] p-5 sm:p-6">
          <SectionHeading
            title="Cash flow"
            subtitle="Income vs expenses · Last six months"
          />

          <div className="mb-5 flex flex-wrap gap-5 text-xs">
            <span className="flex items-center gap-2 text-zinc-400">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              Income
            </span>

            <span className="flex items-center gap-2 text-zinc-400">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              Expenses
            </span>
          </div>

          <div className="h-[290px] min-w-0">
            {analyticsLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                Loading financial trends...
              </div>
            ) : errors.analytics ? (
              <div className="flex h-full items-center justify-center text-center text-sm text-zinc-500">
                {errors.analytics}
              </div>
            ) : monthlyTrends.length === 0 ? (
              <EmptyState message="Your monthly financial trends will appear here." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={monthlyTrends}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="incomeGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#34d399"
                        stopOpacity={0.25}
                      />
                      <stop
                        offset="100%"
                        stopColor="#34d399"
                        stopOpacity={0}
                      />
                    </linearGradient>

                    <linearGradient
                      id="expenseGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#f87171"
                        stopOpacity={0.2}
                      />
                      <stop
                        offset="100%"
                        stopColor="#f87171"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    stroke="#27272a"
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#71717a", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />

                  <YAxis
                    tickFormatter={formatCompactINR}
                    tick={{ fill: "#71717a", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={75}
                  />

                  <Tooltip content={<CustomTooltip />} />

                  <Area
                    type="monotone"
                    dataKey="income"
                    name="Income"
                    stroke="#34d399"
                    strokeWidth={2.5}
                    fill="url(#incomeGradient)"
                    activeDot={{ r: 5 }}
                  />

                  <Area
                    type="monotone"
                    dataKey="expenses"
                    name="Expenses"
                    stroke="#f87171"
                    strokeWidth={2.5}
                    fill="url(#expenseGradient)"
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Expense categories */}
        <div className="rounded-2xl border border-zinc-800 bg-[#111513] p-5 sm:p-6">
          <SectionHeading
            title="Expense breakdown"
            subtitle="Where your money goes"
          />

          {analyticsLoading ? (
            <div className="flex h-[330px] items-center justify-center text-sm text-zinc-500">
              Loading categories...
            </div>
          ) : errors.analytics ? (
            <div className="flex h-[330px] items-center justify-center text-center text-sm text-zinc-500">
              Category data unavailable.
            </div>
          ) : expenseBreakdown.length === 0 ? (
            <EmptyState message="Your spending breakdown will appear here." />
          ) : (
            <>
              <div className="relative h-[210px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseBreakdown}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={83}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {expenseBreakdown.map((item, index) => (
                        <Cell
                          key={item.category + index}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>

                    <Tooltip
                      formatter={(value, name) => [
                        formatINR(value),
                        name,
                      ]}
                      contentStyle={{
                        backgroundColor: "#09090b",
                        border: "1px solid #3f3f46",
                        borderRadius: "12px",
                        color: "#fff",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xs text-zinc-500">
                    Total expenses
                  </span>
                  <span className="mt-1 text-xl font-bold">
                    {formatCompactINR(totalCategoryExpenses)}
                  </span>
                </div>
              </div>

              <div className="mt-3 space-y-3">
                {expenseBreakdown.slice(0, 4).map((item, index) => (
                  <div
                    key={item.category + index}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor:
                            COLORS[index % COLORS.length],
                        }}
                      />

                      <span className="truncate text-xs text-zinc-400">
                        {item.category}
                      </span>
                    </div>

                    <span className="shrink-0 text-xs font-semibold text-zinc-200">
                      {formatINR(item.amount)}
                    </span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowFullBreakdown(true)}
                className="mt-5 w-full rounded-xl border border-zinc-700 py-2.5 text-xs font-semibold text-emerald-400 transition hover:border-emerald-500/40 hover:bg-emerald-500/5"
              >
                View full breakdown <ArrowRight size={14} className="ml-1 inline" />
              </button>
            </>
          )}
        </div>
      </section>

      {/* Transactions and budget */}
      <section className="grid gap-5 xl:grid-cols-[1.45fr_1fr]">
        {/* Recent transactions */}
        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#111513]">
          <div className="flex items-center justify-between gap-3 border-b border-zinc-800 p-5 sm:px-6">
            <div>
              <h2 className="font-semibold">Recent transactions</h2>
              <p className="mt-1 text-xs text-zinc-500">
                Your latest financial activity
              </p>
            </div>

            <Link
              to="/transactions"
              className="text-xs font-semibold text-emerald-400 transition hover:text-emerald-300"
            >
              View all <ArrowRight size={13} className="ml-1 inline" />
            </Link>
          </div>

          {loading ? (
            <div className="flex h-48 items-center justify-center text-sm text-zinc-500">
              Loading transactions...
            </div>
          ) : recentTransactions.length === 0 ? (
            <EmptyState message="Add your first transaction to see it here." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] text-left">
                <thead>
                  <tr className="border-b border-zinc-800 text-[10px] uppercase tracking-wider text-zinc-600">
                    <th className="px-5 py-3 font-medium sm:px-6">
                      Transaction
                    </th>
                    <th className="px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 text-right font-medium sm:px-6">
                      Amount
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {recentTransactions.map((transaction) => {
                    const Icon = getTransactionIcon(transaction.category);

                    const isIncome = transaction.type === "income";

                    return (
                      <tr
                        key={transaction._id}
                        className="border-b border-zinc-800/70 transition hover:bg-zinc-900/60 last:border-0"
                      >
                        <td className="px-5 py-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-zinc-800 p-2.5 text-zinc-300">
                              <Icon size={16} />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-xs font-medium text-zinc-200">
                                {transaction.title || "Transaction"}
                              </p>

                              <p className="mt-1 text-[10px] text-zinc-500">
                                {transaction.category || "Other"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-xs text-zinc-500">
                          {formatDate(transaction.date)}
                        </td>

                        <td
                          className={`whitespace-nowrap px-5 py-4 text-right text-xs font-semibold sm:px-6 ${
                            isIncome
                              ? "text-emerald-400"
                              : "text-zinc-200"
                          }`}
                        >
                          {isIncome ? "+" : "−"}
                          {formatINR(transaction.amount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Monthly budget */}
        <div className="rounded-2xl border border-zinc-800 bg-[#111513] p-5 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-semibold">Monthly budget</h2>
              <p className="mt-1 text-xs text-zinc-500">
                Your overall spending limit
              </p>
            </div>

            <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-400">
              <Wallet size={19} />
            </div>
          </div>

          {budgetsLoading ? (
            <div className="flex h-48 items-center justify-center text-sm text-zinc-500">
              Loading budget...
            </div>
          ) : errors.budgets ? (
            <div className="flex h-48 flex-col items-center justify-center text-center text-sm text-zinc-500">
              <p>{errors.budgets}</p>
              <button
                onClick={loadBudgets}
                className="mt-3 text-emerald-400"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              <p className="mt-7 text-3xl font-bold">
                {formatINR(budgetSummary.totalSpent)}
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                of {formatINR(budgetSummary.totalBudget)} total budget
              </p>

              <div className="mt-6 h-3 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    budgetUsage > 100
                      ? "bg-red-400"
                      : budgetUsage >= 80
                        ? "bg-amber-400"
                        : "bg-emerald-400"
                  }`}
                  style={{
                    width: `${Math.min(Math.max(budgetUsage, 0), 100)}%`,
                  }}
                />
              </div>

              <div className="mt-3 flex justify-between gap-2 text-xs">
                <span
                  className={
                    budgetUsage > 100
                      ? "font-semibold text-red-400"
                      : "font-semibold text-emerald-400"
                  }
                >
                  {budgetUsage.toFixed(1)}% utilized
                </span>

                <span className="text-zinc-500">
                  {formatINR(budgetSummary.totalRemaining)} remaining
                </span>
              </div>

              {budgetUsage > 100 && (
                <p className="mt-3 text-xs text-red-400">
                  Your combined spending has exceeded your budget.
                </p>
              )}

              <div className="mt-6 border-t border-zinc-800 pt-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-300">
                    Category budgets
                  </span>

                  <Link
                    to="/budgets"
                    className="text-xs text-emerald-400 hover:text-emerald-300"
                  >
                    Manage
                  </Link>
                </div>

                {budgets.length === 0 ? (
                  <p className="text-xs text-zinc-500">
                    No budgets created for this month.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {budgets.slice(0, 3).map((budget) => {
                      const spent = Number(budget.spent) || 0;
                      const limit = Number(budget.amount) || 0;

                      const percentage =
                        limit > 0 ? (spent / limit) * 100 : 0;

                      return (
                        <div key={budget._id}>
                          <div className="mb-1.5 flex justify-between gap-2 text-xs">
                            <span className="truncate text-zinc-400">
                              {budget.category}
                            </span>

                            <span className="shrink-0 text-zinc-300">
                              {Math.round(percentage)}%
                            </span>
                          </div>

                          <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                            <div
                              className={`h-full rounded-full ${
                                percentage > 100
                                  ? "bg-red-400"
                                  : percentage >= 80
                                    ? "bg-amber-400"
                                    : "bg-emerald-400"
                              }`}
                              style={{
                                width: `${Math.min(Math.max(percentage, 0), 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Savings goals */}
      <section className="rounded-2xl border border-zinc-800 bg-[#111513] p-5 sm:p-6">
        <SectionHeading
          title="Savings goals"
          subtitle="Track your progress towards financial milestones"
          action={
            <Link
              to="/goals"
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
            >
              View all <ArrowRight size={13} className="ml-1 inline" />
            </Link>
          }
        />

        {goalsLoading ? (
          <div className="flex h-40 items-center justify-center text-sm text-zinc-500">
            Loading savings goals...
          </div>
        ) : errors.goals ? (
          <div className="flex h-40 flex-col items-center justify-center text-sm text-zinc-500">
            <p>{errors.goals}</p>
            <button
              onClick={loadGoals}
              className="mt-3 text-emerald-400"
            >
              Retry
            </button>
          </div>
        ) : goals.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-700 p-8 text-center">
            <Target size={28} className="mx-auto text-zinc-500" />
            <p className="mt-3 text-sm text-zinc-300">
              No savings goals yet
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Create a goal and start tracking your savings.
            </p>
            <Link
              to="/goals"
              className="mt-4 inline-block text-xs font-semibold text-emerald-400"
            >
              Create your first goal
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-5 grid gap-3 sm:grid-cols-3">
              <GoalSummary
                label="Total goals"
                value={goalSummary.totalGoals}
              />
              <GoalSummary
                label="Total saved"
                value={formatINR(goalSummary.totalSaved)}
              />
              <GoalSummary
                label="Active goals"
                value={goalSummary.activeGoals}
              />
            </div>

            {topGoals.length === 0 ? (
              <p className="py-5 text-center text-sm text-zinc-500">
                No active goals at the moment.
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {topGoals.map((goal, index) => {
                  const saved = Number(goal.currentAmount) || 0;
                  const target = Number(goal.targetAmount) || 0;

                  const progress =
                    target > 0
                      ? Math.min((saved / target) * 100, 100)
                      : 0;

                  return (
                    <div
                      key={goal._id}
                      className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 transition hover:border-emerald-500/30"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="rounded-lg bg-zinc-800 p-2 text-emerald-400">
                            <Target size={17} />
                          </div>

                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-semibold text-zinc-200">
                              {goal.name}
                            </h3>
                            <p className="text-[10px] text-zinc-500">
                              {goal.category || "Savings"}
                            </p>
                          </div>
                        </div>

                        <span className="text-xs font-semibold text-emerald-400">
                          {progress.toFixed(0)}%
                        </span>
                      </div>

                      <div className="mt-5 flex items-center justify-between gap-2 text-xs">
                        <span className="text-zinc-400">
                          {formatINR(saved)}
                        </span>
                        <span className="text-zinc-500">
                          {formatINR(target)}
                        </span>
                      </div>

                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            index === 0
                              ? "bg-emerald-400"
                              : index === 1
                                ? "bg-blue-400"
                                : "bg-purple-400"
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      <p className="mt-3 text-[10px] text-zinc-500">
                        {formatINR(Math.max(target - saved, 0))} remaining
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </section>

      {/* Full expense breakdown modal */}
      {showFullBreakdown && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={() => setShowFullBreakdown(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">
                  Expense breakdown
                </h2>
                <p className="mt-1 text-xs text-zinc-500">
                  All your spending categories
                </p>
              </div>

              <button
                onClick={() => setShowFullBreakdown(false)}
                className="rounded-lg px-3 py-2 text-zinc-400 hover:bg-zinc-800"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
              <p className="text-xs text-zinc-500">
                Total categorized expenses
              </p>
              <p className="mt-1 text-2xl font-bold">
                {formatINR(totalCategoryExpenses)}
              </p>
            </div>

            <div className="mt-6 space-y-5">
              {expenseBreakdown.map((item, index) => {
                const percentage =
                  totalCategoryExpenses > 0
                    ? (item.amount / totalCategoryExpenses) * 100
                    : 0;

                return (
                  <div key={item.category + index}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{
                            backgroundColor:
                              COLORS[index % COLORS.length],
                          }}
                        />
                        <span className="text-sm text-zinc-300">
                          {item.category}
                        </span>
                      </div>

                      <span className="text-sm font-semibold">
                        {formatINR(item.amount)}
                      </span>
                    </div>

                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor:
                            COLORS[index % COLORS.length],
                        }}
                      />
                    </div>

                    <p className="mt-1 text-right text-xs text-zinc-500">
                      {percentage.toFixed(1)}% of spending
                    </p>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setShowFullBreakdown(false)}
              className="mt-6 w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 pt-5 text-xs text-zinc-600">
        <span>FinTrack · Personal Finance Management</span>
        <span className="flex items-center gap-1.5">
          <Sparkles size={13} className="text-emerald-500" />
          Your finances, simplified.
        </span>
      </div>
    </div>
  );
};

const GoalSummary = ({ label, value }) => (
  <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
    <p className="text-xs text-zinc-500">{label}</p>
    <p className="mt-2 break-words text-lg font-bold text-white">
      {value}
    </p>
  </div>
);

const EmptyState = ({ message }) => (
  <div className="flex h-full min-h-[180px] flex-col items-center justify-center px-4 text-center">
    <CircleDollarIcon />
    <p className="mt-3 text-sm text-zinc-400">{message}</p>
  </div>
);

const CircleDollarIcon = () => (
  <CircleDollarSign size={26} className="text-zinc-600" />
);

export default Dashboard;
