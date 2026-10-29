import { getAnalytics } from "../../services/analyticsService";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  ChartNoAxesCombined,
  CircleDollarSign,
  ReceiptText,
} from "lucide-react";
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const CURRENCY = "INR";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: CURRENCY,
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const formatCompactCurrency = (value) => {
  const amount = Number(value) || 0;

  if (Math.abs(amount) >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }

  if (Math.abs(amount) >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}k`;
  }

  return `₹${amount.toFixed(0)}`;
};

const COLORS = [
  "#818cf8",
  "#34d399",
  "#fbbf24",
  "#f472b6",
  "#60a5fa",
  "#a78bfa",
  "#fb923c",
  "#2dd4bf",
];

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  trend,
}) => (
  <div className="rounded-2xl border border-white/[0.07] bg-[#151922] p-5 transition hover:border-white/[0.14]">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-gray-400">{title}</p>
        <h3 className="mt-3 break-words text-2xl font-semibold tracking-tight text-white">
          {formatCurrency(value)}
        </h3>
      </div>

      <div className={`rounded-xl p-3 ${color}`}>
        <Icon size={21} />
      </div>
    </div>

    <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
      {trend === "up" && (
        <ArrowUpRight size={15} className="text-emerald-400" />
      )}
      {trend === "down" && (
        <ArrowDownRight size={15} className="text-rose-400" />
      )}
      <span>{subtitle}</span>
    </div>
  </div>
);

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-[#202530] p-4 shadow-xl">
      <p className="mb-2 text-sm font-medium text-white">{label}</p>

      {payload.map((item) => (
        <div
          key={item.dataKey}
          className="mt-1 flex items-center justify-between gap-5 text-sm"
        >
          <span style={{ color: item.color }}>{item.name}</span>
          <span className="font-medium text-white">
            {formatCurrency(item.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getToken = () => {
    const keys = ["accessToken", "token", "access_token"];

    for (const key of keys) {
      const token = localStorage.getItem(key);
      if (token) return token;
    }

    return null;
  };

  const fetchAnalytics = useCallback(async () => {
  setLoading(true);
  setError("");

  try {
    const data = await getAnalytics();
    setAnalytics(data);
  } catch (err) {
    setError(
      err.message || "Unable to load analytics."
    );
  } finally {
    setLoading(false);
  }
}, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const monthlyTrends = useMemo(
    () => analytics?.monthlyTrends || [],
    [analytics]
  );

  const expenseBreakdown = useMemo(
    () => analytics?.expenseBreakdown || [],
    [analytics]
  );

  const overview = analytics?.overview || {};
  const currentMonth = analytics?.currentMonth || {};

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#0d1017]">
        <div className="text-center">
          <RefreshCw
            size={30}
            className="mx-auto animate-spin text-indigo-400"
          />
          <p className="mt-4 text-sm text-gray-400">
            Crunching your numbers...
          </p>
        </div>
      </div>
    );
  }

  if (error && !analytics) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#0d1017] px-5">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#151922] p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400">
            <ReceiptText size={26} />
          </div>

          <h2 className="mt-5 text-xl font-semibold text-white">
            Analytics unavailable
          </h2>
          <p className="mt-2 text-sm leading-6 text-gray-400">
            {error}
          </p>

          <button
            onClick={fetchAnalytics}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400"
          >
            <RefreshCw size={16} />
            Try again
          </button>
        </div>
      </div>
    );
  }

  const hasTransactions =
    (overview.income || 0) > 0 ||
    (overview.expenses || 0) > 0 ||
    (overview.goalContributions || 0) > 0;

  return (
    <main className="min-h-screen bg-[#0d1017] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px] space-y-7">
        {/* Page header */}
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2 text-sm text-indigo-400">
              <ChartNoAxesCombined size={17} />
              <span>Financial insights</span>
            </div>

            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Analytics
            </h1>

            <p className="mt-2 text-sm text-gray-400 sm:text-base">
              Understand your money. Make smarter decisions.
            </p>
          </div>

          <button
            onClick={fetchAnalytics}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-white/10 bg-[#151922] px-4 py-3 text-sm font-medium text-gray-200 transition hover:bg-[#202530] sm:self-auto"
          >
            <RefreshCw size={16} />
            Refresh data
          </button>
        </header>

        {error && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            Refresh failed: {error}. Showing the last successfully loaded data.
          </div>
        )}

        {/* Summary */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Six-month overview</h2>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-gray-400">
              Last 6 calendar months
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total income"
              value={overview.income}
              subtitle="Across the selected period"
              icon={TrendingUp}
              color="bg-emerald-500/10 text-emerald-400"
              trend="up"
            />

            <StatCard
              title="Total expenses"
              value={overview.expenses}
              subtitle="Everyday spending"
              icon={TrendingDown}
              color="bg-rose-500/10 text-rose-400"
              trend="down"
            />

            <StatCard
              title="Net cash flow"
              value={overview.netCashFlow}
              subtitle="Income minus regular expenses"
              icon={Wallet}
              color="bg-indigo-500/10 text-indigo-400"
            />

            <StatCard
              title="Goal contributions"
              value={overview.goalContributions}
              subtitle="Tracked separately from expenses"
              icon={PiggyBank}
              color="bg-amber-500/10 text-amber-400"
            />
          </div>
        </section>

        {/* Current month */}
        <section className="rounded-2xl border border-white/[0.07] bg-gradient-to-br from-[#191e2a] to-[#131720] p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm text-gray-400">Current month</p>
              <h2 className="mt-1 text-2xl font-semibold">
                Monthly snapshot
              </h2>
              <p className="mt-2 text-sm text-gray-400">
                Your financial activity so far this month.
              </p>
            </div>

            <div className="w-fit rounded-xl border border-indigo-400/20 bg-indigo-400/10 px-4 py-3">
              <p className="text-xs text-indigo-300">
                Savings rate*
              </p>
              <p className="mt-1 text-2xl font-bold text-indigo-200">
                {(currentMonth.savingsRate || 0).toFixed(1)}%
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              {
                label: "Income",
                value: currentMonth.income,
                color: "text-emerald-400",
              },
              {
                label: "Expenses",
                value: currentMonth.expenses,
                color: "text-rose-400",
              },
              {
                label: "Net cash flow",
                value: currentMonth.netCashFlow,
                color:
                  (currentMonth.netCashFlow || 0) >= 0
                    ? "text-emerald-400"
                    : "text-rose-400",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-white/[0.06] bg-black/10 p-4"
              >
                <p className="text-sm text-gray-400">{item.label}</p>
                <p className={`mt-2 text-xl font-semibold ${item.color}`}>
                  {formatCurrency(item.value)}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-4 text-xs leading-5 text-gray-500">
            *Calculated as (income − regular expenses) ÷ income.
            Goal contributions are tracked separately and are not deducted
            from this cash-flow figure.
          </p>
        </section>

        {/* Monthly chart */}
        <section className="rounded-2xl border border-white/[0.07] bg-[#151922] p-5 sm:p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">
              Income vs. expenses
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              Compare how much you earn and spend each month.
            </p>
          </div>

          {!hasTransactions ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
              <ChartNoAxesCombined
                size={38}
                className="text-gray-600"
              />
              <p className="mt-4 font-medium text-gray-300">
                Your chart will appear here
              </p>
              <p className="mt-2 max-w-sm text-sm text-gray-500">
                Add some income or expense transactions to start seeing
                your financial trends.
              </p>
            </div>
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyTrends}
                  margin={{ top: 8, right: 4, left: 4, bottom: 4 }}
                  barGap={5}
                  barCategoryGap="28%"
                >
                  <CartesianGrid
                    stroke="#ffffff"
                    strokeOpacity={0.06}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickMargin={12}
                  />
                  <YAxis
                    tickFormatter={formatCompactCurrency}
                    tick={{ fill: "#9ca3af", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={58}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend
                    wrapperStyle={{
                      color: "#d1d5db",
                      fontSize: "12px",
                      paddingTop: "15px",
                    }}
                  />
                  <Bar
                    dataKey="income"
                    name="Income"
                    fill="#34d399"
                    radius={[5, 5, 0, 0]}
                    maxBarSize={30}
                  />
                  <Bar
                    dataKey="expenses"
                    name="Expenses"
                    fill="#fb7185"
                    radius={[5, 5, 0, 0]}
                    maxBarSize={30}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        {/* Expense categories and monthly savings */}
        <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <div className="rounded-2xl border border-white/[0.07] bg-[#151922] p-5 sm:p-6">
            <h2 className="text-lg font-semibold">Where your money goes</h2>
            <p className="mt-1 text-sm text-gray-400">
              Expense distribution by category across six months.
            </p>

            {expenseBreakdown.length === 0 ? (
              <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
                <CircleDollarSign
                  size={36}
                  className="text-gray-600"
                />
                <p className="mt-3 text-sm text-gray-400">
                  No expense categories yet.
                </p>
              </div>
            ) : (
              <>
                <div className="mt-4 h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseBreakdown}
                        dataKey="amount"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        innerRadius={62}
                        outerRadius={95}
                        paddingAngle={3}
                        stroke="none"
                      >
                        {expenseBreakdown.map((item, index) => (
                          <Cell
                            key={item.category}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-2 space-y-4">
                  {expenseBreakdown.map((item, index) => (
                    <div key={item.category}>
                      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{
                              backgroundColor:
                                COLORS[index % COLORS.length],
                            }}
                          />
                          <span className="truncate text-gray-300">
                            {item.category}
                          </span>
                        </div>

                        <div className="shrink-0 text-right">
                          <span className="font-medium text-white">
                            {formatCurrency(item.amount)}
                          </span>
                          <span className="ml-2 text-xs text-gray-500">
                            {Number(item.percentage || 0).toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(0, Number(item.percentage) || 0)
                            )}%`,
                            backgroundColor:
                              COLORS[index % COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-[#151922] p-5 sm:p-6">
            <h2 className="text-lg font-semibold">Monthly breakdown</h2>
            <p className="mt-1 text-sm text-gray-400">
              A closer look at each month's cash flow.
            </p>

            <div className="mt-6 space-y-4">
              {monthlyTrends.map((month) => {
                const net = month.income - month.expenses;
                const income = Number(month.income) || 0;
                const expenses = Number(month.expenses) || 0;
                const scale = Math.max(income, expenses, 1);

                return (
                  <div
                    key={month.month}
                    className="rounded-xl border border-white/[0.06] bg-black/10 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-gray-200">
                        {month.label}
                      </p>
                      <p
                        className={`text-sm font-semibold ${
                          net >= 0
                            ? "text-emerald-400"
                            : "text-rose-400"
                        }`}
                      >
                        {net >= 0 ? "+" : ""}
                        {formatCurrency(net)}
                      </p>
                    </div>

                    <div className="mt-3 space-y-3">
                      <div>
                        <div className="mb-1 flex justify-between text-xs text-gray-400">
                          <span>Income</span>
                          <span>{formatCurrency(income)}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/[0.06]">
                          <div
                            className="h-1.5 rounded-full bg-emerald-400"
                            style={{
                              width: `${(income / scale) * 100}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="mb-1 flex justify-between text-xs text-gray-400">
                          <span>Expenses</span>
                          <span>{formatCurrency(expenses)}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/[0.06]">
                          <div
                            className="h-1.5 rounded-full bg-rose-400"
                            style={{
                              width: `${(expenses / scale) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {month.goalContributions > 0 && (
                      <p className="mt-3 text-xs text-amber-300">
                        Goal contributions:{" "}
                        {formatCurrency(month.goalContributions)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Footer note */}
        <footer className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-[#151922]/60 p-4 text-xs leading-5 text-gray-500">
          <ReceiptText size={17} className="mt-0.5 shrink-0" />
          <p>
            Analytics are based on transactions returned by your account.
            Goal contributions are displayed separately and excluded from
            regular expense totals to avoid counting them as ordinary
            spending.
          </p>
        </footer>
      </div>
    </main>
  );
};

export default Analytics;
