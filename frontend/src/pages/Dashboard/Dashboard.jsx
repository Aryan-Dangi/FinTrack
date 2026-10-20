
import { useEffect, useState } from "react";
import Card from "../../components/ui/Card";
import { getDashboardSummary } from "../../services/dashboardService";

const formatINR = (amount = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const Dashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const summary = dashboard?.summary;
  const recentTransactions = dashboard?.recentTransactions ?? [];

  return (
    <div className="space-y-8">
      {/* Page Heading */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-zinc-400">
          Welcome back! Here's an overview of your finances.
        </p>
      </div>

      {/* Loading and Error States */}
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

      {/* Analytics Placeholders */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card title="Monthly Spending Trend">
            <div className="mt-4 flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-700 px-4 text-center">
              <span className="text-2xl">📈</span>
              <p className="mt-2 text-zinc-300">
                Monthly spending chart
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                Chart integration is planned for the analytics sprint.
              </p>
            </div>
          </Card>
        </div>

        <Card title="Top Categories">
          <div className="mt-4 flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-700 px-4 text-center">
            <span className="text-2xl">🥧</span>
            <p className="mt-2 text-zinc-300">Spending by category</p>
            <p className="mt-1 text-sm text-zinc-500">
              Category breakdown is coming in the analytics sprint.
            </p>
          </div>
        </Card>
      </div>

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
