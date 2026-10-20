import { Bell, Moon, Search, Menu, LogOut } from "lucide-react";
import Avatar from "../ui/Avatar";
import { useAuth } from "../../context/useAuth";

const Navbar = ({
  onMenuClick,
  onLogout,
  isLoggingOut = false,
}) => {
  const { user } = useAuth();

  const userName = user?.fullName || "User";

  return (
    <header className="flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4 md:px-6">
      <div className="flex items-center gap-3">
        {/* Mobile Menu */}
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="rounded-lg p-2 hover:bg-zinc-800 lg:hidden"
        >
          <Menu size={22} />
        </button>

        {/* Search */}
        <div className="hidden w-72 items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 md:flex">
          <Search size={18} className="text-zinc-500" />

          <input
            type="text"
            placeholder="Search transactions..."
            aria-label="Search transactions"
            className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Theme Button */}
        <button
          type="button"
          aria-label="Toggle theme"
          title="Toggle theme"
          className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 transition hover:text-white"
        >
          <Moon size={20} />
        </button>

        {/* Notifications */}
        <button
          type="button"
          aria-label="Notifications"
          title="Notifications"
          className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 transition hover:text-white"
        >
          <Bell size={20} />
        </button>

        {/* Logged-in User */}
        <div className="flex items-center gap-2">
          <Avatar name={userName} />

          <span className="hidden max-w-32 truncate text-sm font-medium text-zinc-300 xl:block">
            {userName}
          </span>
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={onLogout}
          disabled={isLoggingOut}
          title="Log out"
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-300 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <LogOut size={18} />

          <span className="hidden sm:inline">
            {isLoggingOut ? "Logging out..." : "Log out"}
          </span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;