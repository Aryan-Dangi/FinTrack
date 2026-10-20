import { useCallback, useEffect, useState } from "react";
import { getAccountBalances } from "../../services/accountService";
import {
  createTransfer,
  deleteTransfer,
  getTransfers,
} from "../../services/transferService";

const inputClass =
  "w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-emerald-500";

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

const today = () => new Date().toISOString().slice(0, 10);

const Transfers = () => {
  const [accounts, setAccounts] = useState([]);
  const [transfers, setTransfers] = useState([]);

  const [fromAccount, setFromAccount] = useState("");
  const [toAccount, setToAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today);
  const [note, setNote] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const [balanceResult, transferResult] = await Promise.all([
        getAccountBalances(),
        getTransfers(),
      ]);

      setAccounts(
        (balanceResult.accounts || []).filter(
          (account) =>
            !account.isArchived && account.type !== "credit_card"
        )
      );

      setTransfers(transferResult.transfers || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load accounts and transfers."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const sourceAccount = accounts.find(
    (account) => account._id === fromAccount
  );

  const destinationAccount = accounts.find(
    (account) => account._id === toAccount
  );

  const resetForm = () => {
    setFromAccount("");
    setToAccount("");
    setAmount("");
    setDate(today());
    setNote("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!fromAccount || !toAccount) {
      setError("Select both a source and a destination account.");
      return;
    }

    if (fromAccount === toAccount) {
      setError("Source and destination accounts must be different.");
      return;
    }

    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      setError("Enter a valid transfer amount.");
      return;
    }

    if (!date) {
      setError("Select a transfer date.");
      return;
    }

    if (
      sourceAccount &&
      Number(amount) > Number(sourceAccount.currentBalance)
    ) {
      setError(
        `Insufficient funds. Available balance: ${formatCurrency(
          sourceAccount.currentBalance
        )}.`
      );
      return;
    }

    setIsSaving(true);

    try {
      await createTransfer({
        fromAccount,
        toAccount,
        amount: Number(amount),
        date,
        note: note.trim(),
      });

      resetForm();
      setSuccess("Transfer completed successfully.");

      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to complete this transfer."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (transferId) => {
    const confirmed = window.confirm(
      "Delete this transfer? The transfer will be removed from both account balances."
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");
    setDeletingId(transferId);

    try {
      await deleteTransfer(transferId);
      setSuccess("Transfer deleted.");
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to delete this transfer."
      );
    } finally {
      setDeletingId("");
    }
  };

  const totalTransfers = transfers.reduce(
    (total, transfer) => total + Number(transfer.amount || 0),
    0
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
        Loading transfers...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-7">
        <header>
          <p className="text-sm font-medium text-emerald-400">
            MONEY MOVEMENT
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Transfers
          </h1>

          <p className="mt-2 text-sm text-zinc-400">
            Move money between your accounts without affecting income or
            expense totals.
          </p>
        </header>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-900/70 bg-red-950/40 p-4 text-sm text-red-300"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="rounded-xl border border-emerald-900/70 bg-emerald-950/30 p-4 text-sm text-emerald-300"
          >
            {success}
          </div>
        )}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
            <p className="text-sm text-zinc-400">Recorded transfers</p>
            <p className="mt-3 text-2xl font-bold">{transfers.length}</p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
            <p className="text-sm text-zinc-400">
              Total amount transferred
            </p>
            <p className="mt-3 text-2xl font-bold text-emerald-400">
              {formatCurrency(totalTransfers)}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Includes each transfer once, not twice.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-7">
          <h2 className="text-lg font-semibold">New transfer</h2>

          <p className="mt-1 text-sm text-zinc-500">
            Choose the source and destination accounts.
          </p>

          {accounts.length < 2 ? (
            <div className="mt-5 rounded-xl border border-amber-900/60 bg-amber-950/20 p-4 text-sm text-amber-300">
              You need at least two active non-credit-card accounts to make a
              transfer. Create another account on the Accounts page first.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-zinc-300">
                    From account
                  </label>

                  <select
                    value={fromAccount}
                    onChange={(event) => {
                      const value = event.target.value;
                      setFromAccount(value);

                      if (value === toAccount) setToAccount("");
                    }}
                    required
                    className={inputClass}
                  >
                    <option value="">Select source account</option>

                    {accounts.map((account) => (
                      <option key={account._id} value={account._id}>
                        {account.name} —{" "}
                        {formatCurrency(account.currentBalance)}
                      </option>
                    ))}
                  </select>

                  {sourceAccount && (
                    <p className="mt-2 text-xs text-zinc-500">
                      Available balance:{" "}
                      {formatCurrency(sourceAccount.currentBalance)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm text-zinc-300">
                    To account
                  </label>

                  <select
                    value={toAccount}
                    onChange={(event) => setToAccount(event.target.value)}
                    required
                    className={inputClass}
                  >
                    <option value="">Select destination account</option>

                    {accounts
                      .filter((account) => account._id !== fromAccount)
                      .map((account) => (
                        <option key={account._id} value={account._id}>
                          {account.name} —{" "}
                          {formatCurrency(account.currentBalance)}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {sourceAccount && destinationAccount && (
                <div className="flex flex-col items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 sm:flex-row">
                  <div>
                    <p className="text-xs text-zinc-500">Sending from</p>
                    <p className="mt-1 font-medium">
                      {sourceAccount.name}
                    </p>
                  </div>

                  <span className="text-xl text-emerald-400">→</span>

                  <div className="sm:text-right">
                    <p className="text-xs text-zinc-500">Receiving in</p>
                    <p className="mt-1 font-medium">
                      {destinationAccount.name}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-zinc-300">
                    Amount (₹)
                  </label>

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    required
                    placeholder="Enter amount"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-zinc-300">
                    Transfer date
                  </label>

                  <input
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    required
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-300">
                  Note (optional)
                </label>

                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  maxLength={500}
                  rows={2}
                  placeholder="e.g. Move monthly spending money to UPI"
                  className={inputClass}
                />
              </div>

              <button
                type="submit"
                disabled={isSaving || accounts.length < 2}
                className="w-full rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {isSaving ? "Processing..." : "Complete transfer"}
              </button>
            </form>
          )}
        </section>

        <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40">
          <div className="border-b border-zinc-800 px-5 py-4">
            <h2 className="font-semibold">Transfer history</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Money moved between your accounts.
            </p>
          </div>

          {transfers.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <h3 className="font-semibold">No transfers yet</h3>
              <p className="mt-2 text-sm text-zinc-500">
                Your completed transfers will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-500">
                  <tr>
                    <th className="px-5 py-4 font-medium">Date</th>
                    <th className="px-5 py-4 font-medium">From</th>
                    <th className="px-5 py-4 font-medium">To</th>
                    <th className="px-5 py-4 font-medium">Note</th>
                    <th className="px-5 py-4 text-right font-medium">
                      Amount
                    </th>
                    <th className="px-5 py-4 text-right font-medium">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-zinc-800/80">
                  {transfers.map((transfer) => (
                    <tr
                      key={transfer._id}
                      className="transition hover:bg-zinc-900/80"
                    >
                      <td className="whitespace-nowrap px-5 py-4 text-zinc-400">
                        {formatDate(transfer.date)}
                      </td>

                      <td className="px-5 py-4 font-medium">
                        {transfer.fromAccount?.name || "Account unavailable"}
                      </td>

                      <td className="px-5 py-4 font-medium">
                        {transfer.toAccount?.name || "Account unavailable"}
                      </td>

                      <td className="max-w-48 truncate px-5 py-4 text-zinc-400">
                        {transfer.note || "—"}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-emerald-400">
                        {formatCurrency(transfer.amount)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => handleDelete(transfer._id)}
                          disabled={deletingId === transfer._id}
                          className="rounded-lg px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 disabled:opacity-50"
                        >
                          {deletingId === transfer._id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Transfers;