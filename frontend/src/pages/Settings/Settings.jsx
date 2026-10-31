
import { useEffect, useState } from "react";
import {
  UserRound,
  SlidersHorizontal,
  BellRing,
  ShieldCheck,
  Save,
  LockKeyhole,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
} from "lucide-react";

import { useAuth } from "../../context/useAuth";
import {
  updateUserProfile,
  changeUserPassword,
} from "../../services/authService";

const PREFERENCES_KEY = "fintrack_preferences";
const NOTIFICATIONS_KEY = "fintrack_notifications";

const defaultPreferences = {
  dateFormat: "DD MMM YYYY",
  appearance: "dark",
};

const defaultNotifications = {
  budgetAlerts: true,
  goalReminders: true,
  transactionAlerts: true,
};

const readLocalSettings = (key, defaults) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
  } catch {
    return defaults;
  }
};

const SectionCard = ({ icon: Icon, title, description, children }) => (
  <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 sm:p-6">
    <div className="mb-6 flex items-start gap-3">
      <div className="rounded-xl bg-emerald-500/10 p-3">
        <Icon size={21} className="text-emerald-400" />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="mt-1 text-sm text-zinc-400">{description}</p>
      </div>
    </div>

    {children}
  </section>
);

const Toggle = ({ label, description, checked, onChange }) => (
  <label className="flex cursor-pointer items-center justify-between gap-4 py-3">
    <div>
      <p className="text-sm font-medium text-zinc-200">{label}</p>
      <p className="mt-1 text-xs text-zinc-500">{description}</p>
    </div>

    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      className="peer sr-only"
    />

    <span
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${
        checked ? "bg-emerald-500" : "bg-zinc-700"
      }`}
    >
      <span
        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
          checked ? "left-6" : "left-1"
        }`}
      />
    </span>
  </label>
);

const fieldClass =
  "mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60";

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.message ||
  fallback;

