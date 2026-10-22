
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Wallet,
  TrendingUp,
  CircleAlert,
  Pencil,
  Trash2,
  X,
  CalendarDays,
  RefreshCw,
} from "lucide-react";

import {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
} from "../../services/budgetService";

const CATEGORY_OPTIONS = [
  "Food",
  "Shopping",
  "Transport",
  "Entertainment",
  "Bills",
  "Health",
  "Education",
  "Travel",
  "Housing",
  "Personal Care",
  "Other",
];

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const formatMonth = (month) => {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(year, monthNumber - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
};

const inputClass =
  "w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-indigo-500";

const initialForm = (month) => ({
  category: "Food",
  amount: "",
  month,
  note: "",
});

const Budgets = () => {
  const [month, setMonth] = useState(getCurrentMonth());
  const [budgets, setBudgets] = useState([]);
  const [summary, setSummary] = useState({
    totalBudget: 0,
    totalSpent: 0,
    totalRemaining: 0,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [form, setForm] = useState(initialForm(month));

  const loadBudgets = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getBudgets(month);

      setBudgets(result.budgets || []);
      setSummary(
        result.summary || {
          totalBudget: 0,
          totalSpent: 0,
          totalRemaining: 0,
        }
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load budgets. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  const budgetCount = budgets.length;

  const overBudgetCount = useMemo(
    () => budgets.filter((budget) => budget.isOverBudget).length,
    [budgets]
  );

  const unbudgetedCategories = useMemo(
    () =>
      CATEGORY_OPTIONS.filter(
        (category) =>
          !budgets.some(
            (budget) =>
              budget.category.trim().toLowerCase() ===
              category.toLowerCase()
          )
      ),
    [budgets]
  );

  const openCreateModal = () => {
    setEditingBudget(null);
    setForm({
      ...initialForm(month),
      category: unbudgetedCategories[0] || "Food",
    });
    setError("");
    setSuccess("");
    setModalOpen(true);
  };

  const openEditModal = (budget) => {
    setEditingBudget(budget);
    setForm({
      category: budget.category,
      amount: String(budget.amount),
      month,
      note: budget.note || "",
    });
    setError("");
    setSuccess("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingBudget(null);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const amount = Number(form.amount);

    if (!form.category.trim()) {
      setError("Please select a category.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a budget amount greater than zero.");
      return;
    }

    const duplicate = budgets.some(
      (budget) =>
        budget._id !== editingBudget?._id &&
        budget.category.trim().toLowerCase() ===
          form.category.trim().toLowerCase()
    );

    if (duplicate) {
      setError("A budget already exists for this category and month.");
      return;
    }

    const payload = {
      category: form.category.trim(),
      amount,
      month,
      note: form.note.trim(),
    };

    setSaving(true);

    try {
      if (editingBudget) {
        await updateBudget(editingBudget._id, payload);
        setSuccess("Budget updated successfully.");
      } else {
        await createBudget(payload);
        setSuccess("Budget created successfully.");
      }

      setModalOpen(false);
      setEditingBudget(null);
      await loadBudgets();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to save this budget. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (budget) => {
    const confirmed = window.confirm(
      `Delete the ${budget.category} budget for ${formatMonth(month)}?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await deleteBudget(budget._id);
      setSuccess(`${budget.category} budget deleted.`);
      await loadBudgets();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to delete this budget. Please try again."
      );
    }
  };

  const handleMonthChange = (event) => {
    setMonth(event.target.value);
    setSuccess("");
    setError("");
  };

  return (
    <div className="min-h-full space-y-8 pb-10 text-white">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-medium text-indigo-400">
            PERSONAL FINANCE
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Budgets
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
            Set spending limits, track your expenses, and stay in control
            of your money.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3">
            <CalendarDays size={17} className="text-zinc-400" />
            <input
              aria-label="Budget month"
              type="month"
              value={month}
              onChange={handleMonthChange}
              className="bg-transparent py-3 text-sm text-white outline-none [color-scheme:dark]"
            />
          </label>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold transition hover:bg-indigo-500"
          >
            <Plus size={18} />
            Create budget
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && !modalOpen && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {success && !modalOpen && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300"
        >
          <span>{success}</span>
          <button
            type="button"
            onClick={() => setSuccess("")}
            aria-label="Dismiss success message"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total budget"
          value={formatCurrency(summary.totalBudget)}
          description={`${budgetCount} ${
            budgetCount === 1 ? "category" : "categories"
          } budgeted`}
          icon={Wallet}
          iconColor="text-indigo-400"
          iconBackground="bg-indigo-500/10"
        />

        <SummaryCard
          title="Total spent"
          value={formatCurrency(summary.totalSpent)}
          description="Expense transactions this month"
          icon={TrendingUp}
          iconColor="text-amber-400"
          iconBackground="bg-amber-500/10"
        />

        <SummaryCard
          title="Remaining budget"
          value={formatCurrency(summary.totalRemaining)}
          description="Combined budget minus spending"
          icon={Wallet}
          iconColor="text-emerald-400"
          iconBackground="bg-emerald-500/10"
        />

        <SummaryCard
          title="Over budget"
          value={String(overBudgetCount)}
          description="Categories exceeding their limits"
          icon={CircleAlert}
          iconColor="text-red-400"
          iconBackground="bg-red-500/10"
        />
      </div>

      {/* Budget list */}
      <section>
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">
              Category breakdown
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              {formatMonth(month)}
            </p>
          </div>

          <button
            type="button"
            onClick={loadBudgets}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-900 disabled:opacity-50"
          >
            <RefreshCw
              size={15}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-10 text-center text-sm text-zinc-400">
            Loading your budgets...
          </div>
        ) : budgets.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-950 px-6 py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10">
              <Wallet size={25} className="text-indigo-400" />
            </div>
            <h3 className="mt-5 text-lg font-semibold">
              No budgets for {formatMonth(month)}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-400">
              Create your first category budget to compare your spending
              against your monthly limits.
            </p>
            <button
              type="button"
              onClick={openCreateModal}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold hover:bg-indigo-500"
            >
              <Plus size={17} />
              Create your first budget
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {budgets.map((budget) => (
              <BudgetCard
                key={budget._id}
                budget={budget}
                onEdit={openEditModal}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </section>

      {/* Create/edit modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="budget-modal-title"
            className="my-auto w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2
                  id="budget-modal-title"
                  className="text-xl font-semibold"
                >
                  {editingBudget ? "Edit budget" : "Create budget"}
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  {formatMonth(month)}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close modal"
                className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div
                role="alert"
                className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="budget-category"
                  className="mb-2 block text-sm font-medium text-zinc-300"
                >
                  Category
                </label>

                <select
                  id="budget-category"
                  name="category"
                  value={form.category}
                  onChange={handleFormChange}
                  className={inputClass}
                  required
                >
                  {!CATEGORY_OPTIONS.some(
                    (category) =>
                      category.toLowerCase() ===
                      form.category.toLowerCase()
                  ) && (
                    <option value={form.category}>
                      {form.category}
                    </option>
                  )}

                  {CATEGORY_OPTIONS.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>

                {!editingBudget &&
                  unbudgetedCategories.length === 0 && (
                    <p className="mt-2 text-xs text-amber-300">
                      All suggested categories already have budgets.
                      You can still choose a category to try, but the
                      API will reject duplicate budgets.
                    </p>
                  )}
              </div>

              <div>
                <label
                  htmlFor="budget-amount"
                  className="mb-2 block text-sm font-medium text-zinc-300"
                >
                  Monthly limit (₹)
                </label>

                <input
                  id="budget-amount"
                  name="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.amount}
                  onChange={handleFormChange}
                  placeholder="e.g. 5000"
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="budget-note"
                  className="mb-2 block text-sm font-medium text-zinc-300"
                >
                  Note <span className="text-zinc-500">(optional)</span>
                </label>

                <textarea
                  id="budget-note"
                  name="note"
                  value={form.note}
                  onChange={handleFormChange}
                  maxLength={300}
                  rows={3}
                  placeholder="What is this budget for?"
                  className={inputClass}
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-zinc-800 pt-5">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-zinc-700 px-4 py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-900 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingBudget
                      ? "Save changes"
                      : "Create budget"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const SummaryCard = ({
  title,
  value,
  description,
  icon: Icon,
  iconColor,
  iconBackground,
}) => (
  <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm text-zinc-400">{title}</p>
        <p className="mt-3 break-words text-2xl font-bold tracking-tight">
          {value}
        </p>
      </div>

      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBackground} ${iconColor}`}
      >
        <Icon size={21} />
      </div>
    </div>

    <p className="mt-4 text-xs leading-5 text-zinc-500">
      {description}
    </p>
  </div>
);

const BudgetCard = ({ budget, onEdit, onDelete }) => {
  const spent = Number(budget.spent) || 0;
  const limit = Number(budget.amount) || 0;
  const remaining = limit - spent;
  const actualPercentage = limit > 0 ? (spent / limit) * 100 : 0;
  const barPercentage = Math.min(actualPercentage, 100);
  const isOverBudget = spent > limit;

  const barColor = isOverBudget
    ? "bg-red-500"
    : actualPercentage >= 80
      ? "bg-amber-400"
      : "bg-emerald-500";

  return (
    <article className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 transition hover:border-zinc-700 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold">
            {budget.category}
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            {budget.note || "Monthly category budget"}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(budget)}
            aria-label={`Edit ${budget.category} budget`}
            className="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
          >
            <Pencil size={16} />
          </button>

          <button
            type="button"
            onClick={() => onDelete(budget)}
            aria-label={`Delete ${budget.category} budget`}
            className="rounded-lg p-2 text-zinc-400 transition hover:bg-red-500/10 hover:text-red-300"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="mt-6 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs text-zinc-500">Spent</p>
          <p className="mt-1 text-xl font-bold">
            {formatCurrency(spent)}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-zinc-500">Budget limit</p>
          <p className="mt-1 text-sm font-semibold text-zinc-300">
            {formatCurrency(limit)}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between gap-3 text-xs">
          <span
            className={
              isOverBudget
                ? "font-medium text-red-400"
                : actualPercentage >= 80
                  ? "font-medium text-amber-300"
                  : "text-zinc-400"
            }
          >
            {isOverBudget
              ? "Over budget"
              : actualPercentage >= 80
                ? "Approaching limit"
                : "Budget used"}
          </span>

          <span className="font-semibold text-zinc-300">
            {Math.round(actualPercentage)}%
          </span>
        </div>

        <div
          className="h-2 overflow-hidden rounded-full bg-zinc-800"
          role="progressbar"
          aria-label={`${budget.category} budget usage`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.min(Math.round(actualPercentage), 100)}
        >
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${barPercentage}%` }}
          />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-zinc-800 pt-4">
        <span className="text-xs text-zinc-500">
          {isOverBudget ? "Amount over limit" : "Remaining"}
        </span>

        <span
          className={`text-sm font-semibold ${
            isOverBudget ? "text-red-400" : "text-emerald-400"
          }`}
        >
          {formatCurrency(Math.abs(remaining))}
        </span>
      </div>
    </article>
  );
};

export default Budgets;
