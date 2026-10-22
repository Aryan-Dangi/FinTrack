
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Target,
  Wallet,
  TrendingUp,
  CalendarDays,
  Pencil,
  Trash2,
  X,
  RefreshCw,
  CircleAlert,
  CheckCircle2,
  Clock3,
} from "lucide-react";

import {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
} from "../../services/goalService";
import { getAccounts } from "../../services/accountService";

const CATEGORIES = [
  "Emergency Fund",
  "Travel",
  "Education",
  "Vehicle",
  "Home",
  "Gadgets",
  "Investment",
  "Other",
];

const EMPTY_FORM = {
  name: "",
  targetAmount: "",
  currentAmount: "0",
  initialAccountId: "",
  category: "Other",
  targetDate: "",
  note: "",
  status: "active",
};

const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const formatDate = (date) => {
  if (!date) return "No deadline";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getProgress = (saved, target) => {
  if (!target || target <= 0) return 0;
  return Math.min(100, Math.max(0, (saved / target) * 100));
};

function SummaryCard({ title, value, subtitle, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#151821] p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-400">{title}</p>
        <div className="rounded-xl bg-violet-500/10 p-2.5">
          <Icon size={20} className="text-violet-400" />
        </div>
      </div>

      <p className="mt-4 break-words text-2xl font-semibold text-white">
        {value}
      </p>

      <p className="mt-2 text-sm text-gray-500">{subtitle}</p>
    </div>
  );
}

function GoalModal({
  open,
  onClose,
  onSubmit,
  editingGoal,
  saving,
  accounts,
  accountsLoading,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!open) return;

    if (editingGoal) {
      setForm({
        name: editingGoal.name || "",
        targetAmount: String(editingGoal.targetAmount ?? ""),
        currentAmount: String(editingGoal.currentAmount ?? 0),
        initialAccountId: "",
        category: editingGoal.category || "Other",
        targetDate: editingGoal.targetDate
          ? new Date(editingGoal.targetDate).toISOString().slice(0, 10)
          : "",
        note: editingGoal.note || "",
        status: editingGoal.status || "active",
      });
    } else {
      setForm(EMPTY_FORM);
    }

    setFormError("");
  }, [open, editingGoal]);

  if (!open) return null;

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    const target = Number(form.targetAmount);
    const saved = Number(form.currentAmount);

    if (!form.name.trim()) {
      setFormError("Please enter a goal name.");
      return;
    }

    if (!Number.isFinite(target) || target <= 0) {
      setFormError("Target amount must be greater than zero.");
      return;
    }

    if (!editingGoal && (!Number.isFinite(saved) || saved < 0)) {
      setFormError("Current savings cannot be negative.");
      return;
    }

    if (!editingGoal && saved > target) {
      setFormError("Current savings cannot exceed the target amount.");
      return;
    }

    try {
      const goalPayload = {
        name: form.name.trim(),
        targetAmount: target,
        category: form.category,
        targetDate: form.targetDate || null,
        note: form.note.trim(),
        status:
          editingGoal
            ? form.status
            : saved >= target
              ? "completed"
              : form.status === "completed"
                ? "active"
                : form.status,
      };

      // Initial savings are only set at creation. Editing a goal must never
      // re-apply the original amount or overwrite contribution-based progress.
      if (!editingGoal) {
        goalPayload.currentAmount = saved;
        goalPayload.initialAmount = saved;
        goalPayload.initialAccountId = form.initialAccountId || null;
      }

      await onSubmit(goalPayload);
    } catch (error) {
      setFormError(
        error?.response?.data?.message ||
          error?.response?.data?.errors?.join(", ") ||
          "Unable to save the goal. Please try again."
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <div className="my-auto w-full max-w-xl rounded-2xl border border-white/10 bg-[#151821] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 p-5">
          <div>
            <h2 className="text-xl font-semibold text-white">
              {editingGoal ? "Edit savings goal" : "Create savings goal"}
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              Set a target and track your progress.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white disabled:opacity-50"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          <div>
            <label className="mb-2 block text-sm text-gray-300">
              Goal name *
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              maxLength={100}
              required
              placeholder="e.g. Emergency fund"
              className="w-full rounded-xl border border-white/10 bg-[#0f1117] px-4 py-3 text-white outline-none transition focus:border-violet-500"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-gray-300">
                Target amount (₹) *
              </label>
              <input
                name="targetAmount"
                type="number"
                min="0.01"
                step="0.01"
                value={form.targetAmount}
                onChange={handleChange}
                required
                placeholder="50000"
                className="w-full rounded-xl border border-white/10 bg-[#0f1117] px-4 py-3 text-white outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-300">
                {editingGoal ? "Saved so far (₹)" : "Already saved (₹)"}
              </label>
              {editingGoal ? (
                <div className="w-full rounded-xl border border-white/10 bg-[#0f1117] px-4 py-3 text-gray-300">
                  {formatCurrency(editingGoal.currentAmount ?? 0)}
                </div>
              ) : (
                <input
                  name="currentAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.currentAmount}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-white/10 bg-[#0f1117] px-4 py-3 text-white outline-none focus:border-violet-500"
                />
              )}
            </div>
          </div>

          {!editingGoal && (
            <div>
              <label className="mb-2 block text-sm text-gray-300">
                Account for initial savings (optional)
              </label>
              <select
                name="initialAccountId"
                value={form.initialAccountId}
                onChange={handleChange}
                disabled={accountsLoading}
                className="w-full rounded-xl border border-white/10 bg-[#0f1117] px-4 py-3 text-white outline-none focus:border-violet-500 disabled:opacity-60"
              >
                <option value="">No account linked</option>
                {accounts.map((account) => (
                  <option key={account._id || account.id} value={account._id || account.id}>
                    {account.name || account.accountName || "Unnamed account"}
                    {account.type ? ` · ${account.type}` : ""}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs leading-5 text-gray-500">
                Choose an account only if this initial savings amount should be reflected in that account. No account is changed when “No account linked” is selected.
              </p>
              {accountsLoading && (
                <p className="mt-1 text-xs text-gray-500">Loading accounts…</p>
              )}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-gray-300">
                Category
              </label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full rounded-xl border border-white/10 bg-[#0f1117] px-4 py-3 text-white outline-none focus:border-violet-500"
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-300">
                Target date
              </label>
              <input
                name="targetDate"
                type="date"
                value={form.targetDate}
                onChange={handleChange}
                className="w-full rounded-xl border border-white/10 bg-[#0f1117] px-4 py-3 text-white outline-none focus:border-violet-500"
              />
            </div>
          </div>

          {editingGoal && (
            <div>
              <label className="mb-2 block text-sm text-gray-300">
                Status
              </label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full rounded-xl border border-white/10 bg-[#0f1117] px-4 py-3 text-white outline-none focus:border-violet-500"
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm text-gray-300">
              Note (optional)
            </label>
            <textarea
              name="note"
              value={form.note}
              onChange={handleChange}
              maxLength={300}
              rows={3}
              placeholder="What are you saving for?"
              className="w-full resize-y rounded-xl border border-white/10 bg-[#0f1117] px-4 py-3 text-white outline-none focus:border-violet-500"
            />
          </div>

          {formError && (
            <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
              {formError}
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-white/10 px-5 py-3 text-gray-300 transition hover:bg-white/5 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-violet-600 px-5 py-3 font-medium text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : editingGoal
                  ? "Save changes"
                  : "Create goal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function GoalCard({ goal, onEdit, onDelete }) {
  const progress = getProgress(goal.currentAmount, goal.targetAmount);
  const remaining = Math.max(
    0,
    Number(goal.targetAmount) - Number(goal.currentAmount)
  );

  const statusStyles = {
    active: "bg-violet-500/10 text-violet-300",
    completed: "bg-emerald-500/10 text-emerald-300",
    cancelled: "bg-gray-500/10 text-gray-300",
  };

  return (
    <article className="rounded-2xl border border-white/10 bg-[#151821] p-5 transition hover:border-white/20">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="shrink-0 rounded-xl bg-violet-500/10 p-3">
            <Target size={22} className="text-violet-400" />
          </div>

          <div className="min-w-0">
            <h3 className="break-words font-semibold text-white">
              {goal.name}
            </h3>
            <p className="mt-1 text-sm text-gray-400">{goal.category}</p>
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs capitalize ${
            statusStyles[goal.status] || statusStyles.active
          }`}
        >
          {goal.status}
        </span>
      </div>

      <div className="mt-6 flex items-end justify-between gap-3">
        <div>
          <p className="text-sm text-gray-400">Saved so far</p>
          <p className="mt-1 break-words text-xl font-semibold text-white">
            {formatCurrency(goal.currentAmount)}
          </p>
        </div>

        <div className="text-right">
          <p className="text-sm text-gray-400">Target</p>
          <p className="mt-1 break-words font-medium text-gray-200">
            {formatCurrency(goal.targetAmount)}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between gap-3 text-sm">
          <span className="text-gray-400">Progress</span>
          <span className="font-medium text-violet-300">
            {progress.toFixed(1)}%
          </span>
        </div>

        <div
          className="h-2.5 overflow-hidden rounded-full bg-white/10"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${goal.name} progress`}
        >
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              goal.status === "completed"
                ? "bg-emerald-500"
                : "bg-violet-500"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-gray-400">
          {goal.status === "completed"
            ? "Target reached!"
            : goal.status === "cancelled"
              ? "Goal cancelled"
              : `${formatCurrency(remaining)} remaining`}
        </span>

        <span className="flex items-center gap-1.5 text-gray-400">
          <CalendarDays size={14} />
          {formatDate(goal.targetDate)}
        </span>
      </div>

      {goal.note && (
        <p className="mt-4 break-words border-t border-white/10 pt-4 text-sm text-gray-400">
          {goal.note}
        </p>
      )}

      <div className="mt-5 flex gap-2 border-t border-white/10 pt-4">
        <button
          type="button"
          onClick={() => onEdit(goal)}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-sm text-gray-300 transition hover:bg-white/5 hover:text-white"
        >
          <Pencil size={15} />
          Edit
        </button>

        <button
          type="button"
          onClick={() => onDelete(goal)}
          className="flex items-center justify-center gap-2 rounded-xl border border-red-500/20 px-3 py-2.5 text-sm text-red-300 transition hover:bg-red-500/10"
          aria-label={`Delete ${goal.name}`}
        >
          <Trash2 size={15} />
          Delete
        </button>
      </div>
    </article>
  );
}

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [summary, setSummary] = useState({
    totalGoals: 0,
    activeGoals: 0,
    completedGoals: 0,
    totalTarget: 0,
    totalSaved: 0,
    totalRemaining: 0,
  });

  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);

  const loadGoals = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getGoals();

      setGoals(Array.isArray(data.goals) ? data.goals : []);
      setSummary(
        data.summary || {
          totalGoals: 0,
          activeGoals: 0,
          completedGoals: 0,
          totalTarget: 0,
          totalSaved: 0,
          totalRemaining: 0,
        }
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Unable to load your savings goals. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAccounts = useCallback(async () => {
    setAccountsLoading(true);
    try {
      const data = await getAccounts();
      const accountList = Array.isArray(data)
        ? data
        : Array.isArray(data?.accounts)
          ? data.accounts
          : Array.isArray(data?.data?.accounts)
            ? data.data.accounts
            : [];
      setAccounts(accountList.filter((account) => account && (account._id || account.id)));
    } catch {
      // Goal creation remains available without linking an account.
      setAccounts([]);
    } finally {
      setAccountsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGoals();
    loadAccounts();
  }, [loadGoals, loadAccounts]);

  const filteredGoals = useMemo(() => {
    if (filter === "all") return goals;
    return goals.filter((goal) => goal.status === filter);
  }, [goals, filter]);

  const openCreateModal = () => {
    setEditingGoal(null);
    setSuccess("");
    setModalOpen(true);
  };

  const openEditModal = (goal) => {
    setEditingGoal(goal);
    setSuccess("");
    setModalOpen(true);
  };

  const handleSaveGoal = async (goalData) => {
    setSaving(true);
    setError("");

    try {
      if (editingGoal) {
        await updateGoal(editingGoal._id, goalData);
        setSuccess("Savings goal updated successfully.");
      } else {
        await createGoal(goalData);
        setSuccess("Savings goal created successfully.");
      }

      setModalOpen(false);
      setEditingGoal(null);
      await loadGoals();
    } catch (err) {
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGoal = async (goal) => {
    const confirmed = window.confirm(
      `Delete "${goal.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await deleteGoal(goal._id);
      setSuccess(`"${goal.name}" was deleted.`);
      await loadGoals();
    } catch (err) {
      setError(
        err?.response?.data?.message || "Unable to delete this goal."
      );
    }
  };

  return (
    <div className="min-h-full space-y-6 bg-[#0f1117] p-4 text-white sm:p-6 lg:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Savings Goals
          </h1>
          <p className="mt-2 text-sm text-gray-400 sm:text-base">
            Turn your financial plans into achievable milestones.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadGoals}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm text-gray-300 transition hover:bg-white/5 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-medium transition hover:bg-violet-500"
          >
            <Plus size={18} />
            New goal
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          <CircleAlert size={18} className="mt-0.5 shrink-0" />
          <div className="flex-1">{error}</div>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
          <CheckCircle2 size={18} className="shrink-0" />
          <div className="flex-1">{success}</div>
          <button
            type="button"
            onClick={() => setSuccess("")}
            aria-label="Dismiss message"
          >
            <X size={17} />
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total goals"
          value={summary.totalGoals}
          subtitle="All your savings goals"
          icon={Target}
        />
        <SummaryCard
          title="Total target"
          value={formatCurrency(summary.totalTarget)}
          subtitle="Combined goal targets"
          icon={Wallet}
        />
        <SummaryCard
          title="Total saved"
          value={formatCurrency(summary.totalSaved)}
          subtitle="Across all goals"
          icon={TrendingUp}
        />
        <SummaryCard
          title="Active goals"
          value={summary.activeGoals}
          subtitle={`${summary.completedGoals} completed`}
          icon={Clock3}
        />
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#151821] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <h2 className="font-semibold text-white">Your goals</h2>
          <p className="mt-1 text-sm text-gray-400">
            Track each target and how far you have to go.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { label: "All", value: "all" },
            { label: "Active", value: "active" },
            { label: "Completed", value: "completed" },
            { label: "Cancelled", value: "cancelled" },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              className={`rounded-xl px-3 py-2 text-sm transition ${
                filter === item.value
                  ? "bg-violet-600 text-white"
                  : "border border-white/10 text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-64 animate-pulse rounded-2xl border border-white/10 bg-[#151821]"
            />
          ))}
        </div>
      ) : filteredGoals.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-[#151821] px-5 py-14 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10">
            <Target size={28} className="text-violet-400" />
          </div>

          <h3 className="mt-5 text-lg font-semibold text-white">
            {goals.length === 0
              ? "Start your first savings goal"
              : `No ${filter} goals`}
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-400">
            {goals.length === 0
              ? "Set a target for your emergency fund, next trip, education, or anything else you want to save for."
              : "Try a different filter to find your other savings goals."}
          </p>

          {goals.length === 0 && (
            <button
              type="button"
              onClick={openCreateModal}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-medium transition hover:bg-violet-500"
            >
              <Plus size={17} />
              Create your first goal
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredGoals.map((goal) => (
            <GoalCard
              key={goal._id}
              goal={goal}
              onEdit={openEditModal}
              onDelete={handleDeleteGoal}
            />
          ))}
        </div>
      )}

      <GoalModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingGoal(null);
        }}
        onSubmit={handleSaveGoal}
        editingGoal={editingGoal}
        saving={saving}
        accounts={accounts}
        accountsLoading={accountsLoading}
      />
    </div>
  );
}
