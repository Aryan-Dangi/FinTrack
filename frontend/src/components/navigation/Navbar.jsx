import { Bell, Moon, Search, Menu } from "lucide-react";
import Avatar from "../ui/Avatar";

const Navbar = ({ onMenuClick }) => {
  return (
    <header className="flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4 md:px-6">
      <div className="flex items-center gap-3">
        {/* Mobile Menu */}
        <button
          onClick={onMenuClick}
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
            className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:text-white">
          <Moon size={20} />
        </button>

        <button className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 hover:text-white">
          <Bell size={20} />
        </button>

        <Avatar name="Aryan" />
      </div>
    </header>
  );
};

export default Navbar;