const Settings = () => {
  const { user, setUser } = useAuth();

  const [fullName, setFullName] = useState("");
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [notifications, setNotifications] = useState(defaultNotifications);

  const [profileLoading, setProfileLoading] = useState(false);
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const [feedback, setFeedback] = useState({
    type: "",
    message: "",
  });

  useEffect(() => {
    setFullName(user?.fullName || user?.name || "");

    const savedPreferences = readLocalSettings(
      PREFERENCES_KEY,
      defaultPreferences
    );

    // Keep only the preferences currently supported by FinTrack.
    setPreferences({
      dateFormat: savedPreferences.dateFormat,
      appearance: savedPreferences.appearance,
    });

    setNotifications(
      readLocalSettings(NOTIFICATIONS_KEY, defaultNotifications)
    );
  }, [user]);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
  };

  const updatePreference = (key, value) => {
    setPreferences((previous) => ({
      ...previous,
      [key]: value,
    }));

    setFeedback({ type: "", message: "" });
  };

  const updateNotification = (key, value) => {
    const updated = {
      ...notifications,
      [key]: value,
    };

    setNotifications(updated);

    try {
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));

      showFeedback(
        "success",
        "Notification preferences saved on this device."
      );
    } catch {
      showFeedback(
        "error",
        "Unable to save notification preferences in this browser."
      );
    }
  };

  // Update profile
  const handleSaveProfile = async (event) => {
    event.preventDefault();

    const trimmedName = fullName.trim();

    if (trimmedName.length < 3 || trimmedName.length > 50) {
      showFeedback(
        "error",
        "Your name must be between 3 and 50 characters."
      );
      return;
    }

    setProfileLoading(true);
    setFeedback({ type: "", message: "" });

    try {
      const result = await updateUserProfile({
        fullName: trimmedName,
      });

      const updatedUser = result?.user;

      if (!updatedUser) {
        throw new Error("The server did not return the updated profile.");
      }

      setUser(updatedUser);
      setFullName(updatedUser.fullName || trimmedName);

      showFeedback(
        "success",
        result.message || "Profile updated successfully."
      );
    } catch (error) {
      showFeedback(
        "error",
        getErrorMessage(error, "Unable to update your profile.")
      );
    } finally {
      setProfileLoading(false);
    }
  };

  // Save date and appearance preferences locally
  const handleSavePreferences = (event) => {
    event.preventDefault();

    setPreferencesLoading(true);
    setFeedback({ type: "", message: "" });

    try {
      localStorage.setItem(
        PREFERENCES_KEY,
        JSON.stringify({
          dateFormat: preferences.dateFormat,
          appearance: preferences.appearance,
        })
      );

      showFeedback(
        "success",
        "Your preferences have been saved successfully."
      );
    } catch {
      showFeedback(
        "error",
        "Unable to save your preferences."
      );
    } finally {
      setPreferencesLoading(false);
    }
  };

  // Change password
  const handleChangePassword = async (event) => {
    event.preventDefault();

    if (newPassword.length < 8) {
      showFeedback(
        "error",
        "Your new password must contain at least 8 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      showFeedback("error", "The new passwords do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      showFeedback(
        "error",
        "Your new password must differ from your current password."
      );
      return;
    }

    setPasswordLoading(true);
    setFeedback({ type: "", message: "" });

    try {
      const result = await changeUserPassword({
        currentPassword,
        newPassword,
      });

      showFeedback(
        "success",
        result?.message || "Password changed successfully."
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordForm(false);
    } catch (error) {
      showFeedback(
        "error",
        getErrorMessage(error, "Unable to change your password.")
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const email = user?.email || "";
  const displayName = fullName || "Your name";

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-10">
      {/* Page heading */}
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Manage your profile, preferences, notifications, and account security.
        </p>
      </div>

      {/* Shared feedback */}
      {feedback.message && (
        <div
          role={feedback.type === "error" ? "alert" : "status"}
          className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
            feedback.type === "error"
              ? "border-red-900/60 bg-red-950/30 text-red-300"
              : "border-emerald-800/60 bg-emerald-950/30 text-emerald-300"
          }`}
        >
          {feedback.type === "error" ? (
            <AlertCircle size={19} className="mt-0.5 shrink-0" />
          ) : (
            <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
          )}

          <p>{feedback.message}</p>
        </div>
      )}

      {/* Profile */}
      <SectionCard
        icon={UserRound}
        title="Profile"
        description="Your personal details associated with FinTrack."
      >
        <form onSubmit={handleSaveProfile} className="space-y-5">
          <div className="flex items-center gap-4 border-b border-zinc-800 pb-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-xl font-bold text-zinc-950">
              {(displayName || email).charAt(0).toUpperCase() || "U"}
            </div>

            <div className="min-w-0">
              <p className="truncate font-semibold text-white">
                {displayName}
              </p>
              <p className="mt-1 truncate text-sm text-zinc-400">
                {email}
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm text-zinc-300">
              Full name
              <input
                type="text"
                value={fullName}
                onChange={(event) => {
                  setFullName(event.target.value);
                  setFeedback({ type: "", message: "" });
                }}
                placeholder="Enter your full name"
                autoComplete="name"
                required
                minLength={3}
                maxLength={50}
                disabled={profileLoading}
                className={fieldClass}
              />
            </label>

            <label className="block text-sm text-zinc-300">
              Email address
              <input
                type="email"
                value={email}
                readOnly
                className={`${fieldClass} cursor-not-allowed text-zinc-500`}
              />
              <span className="mt-2 block text-xs text-zinc-500">
                Email changes are not supported here.
              </span>
            </label>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={profileLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {profileLoading ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {profileLoading ? "Saving..." : "Save profile"}
            </button>
          </div>
        </form>
      </SectionCard>

      {/* Preferences */}
      <SectionCard
        icon={SlidersHorizontal}
        title="Preferences"
        description="Customize how financial information is displayed."
      >
        <form onSubmit={handleSavePreferences} className="space-y-5">
          <label className="block text-sm text-zinc-300">
            Date format
            <select
              value={preferences.dateFormat}
              onChange={(event) =>
                updatePreference("dateFormat", event.target.value)
              }
              className={fieldClass}
            >
              <option value="DD MMM YYYY">29 Oct 2026</option>
              <option value="DD/MM/YYYY">29/10/2026</option>
              <option value="MM/DD/YYYY">10/29/2026</option>
              <option value="YYYY-MM-DD">2026-10-29</option>
            </select>
          </label>

          <label className="block text-sm text-zinc-300">
            Appearance
            <select
              value={preferences.appearance}
              onChange={(event) =>
                updatePreference("appearance", event.target.value)
              }
              className={fieldClass}
            >
              <option value="dark">Dark mode</option>
              <option value="light">Light mode (not implemented)</option>
              <option value="system">
                Use system preference (not implemented)
              </option>
            </select>
          </label>

          <p className="text-xs text-zinc-500">
            FinTrack currently uses Indian Rupees (₹). Date format and
            appearance preferences are saved on this device.
          </p>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={preferencesLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {preferencesLoading ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {preferencesLoading ? "Saving..." : "Save preferences"}
            </button>
          </div>
        </form>
      </SectionCard>

      {/* Notifications */}
      <SectionCard
        icon={BellRing}
        title="Notifications"
        description="Choose the types of alerts you want to enable."
      >
        <div className="divide-y divide-zinc-800">
          <Toggle
            label="Budget alerts"
            description="Alerts when spending approaches a budget limit."
            checked={notifications.budgetAlerts}
            onChange={(value) =>
              updateNotification("budgetAlerts", value)
            }
          />

          <Toggle
            label="Goal reminders"
            description="Reminders about your savings goals."
            checked={notifications.goalReminders}
            onChange={(value) =>
              updateNotification("goalReminders", value)
            }
          />

          <Toggle
            label="Transaction alerts"
            description="Alerts for newly recorded transactions."
            checked={notifications.transactionAlerts}
            onChange={(value) =>
              updateNotification("transactionAlerts", value)
            }
          />
        </div>

        <p className="mt-4 text-xs text-zinc-500">
          Toggle choices persist on this browser. Actual notification delivery
          and account-wide synchronization are not implemented yet.
        </p>
      </SectionCard>

      {/* Security */}
      <SectionCard
        icon={ShieldCheck}
        title="Security"
        description="Manage access to your account."
      >
        <div className="flex flex-col gap-4 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <LockKeyhole size={20} className="mt-0.5 text-zinc-400" />

            <div>
              <p className="font-medium text-zinc-200">Change password</p>
              <p className="mt-1 text-sm text-zinc-500">
                Verify your current password before setting a new one.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowPasswordForm((previous) => !previous);
              setCurrentPassword("");
              setNewPassword("");
              setConfirmPassword("");
              setFeedback({ type: "", message: "" });
            }}
            className="shrink-0 rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-emerald-500/50 hover:bg-zinc-800"
          >
            {showPasswordForm ? "Cancel" : "Change password"}
          </button>
        </div>

        {showPasswordForm && (
          <form
            onSubmit={handleChangePassword}
            className="mt-5 space-y-4 rounded-xl border border-zinc-800 p-4 sm:p-5"
          >
            <label className="block text-sm text-zinc-300">
              Current password
              <input
                type="password"
                value={currentPassword}
                onChange={(event) =>
                  setCurrentPassword(event.target.value)
                }
                autoComplete="current-password"
                required
                disabled={passwordLoading}
                className={fieldClass}
              />
            </label>

            <label className="block text-sm text-zinc-300">
              New password
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
                disabled={passwordLoading}
                className={fieldClass}
              />
              <span className="mt-2 block text-xs text-zinc-500">
                Must contain at least 8 characters.
              </span>
            </label>

            <label className="block text-sm text-zinc-300">
              Confirm new password
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                autoComplete="new-password"
                minLength={8}
                required
                disabled={passwordLoading}
                className={fieldClass}
              />
            </label>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={passwordLoading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {passwordLoading ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <LockKeyhole size={16} />
                )}
                {passwordLoading ? "Updating..." : "Update password"}
              </button>
            </div>
          </form>
        )}

        <p className="mt-4 text-xs text-zinc-500">
          Session revocation after password changes is a separate backend
          security improvement and is not implemented by the current endpoint.
        </p>
      </SectionCard>
    </div>
  );
};

export default Settings;
