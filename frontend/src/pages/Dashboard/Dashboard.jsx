
import { useEffect, useState } from "react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import Card from "../../components/ui/Card";
import { getDashboardSummary } from "../../services/dashboardService";
import { getAnalytics } from "../../services/analyticsService";

const CHART_COLORS = [
  "#10b981",
  "#60a5fa",
  "#f59e0b",
  "#f87171",
  "#a78bfa",
  "#22d3ee",
  "#f472b6",
  "#a3e635",
];

const formatINR = (amount = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const formatCompactINR = (amount = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(amount) || 0);

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const getChartLabel = (value) => {
  if (!value) return "Unknown";

  const date = new Date(value);

  if (!Number.isNaN(date.getTime()) && String(value).length > 7) {
    return date.toLocaleDateString("en-IN", {
      month: "short",
      year: "2-digit",
    });
  }

  return String(value);
};

const normalizeMonthlyTrends = (trends = []) =>
  trends.map((item) => ({
    month: getChartLabel(
      item.month ?? item.label ?? item.date ?? item._id
    ),
    income: Number(item.income ?? item.totalIncome ?? 0),
    expenses: Number(
      item.expenses ??
        item.expense ??
        item.totalExpenses ??
        item.totalExpense ??
        0
    ),
  }));

const normalizeExpenseBreakdown = (categories = []) =>
  categories
    .map((item) => ({
      category: item.category ?? item.name ?? "Other",
      amount: Number(
        item.amount ??
          item.total ??
          item.totalAmount ??
          item.expenses ??
          0
      ),
    }))
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 shadow-xl">
      <p className="mb-2 text-sm font-medium text-zinc-200">{label}</p>

      {payload.map((item) => (
        <p
          key={item.dataKey}
          className="mt-1 text-sm"
          style={{ color: item.color }}
        >
          {item.name}: {formatINR(item.value)}
        </p>
      ))}
    </div>
  );
};

const Dashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [error, setError] = useState("");
  const [analyticsError, setAnalyticsError] = useState("");
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchDashboard = async () => {
      try {
        setIsLoading(true);
        setError("");

        const data = await getDashboardSummary();

        if (!cancelled) {
          setDashboard(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              "Unable to load dashboard data. Please try again."
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    const fetchAnalytics = async () => {
      try {
        setAnalyticsLoading(true);
        setAnalyticsError("");

        const data = await getAnalytics();

        if (!cancelled) setAnalytics(data);
      } catch (err) {
        if (!cancelled) {
          setAnalyticsError(
            err.response?.data?.message ||
              "Unable to load chart data."
          );
        }
      } finally {
        if (!cancelled) setAnalyticsLoading(false);
      }
    };

    fetchDashboard();
    fetchAnalytics();

    return () => {
      cancelled = true;
    };
  }, []);

  const summary = dashboard?.summary;
  const recentTransactions = dashboard?.recentTransactions ?? [];

  const monthlyTrends = normalizeMonthlyTrends(
    analytics?.monthlyTrends ?? analytics?.data?.monthlyTrends ?? []
  );

  const expenseBreakdown = normalizeExpenseBreakdown(
    analytics?.expenseBreakdown ??
      analytics?.data?.expenseBreakdown ??
      []
  );

  const totalCategoryExpenses = expenseBreakdown.reduce(
    (total, item) => total + item.amount,
    0
  );

  return (
    <div className="space-y-8">
      {/* Page Heading */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-zinc-400">
          Welcome back! Here's an overview of your finances.
        </p>
      </div>

      {/* Dashboard Loading and Error States */}
      {isLoading && (
        <div
          role="status"
          className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-sm text-zinc-400"
        >
          Loading your financial overview...
        </div>
      )}

      {!isLoading && error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-red-900/60 bg-red-950/30 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-sm text-red-300">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg border border-red-800 px-3 py-2 text-sm text-red-200 transition hover:bg-red-900/40"
          >
            Reload dashboard
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Card
          title="Net Cash Flow"
          value={isLoading ? "—" : formatINR(summary?.netCashFlow)}
        />
        <Card
          title="Total Income"
          value={isLoading ? "—" : formatINR(summary?.totalIncome)}
        />
        <Card
          title="Total Expenses"
          value={isLoading ? "—" : formatINR(summary?.totalExpenses)}
        />
        <Card
          title="This Month's Savings"
          value={
            isLoading ? "—" : formatINR(summary?.monthlyNetCashFlow)
          }
        />
      </div>

      {/* Monthly Overview */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Card
          title="Monthly Income"
          value={isLoading ? "—" : formatINR(summary?.monthlyIncome)}
        />
        <Card
          title="Monthly Expenses"
          value={isLoading ? "—" : formatINR(summary?.monthlyExpenses)}
        />
        <Card
          title="Transactions This Month"
          value={
            isLoading
              ? "—"
              : String(summary?.monthlyTransactionCount ?? 0)
          }
        />
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Monthly Spending Trend */}
        <div className="lg:col-span-2">
          <Card title="Monthly Spending Trend">
            <div className="mt-4 h-72 min-w-0">
              {analyticsLoading ? (
                <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                  Loading spending trends...
                </div>
              ) : analyticsError ? (
                <div
                  role="status"
                  className="flex h-full items-center justify-center text-center text-sm text-zinc-500"
                >
                  {analyticsError}
                </div>
              ) : monthlyTrends.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <span className="text-3xl">📈</span>
                  <p className="mt-3 text-zinc-300">
                    No spending trends yet
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">
                    Add income or expense transactions to see your monthly
                    comparison.
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={monthlyTrends}
                    margin={{ top: 10, right: 12, left: 8, bottom: 4 }}
                  >
                    <CartesianGrid
                      stroke="#3f3f46"
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: "#a1a1aa", fontSize: 12 }}
                      axisLine={{ stroke: "#52525b" }}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={formatCompactINR}
                      tick={{ fill: "#a1a1aa", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={76}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      wrapperStyle={{
                        color: "#d4d4d8",
                        fontSize: "12px",
                        paddingTop: "12px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="income"
                      name="Income"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: "#10b981" }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="expenses"
                      name="Expenses"
                      stroke="#f87171"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: "#f87171" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>

        
{/* Top Spending Categories */}
  <Card title="Top Categories">
    <div className="mt-4">
      {analyticsLoading ? (
        <div className="flex h-72 items-center justify-center text-sm text-zinc-500">
          Loading categories...
        </div>
      ) : analyticsError ? (
        <div className="flex h-72 items-center justify-center text-center text-sm text-zinc-500">
          Category data is unavailable.
        </div>
      ) : expenseBreakdown.length === 0 ? (
        <div className="flex h-72 flex-col items-center justify-center text-center">
          <span className="text-3xl">🥧</span>
          <p className="mt-3 text-zinc-300">
            No expenses to categorize
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            Your spending breakdown will appear here.
          </p>
        </div>
      ) : (
        <>
          <div className="flex h-72 flex-col">
            {/* Compact donut chart */}
            <div className="relative h-44 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseBreakdown}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={43}
                    outerRadius={66}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {expenseBreakdown.map((item, index) => (
                      <Cell
                        key={item.category + index}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
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
                      color: "#f4f4f5",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs text-zinc-500">
                  Total expenses
                </span>
                <span className="mt-1 max-w-[130px] truncate text-center text-lg font-bold text-white">
                  {formatCompactINR(totalCategoryExpenses)}
                </span>
              </div>
            </div>

            {/* Show only the top two categories */}
            <div className="mt-2 flex-1 space-y-3 overflow-hidden">
              {expenseBreakdown.slice(0, 2).map((item, index) => {
                const percentage =
                  totalCategoryExpenses > 0
                    ? (item.amount / totalCategoryExpenses) * 100
                    : 0;

                return (
                  <div key={item.category + index}>
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{
                            backgroundColor:
                              CHART_COLORS[index % CHART_COLORS.length],
                          }}
                        />
                        <span className="truncate text-zinc-300">
                          {item.category}
                        </span>
                      </div>

                      <span className="shrink-0 font-semibold text-zinc-200">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>

                    <p className="mt-1 truncate text-xs text-zinc-500">
                      {formatINR(item.amount)}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Full breakdown button */}
            <button
              type="button"
              onClick={() => setShowBreakdownModal(true)}
              className="mt-3 w-full shrink-0 rounded-lg border border-zinc-700 px-3 py-2.5 text-sm font-medium text-emerald-400 transition hover:border-emerald-500/50 hover:bg-emerald-500/10"
            >
              View full breakdown
              <span className="ml-1" aria-hidden="true">→</span>
            </button>
          </div>
        </>
      )}
    </div>
  </Card>

      </div>

  
      
  {/* Full Category Breakdown Modal */}
  {showBreakdownModal && (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={() => setShowBreakdownModal(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-breakdown-title"
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl sm:p-7"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="category-breakdown-title"
              className="text-xl font-bold text-white"
            >
              Spending Breakdown
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              See how your expenses are distributed across categories.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowBreakdownModal(false)}
            aria-label="Close breakdown"
            className="rounded-lg p-2 text-xl text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
          >
            ×
          </button>
        </div>

        <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <p className="text-sm text-zinc-400">Total categorized expenses</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {formatINR(totalCategoryExpenses)}
          </p>
        </div>

        <div className="mt-5 space-y-4">
          {expenseBreakdown.map((item, index) => {
            const percentage =
              totalCategoryExpenses > 0
                ? (item.amount / totalCategoryExpenses) * 100
                : 0;

            return (
              <div key={item.category + index}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{
                        backgroundColor:
                          CHART_COLORS[index % CHART_COLORS.length],
                      }}
                    />
                    <span className="truncate text-sm font-medium text-zinc-200">
                      {item.category}
                    </span>
                  </div>

                  <span className="shrink-0 text-sm font-semibold text-white">
                    {formatINR(item.amount)}
                  </span>
                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor:
                        CHART_COLORS[index % CHART_COLORS.length],
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
          type="button"
          onClick={() => setShowBreakdownModal(false)}
          className="mt-6 w-full rounded-lg bg-emerald-500 px-4 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-400"
        >
          Done
        </button>
      </div>
    </div>
  )}


      {/* Recent Transactions */}
      <Card title="Recent Transactions">
        {isLoading ? (
          <div className="mt-4 flex h-40 items-center justify-center text-sm text-zinc-500">
            Loading recent transactions...
          </div>
        ) : error ? (
          <div className="mt-4 flex h-40 items-center justify-center text-sm text-zinc-500">
            Recent transactions are unavailable.
          </div>
        ) : recentTransactions.length === 0 ? (
          <div className="mt-4 flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-700 px-4 text-center">
            <span className="text-2xl">💸</span>
            <p className="mt-2 text-zinc-300">No transactions yet</p>
            <p className="mt-1 text-sm text-zinc-500">
              Add your first transaction to see it here.
            </p>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-500">
                  <th className="px-4 py-3 font-medium">Transaction</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 text-right font-medium">
                    Amount
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-800/70">
                {recentTransactions.map((transaction) => (
                  <tr
                    key={transaction._id}
                    className="transition hover:bg-zinc-800/30"
                  >
                    <td className="px-4 py-4">
                      <div className="font-medium text-zinc-200">
                        {transaction.title}
                      </div>
                      <div className="mt-1 text-xs capitalize text-zinc-500">
                        {transaction.paymentMethod?.replaceAll("_", " ") ||
                          "Other"}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-zinc-400">
                      {transaction.category}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-zinc-400">
                      {formatDate(transaction.date)}
                    </td>

                    <td
                      className={`whitespace-nowrap px-4 py-4 text-right font-semibold ${
                        transaction.type === "income"
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      {transaction.type === "income" ? "+" : "−"}
                      {formatINR(transaction.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Dashboard;
