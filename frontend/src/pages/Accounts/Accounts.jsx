
import { useCallback, useEffect, useState } from "react";
import {
  getAccountBalances,
  createAccount,
  updateAccount,
  archiveAccount,
} from "../../services/accountService";

const ACCOUNT_TYPES = [
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank Account" },
  { value: "upi", label: "UPI" },
  { value: "credit_card", label: "Credit Card" },
  { value: "investment", label: "Investment" },
  { value: "other", label: "Other" },
];

const COLORS = [
  { value: "blue", label: "Blue", className: "bg-blue-500" },
  { value: "emerald", label: "Emerald", className: "bg-emerald-500" },
  { value: "violet", label: "Violet", className: "bg-violet-500" },
  { value: "amber", label: "Amber", className: "bg-amber-500" },
  { value: "rose", label: "Rose", className: "bg-rose-500" },
  { value: "zinc", label: "Zinc", className: "bg-zinc-500" },
];

const EMPTY_FORM = {
  name: "",
  type: "bank",
  openingBalance: "0",
  currency: "INR",
  institution: "",
  color: "blue",
};

const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

const getAccountIcon = (type) => {
  const icons = {
    cash: "💵",
    bank: "🏦",
    upi: "📱",
    credit_card: "💳",
    investment: "📈",
    other: "👛",
  };

  return icons[type] || "👛";
};

const getColorClasses = (color) => {
  const classes = {
    blue: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    violet: "bg-violet-500/10 border-violet-500/20 text-violet-400",
    amber: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    rose: "bg-rose-500/10 border-rose-500/20 text-rose-400",
    zinc: "bg-zinc-500/10 border-zinc-500/20 text-zinc-400",
  };

  return classes[color] || classes.zinc;
};

