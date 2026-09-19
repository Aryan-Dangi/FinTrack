import Card from "../../components/ui/Card";

const Dashboard = () => {
  return (
    <div className="space-y-8">
      {/* Page Heading */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-zinc-400">
          Welcome back! Here's an overview of your finances.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Card title="Total Balance" value="₹0" />
        <Card title="Income" value="₹0" />
        <Card title="Expenses" value="₹0" />
        <Card title="Savings" value="₹0" />
      </div>

      {/* Placeholder Analytics Section */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card title="Monthly Spending Trend">
            <div className="mt-4 flex h-64 items-center justify-center rounded-xl border border-dashed border-zinc-700 text-zinc-500">
              Chart Coming in Sprint 2 📈
            </div>
          </Card>
        </div>

        <Card title="Top Categories">
          <div className="mt-4 flex h-64 items-center justify-center rounded-xl border border-dashed border-zinc-700 text-zinc-500">
            Pie Chart Coming Soon 🥧
          </div>
        </Card>
      </div>

      {/* Recent Transactions Placeholder */}
      <Card title="Recent Transactions">
        <div className="mt-4 flex h-48 items-center justify-center rounded-xl border border-dashed border-zinc-700 text-zinc-500">
          Transactions Table Coming in Sprint 3 💸
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;