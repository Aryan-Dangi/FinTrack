import { useEffect, useRef, useState } from "react";
import api from "../../services/api";

const categories = [
  "Food",
  "Shopping",
  "Transport",
  "Entertainment",
  "Bills",
  "Health",
  "Education",
  "Salary",
  "Investment",
  "Other",
];

const paymentMethods = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "upi", label: "UPI" },
  { value: "other", label: "Other" },
];

const emptyForm = () => ({
  title: "",
  amount: "",
  type: "expense",
  category: "Food",
  date: new Date().toISOString().slice(0, 10),
  paymentMethod: "upi",
  account: "",
  note: "",
});

const toDateInput = (date) => {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";

  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount || 0);

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const inputClass =
  "w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-emerald-500";

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [accountsError, setAccountsError] = useState("");

  const [summary, setSummary] = useState({
    income: 0,
    expenses: 0,
    net: 0,
    count: 0,
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const requestId = useRef(0);

  // Load accounts for the account dropdown.
  useEffect(() => {
    let cancelled = false;

    const fetchAccounts = async () => {
      try {
        const response = await api.get("/accounts");
        const data = response.data;

        const result = Array.isArray(data.accounts)
          ? data.accounts
          : Array.isArray(data)
            ? data
            : [];

        if (!cancelled) {
          setAccounts(result.filter((account) => !account.isArchived));
          setAccountsError("");
        }
      } catch (err) {
        if (!cancelled) {
          setAccountsError(
            err.response?.data?.message ||
              "Unable to load accounts. You can still save an unlinked transaction."
          );
        }
      }
    };

    fetchAccounts();

    return () => {
      cancelled = true;
    };
  }, []);

  // Debounce text search to avoid an API call for every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);

  // Any filter change resets pagination.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, typeFilter, categoryFilter, dateFrom, dateTo]);

  // Fetch transactions and summary.
  useEffect(() => {
    const controller = new AbortController();
    const currentRequest = ++requestId.current;

    const fetchTransactions = async () => {
      setIsLoading(true);
      setError("");

      const params = { page, limit: 10 };

      if (debouncedSearch) params.search = debouncedSearch;
      if (typeFilter !== "all") params.type = typeFilter;
      if (categoryFilter !== "all") params.category = categoryFilter;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      try {
        const response = await api.get("/transactions", {
          params,
          signal: controller.signal,
        });

        if (currentRequest !== requestId.current) return;

        const data = response.data;
        const result = data.transactions || [];

        const pageInfo = data.pagination || {
          page,
          limit: 10,
          total: 0,
          totalPages: 0,
        };

        if (pageInfo.totalPages > 0 && page > pageInfo.totalPages) {
          setPage(pageInfo.totalPages);
          return;
        }

        setTransactions(result);
        setPagination(pageInfo);
        setSummary(
          data.summary || {
            income: 0,
            expenses: 0,
            net: 0,
            count: 0,
          }
        );
      } catch (err) {
        if (
          err.name === "CanceledError" ||
          err.code === "ERR_CANCELED"
        ) {
          return;
        }

        if (currentRequest === requestId.current) {
          setError(
            err.response?.data?.message ||
              "Unable to load transactions. Please try again."
          );
        }
      } finally {
        if (currentRequest === requestId.current) {
          setIsLoading(false);
        }
      }
    };

    fetchTransactions();

    return () => controller.abort();
  }, [
    page,
    debouncedSearch,
    typeFilter,
    categoryFilter,
    dateFrom,
    dateTo,
    reloadKey,
  ]);

  const openCreateModal = () => {
    setEditingTransaction(null);
    setForm(emptyForm());
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (transaction) => {
    setEditingTransaction(transaction);

    setForm({
      title: transaction.title || "",
      amount: String(transaction.amount ?? ""),
      type: transaction.type || "expense",
      category: transaction.category || "Other",
      date: toDateInput(transaction.date),
      paymentMethod: transaction.paymentMethod || "other",
      account: transaction.account
        ? String(transaction.account._id || transaction.account)
        : "",
      note: transaction.note || "",
    });

    setFormError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) return;

    setIsModalOpen(false);
    setEditingTransaction(null);
    setFormError("");
  };

  const updateForm = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setFormError("");

    if (
      form.title.trim().length < 2 ||
      !Number.isFinite(Number(form.amount)) ||
      Number(form.amount) <= 0 ||
      !form.date
    ) {
      setFormError("Enter a valid title, amount and date.");
      return;
    }

    setIsSaving(true);

    const payload = {
      ...form,
      title: form.title.trim(),
      amount: Number(form.amount),
      account: form.account || null,
      note: form.note.trim(),
    };

    try {
      if (editingTransaction) {
        await api.patch(
          `/transactions/${editingTransaction._id}`,
          payload
        );
      } else {
        await api.post("/transactions", payload);
      }

      setIsModalOpen(false);
      setEditingTransaction(null);
      setForm(emptyForm());
      setPage(1);
      setReloadKey((key) => key + 1);
    } catch (err) {
      setFormError(
        err.response?.data?.message ||
          "Unable to save this transaction. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (transactionId) => {
    if (!window.confirm("Delete this transaction permanently?")) return;

    setDeletingId(transactionId);
    setError("");

    try {
      await api.delete(`/transactions/${transactionId}`);
      setReloadKey((key) => key + 1);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to delete this transaction."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setTypeFilter("all");
    setCategoryFilter("all");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const summaryCards = [
    {
      label: "Total income",
      value: summary.income,
      color: "text-emerald-400",
      symbol: "↗",
      iconColor: "bg-emerald-500/10",
    },
    {
      label: "Total expenses",
      value: summary.expenses,
      color: "text-rose-400",
      symbol: "↘",
      iconColor: "bg-rose-500/10",
    },
    {
      label: "Net cash flow",
      value: summary.net,
      color: summary.net >= 0 ? "text-emerald-400" : "text-rose-400",
      symbol: "=",
      iconColor: "bg-sky-500/10",
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-7">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-emerald-400">
              FINANCIAL ACTIVITY
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Transactions
            </h1>

            <p className="mt-2 text-sm text-zinc-400">
              Track, manage and understand where your money goes.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400"
          >
            <span className="text-lg">+</span>
            Add transaction
          </button>
        </header>

        {error && (
          <div
            role="alert"
            className="flex items-center justify-between gap-3 rounded-xl border border-red-900/70 bg-red-950/40 p-4 text-sm text-red-300"
          >
            <span>{error}</span>

            <button
              onClick={() => setReloadKey((key) => key + 1)}
              className="shrink-0 font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Summary cards */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-400">{card.label}</p>

                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl ${card.iconColor} ${card.color}`}
                >
                  {card.symbol}
                </span>
              </div>

              <p className={`mt-4 text-2xl font-bold ${card.color}`}>
                {formatCurrency(card.value)}
              </p>
            </div>
          ))}
        </section>

        {/* Search and filters */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5">
          <div className="mb-4">
            <h2 className="font-semibold">Find transactions</h2>

            <p className="mt-1 text-sm text-zinc-500">
              Search and filter your complete transaction history.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title, category or note..."
              aria-label="Search transactions"
              className={inputClass}
            />

            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              aria-label="Filter by type"
              className={inputClass}
            >
              <option value="all">All types</option>
              <option value="income">Income</option>
              <option value="expense">Expenses</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              aria-label="Filter by category"
              className={inputClass}
            >
              <option value="all">All categories</option>

              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <div>
              <label className="mb-1.5 block text-xs text-zinc-500">
                From date
              </label>

              <input
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(event) => setDateFrom(event.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs text-zinc-500">
                To date
              </label>

              <input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(event) => setDateTo(event.target.value)}
                className={inputClass}
              />
            </div>

            <button
              onClick={clearFilters}
              className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-800"
            >
              Clear filters
            </button>
          </div>
        </section>

        {/* Transactions table */}
        <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40">
          <div className="flex flex-col justify-between gap-2 border-b border-zinc-800 px-5 py-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-semibold">All transactions</h2>

              <p className="mt-1 text-sm text-zinc-500">
                {pagination.total} matching transaction
                {pagination.total === 1 ? "" : "s"}
              </p>
            </div>

            <span className="text-sm text-zinc-500">
              {isLoading
                ? "Updating..."
                : `Page ${page} of ${Math.max(1, pagination.totalPages)}`}
            </span>
          </div>

          {isLoading ? (
            <div className="flex min-h-64 items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-emerald-400" />

                <p className="mt-3 text-sm text-zinc-400">
                  Loading transactions...
                </p>
              </div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-2xl">
                ↗
              </div>

              <h3 className="mt-4 text-lg font-semibold">
                No transactions found
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-500">
                Try changing your filters, or add a transaction to get started.
              </p>

              <button
                onClick={openCreateModal}
                className="mt-5 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400"
              >
                Add transaction
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-left text-sm">
                  <thead className="border-b border-zinc-800 bg-zinc-900/70 text-xs uppercase tracking-wider text-zinc-500">
                    <tr>
                      <th className="px-5 py-4 font-medium">Transaction</th>
                      <th className="px-5 py-4 font-medium">Category</th>
                      <th className="px-5 py-4 font-medium">Date</th>
                      <th className="px-5 py-4 font-medium">Account</th>
                      <th className="px-5 py-4 font-medium">Payment</th>
                      <th className="px-5 py-4 text-right font-medium">
                        Amount
                      </th>
                      <th className="px-5 py-4 text-right font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-zinc-800/80">
                    {transactions.map((transaction) => (
                      <tr
                        key={transaction._id}
                        className="transition hover:bg-zinc-900/80"
                      >
                        <td className="px-5 py-4">
                          <div className="font-medium text-zinc-100">
                            {transaction.title}
                          </div>

                          {transaction.note && (
                            <div className="mt-1 max-w-52 truncate text-xs text-zinc-500">
                              {transaction.note}
                            </div>
                          )}

                          <span
                            className={`mt-1.5 inline-flex rounded-md px-2 py-0.5 text-xs ${
                              transaction.type === "income"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-rose-500/10 text-rose-400"
                            }`}
                          >
                            {transaction.type}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-zinc-300">
                          {transaction.category}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-zinc-400">
                          {formatDate(transaction.date)}
                        </td>

                        <td className="px-5 py-4 text-zinc-300">
                          {(() => {
                            const accountId = transaction.account
                              ? String(
                                  transaction.account._id ||
                                    transaction.account
                                )
                              : "";

                            const account = accounts.find(
                              (item) => String(item._id) === accountId
                            );

                            return (
                              transaction.account?.name ||
                              account?.name ||
                              "Unlinked"
                            );
                          })()}
                        </td>

                        <td className="px-5 py-4 text-zinc-400">
                          {paymentMethods.find(
                            (method) =>
                              method.value === transaction.paymentMethod
                          )?.label || "Other"}
                        </td>

                        <td
                          className={`whitespace-nowrap px-5 py-4 text-right font-semibold ${
                            transaction.type === "income"
                              ? "text-emerald-400"
                              : "text-zinc-100"
                          }`}
                        >
                          {transaction.type === "income" ? "+" : "−"}
                          {formatCurrency(transaction.amount)}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-right">
                          <button
                            onClick={() => openEditModal(transaction)}
                            className="rounded-lg px-3 py-2 text-xs font-medium text-emerald-400 hover:bg-emerald-500/10"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => handleDelete(transaction._id)}
                            disabled={deletingId === transaction._id}
                            className="rounded-lg px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 disabled:opacity-50"
                          >
                            {deletingId === transaction._id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col justify-between gap-3 border-t border-zinc-800 px-5 py-4 sm:flex-row sm:items-center">
                <p className="text-sm text-zinc-500">
                  Showing {transactions.length} of {pagination.total}
                </p>

                <div className="flex gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((current) => current - 1)}
                    className="rounded-lg border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <button
                    disabled={
                      page >= pagination.totalPages ||
                      pagination.totalPages === 0
                    }
                    onClick={() => setPage((current) => current + 1)}
                    className="rounded-lg border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {/* Add/Edit transaction modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="transaction-modal-title"
            className="my-auto w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="transaction-modal-title"
                  className="text-xl font-bold"
                >
                  {editingTransaction
                    ? "Edit transaction"
                    : "Add transaction"}
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  {editingTransaction
                    ? "Update your financial record."
                    : "Record income or an expense."}
                </p>
              </div>

              <button
                onClick={closeModal}
                disabled={isSaving}
                aria-label="Close dialog"
                className="rounded-lg px-3 py-1 text-xl text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                ×
              </button>
            </div>

            {formError && (
              <p
                role="alert"
                className="mt-4 rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-300"
              >
                {formError}
              </p>
            )}

            <form onSubmit={handleSave} className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm text-zinc-300">
                  Transaction title
                </label>

                <input
                  name="title"
                  value={form.title}
                  onChange={updateForm}
                  required
                  minLength={2}
                  maxLength={100}
                  placeholder="e.g. Monthly salary"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm text-zinc-300">
                    Amount (₹)
                  </label>

                  <input
                    name="amount"
                    type="number"
                    value={form.amount}
                    onChange={updateForm}
                    required
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm text-zinc-300">
                    Type
                  </label>

                  <select
                    name="type"
                    value={form.type}
                    onChange={updateForm}
                    className={inputClass}
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm text-zinc-300">
                    Category
                  </label>

                  <select
                    name="category"
                    value={form.category}
                    onChange={updateForm}
                    className={inputClass}
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm text-zinc-300">
                    Date
                  </label>

                  <input
                    name="date"
                    type="date"
                    value={form.date}
                    onChange={updateForm}
                    required
                    className={inputClass}
                  />
                </div>
              </div>

              {/* NEW: Link the transaction to an account */}
              <div>
                <label className="mb-1.5 block text-sm text-zinc-300">
                  Account{" "}
                  <span className="text-zinc-500">(optional)</span>
                </label>

                <select
                  name="account"
                  value={form.account}
                  onChange={updateForm}
                  className={inputClass}
                >
                  <option value="">No account linked</option>

                  {accounts.map((account) => (
                    <option key={account._id} value={account._id}>
                      {account.name} —{" "}
                      {formatCurrency(account.openingBalance)} opening balance
                    </option>
                  ))}
                </select>

                {accountsError && (
                  <p className="mt-2 text-xs text-amber-400">
                    {accountsError}
                  </p>
                )}

                {accounts.length === 0 && !accountsError && (
                  <p className="mt-2 text-xs text-zinc-500">
                    Create an account on the Accounts page to link transactions.
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm text-zinc-300">
                  Payment method
                </label>

                <select
                  name="paymentMethod"
                  value={form.paymentMethod}
                  onChange={updateForm}
                  className={inputClass}
                >
                  {paymentMethods.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm text-zinc-300">
                  Note (optional)
                </label>

                <textarea
                  name="note"
                  value={form.note}
                  onChange={updateForm}
                  maxLength={500}
                  rows={3}
                  placeholder="Add extra details..."
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSaving}
                  className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-900 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving
                    ? "Saving..."
                    : editingTransaction
                      ? "Save changes"
                      : "Save transaction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;