const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [summary, setSummary] = useState({
    openingBalance: 0,
    income: 0,
    expenses: 0,
    currentBalance: 0,
    accountCount: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [formError, setFormError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const loadAccounts = useCallback(async () => {
    setIsLoading(true);
    setPageError("");

    try {
      const data = await getAccountBalances();

      setAccounts(Array.isArray(data.accounts) ? data.accounts : []);
      setSummary({
        openingBalance: Number(data.summary?.openingBalance) || 0,
        income: Number(data.summary?.income) || 0,
        expenses: Number(data.summary?.expenses) || 0,
        currentBalance: Number(data.summary?.currentBalance) || 0,
        accountCount: Number(data.summary?.accountCount) || 0,
      });
    } catch (error) {
      setPageError(
        error.response?.data?.message ||
          "Couldn't load your accounts. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const openCreateModal = () => {
    setEditingAccount(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (account) => {
    setEditingAccount(account);
    setForm({
      name: account.name || "",
      type: account.type || "bank",
      openingBalance: String(account.openingBalance ?? 0),
      currency: "INR",
      institution: account.institution || "",
      color: account.color || "zinc",
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setEditingAccount(null);
    setForm(EMPTY_FORM);
    setFormError("");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    const name = form.name.trim();
    const openingBalance = Number(form.openingBalance);

    if (name.length < 2) {
      setFormError("Account name must contain at least 2 characters.");
      return;
    }

    if (
      form.openingBalance === "" ||
      !Number.isFinite(openingBalance) ||
      openingBalance < 0
    ) {
      setFormError("Enter a valid opening balance of 0 or more.");
      return;
    }

    const payload = {
      name,
      type: form.type,
      openingBalance,
      currency: "INR",
      institution: form.institution.trim(),
      color: form.color,
    };

    setIsSaving(true);

    try {
      if (editingAccount) {
        await updateAccount(editingAccount._id, payload);
      } else {
        await createAccount(payload);
      }

      setIsModalOpen(false);
      setEditingAccount(null);
      setForm(EMPTY_FORM);
      await loadAccounts();
    } catch (error) {
      setFormError(
        error.response?.data?.message ||
          `Couldn't ${editingAccount ? "update" : "create"} the account.`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchive = async (account) => {
    const confirmed = window.confirm(
      `Archive "${account.name}"? It will no longer appear in your active accounts.`
    );

    if (!confirmed) return;

    setPageError("");

    try {
      await archiveAccount(account._id);
      await loadAccounts();
    } catch (error) {
      setPageError(
        error.response?.data?.message ||
          "Couldn't archive this account. Please try again."
      );
    }
  };

  return (
    <div className="min-h-full space-y-8 bg-zinc-950 p-4 text-white sm:p-6 lg:p-8">
      {/* Page heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-400">
            FINANCIAL OVERVIEW
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Accounts</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Manage your accounts and keep track of your money in one place.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400"
        >
          <span className="text-lg">+</span>
          Add Account
        </button>
      </div>

      {pageError && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300 sm:flex-row sm:items-center sm:justify-between"
        >
          <span>{pageError}</span>
          <button
            type="button"
            onClick={loadAccounts}
            className="self-start font-semibold underline sm:self-auto"
          >
            Retry
          </button>
        </div>
      )}

      {/* Summary cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total Account Balance"
          value={formatCurrency(summary.currentBalance)}
          detail="Across active accounts"
          icon="◈"
          accent="emerald"
        />
        <SummaryCard
          label="Active Accounts"
          value={String(summary.accountCount)}
          detail="Accounts you're tracking"
          icon="▤"
          accent="blue"
        />
        <SummaryCard
          label="Income Recorded"
          value={formatCurrency(summary.income)}
          detail="Linked transactions"
          icon="↗"
          accent="emerald"
        />
        <SummaryCard
          label="Expenses Recorded"
          value={formatCurrency(summary.expenses)}
          detail="Linked transactions"
          icon="↘"
          accent="rose"
        />
      </section>

      {/* Accounts list */}
      <section>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Your accounts</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Your balances are calculated from each account's opening balance
              and its linked transactions.
            </p>
          </div>

          <button
            type="button"
            onClick={loadAccounts}
            disabled={isLoading}
            className="rounded-lg border border-zinc-800 px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-900 disabled:opacity-50"
          >
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-56 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/60"
              />
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 px-6 py-14 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800 text-3xl">
              🏦
            </div>
            <h3 className="mt-5 text-lg font-semibold">No accounts yet</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-400">
              Add your bank account, cash wallet, UPI account, or investment
              account to start tracking balances in FinTrack.
            </p>
            <button
              type="button"
              onClick={openCreateModal}
              className="mt-6 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400"
            >
              + Create your first account
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {accounts.map((account) => (
              <article
                key={account._id}
                className="group overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70 transition hover:border-zinc-700 hover:bg-zinc-900"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border text-xl ${getColorClasses(account.color)}`}
                      >
                        {getAccountIcon(account.type)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold">
                          {account.name}
                        </h3>
                        <p className="mt-1 text-xs capitalize text-zinc-500">
                          {ACCOUNT_TYPES.find(
                            (type) => type.value === account.type
                          )?.label || account.type}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-1 text-xs ${getColorClasses(account.color)}`}
                    >
                      {account.currency || "INR"}
                    </span>
                  </div>

                  <div className="mt-7">
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Current balance
                    </p>
                    <p className="mt-2 break-words text-2xl font-bold tracking-tight">
                      {formatCurrency(account.currentBalance)}
                    </p>
                  </div>

                  {account.institution && (
                    <p className="mt-2 truncate text-sm text-zinc-400">
                      {account.institution}
                    </p>
                  )}

                  <div className="mt-5 grid grid-cols-2 gap-3 border-t border-zinc-800 pt-4">
                    <div>
                      <p className="text-xs text-zinc-500">Income</p>
                      <p className="mt-1 text-sm font-semibold text-emerald-400">
                        {formatCurrency(account.income)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Expenses</p>
                      <p className="mt-1 text-sm font-semibold text-rose-400">
                        {formatCurrency(account.expenses)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex gap-3">
                    <button
                      type="button"
                      onClick={() => openEditModal(account)}
                      className="flex-1 rounded-lg border border-zinc-700 px-3 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-800"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleArchive(account)}
                      className="flex-1 rounded-lg border border-rose-500/20 px-3 py-2.5 text-sm font-medium text-rose-300 transition hover:border-rose-500/40 hover:bg-rose-500/10"
                    >
                      Archive
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Add/Edit Account modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="account-modal-title"
            className="my-auto max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2
                  id="account-modal-title"
                  className="text-xl font-bold"
                >
                  {editingAccount ? "Edit account" : "Add an account"}
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  {editingAccount
                    ? "Update your account details."
                    : "Add an account to start tracking its balance."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={isSaving}
                aria-label="Close modal"
                className="rounded-lg px-2 py-1 text-xl text-zinc-400 hover:bg-zinc-800 hover:text-white disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="account-name"
                  className="mb-2 block text-sm font-medium text-zinc-300"
                >
                  Account name *
                </label>
                <input
                  id="account-name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  minLength={2}
                  maxLength={60}
                  placeholder="e.g. HDFC Savings"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-emerald-500"
                />
              </div>

              <div>
                <label
                  htmlFor="account-type"
                  className="mb-2 block text-sm font-medium text-zinc-300"
                >
                  Account type *
                </label>
                <select
                  id="account-type"
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
                >
                  {ACCOUNT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="account-balance"
                  className="mb-2 block text-sm font-medium text-zinc-300"
                >
                  Opening balance (₹) *
                </label>
                <input
                  id="account-balance"
                  name="openingBalance"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.openingBalance}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
                />
                <p className="mt-2 text-xs text-zinc-500">
                  The balance you had when you started tracking this account.
                </p>
              </div>

              <div>
                <label
                  htmlFor="account-institution"
                  className="mb-2 block text-sm font-medium text-zinc-300"
                >
                  Bank or institution
                  <span className="ml-1 text-zinc-500">(optional)</span>
                </label>
                <input
                  id="account-institution"
                  name="institution"
                  value={form.institution}
                  onChange={handleChange}
                  maxLength={100}
                  placeholder="e.g. HDFC Bank"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-emerald-500"
                />
              </div>

              <div>
                <p className="mb-3 block text-sm font-medium text-zinc-300">
                  Account color
                </p>
                <div className="flex flex-wrap gap-3">
                  {COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          color: color.value,
                        }))
                      }
                      title={color.label}
                      aria-label={`${color.label} account color`}
                      aria-pressed={form.color === color.value}
                      className={`h-9 w-9 rounded-full ${color.className} ${
                        form.color === color.value
                          ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-950"
                          : "opacity-70 hover:opacity-100"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {formError && (
                <p
                  role="alert"
                  className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300"
                >
                  {formError}
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSaving}
                  className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-zinc-900 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving
                    ? "Saving..."
                    : editingAccount
                      ? "Save changes"
                      : "Create account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const SummaryCard = ({ label, value, detail, icon, accent }) => {
  const accentClasses = {
    emerald: "text-emerald-400 bg-emerald-500/10",
    blue: "text-blue-400 bg-blue-500/10",
    rose: "text-rose-400 bg-rose-500/10",
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 transition hover:border-zinc-700">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-zinc-400">{label}</p>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl ${
            accentClasses[accent] || accentClasses.blue
          }`}
        >
          {icon}
        </div>
      </div>
      <p className="mt-5 break-words text-2xl font-bold tracking-tight">
        {value}
      </p>
      <p className="mt-2 text-xs text-zinc-500">{detail}</p>
    </div>
  );
};

export default Accounts;
