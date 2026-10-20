import Logo from "../common/Logo";
import NavItem from "./NavItem";
import { navigation } from "../../constants/navigations";
import { useAuth } from "../../context/useAuth";

const Sidebar = ({ closeSidebar }) => {
  const { user } = useAuth();

  const userName = user?.fullName || "User";
  const userEmail = user?.email || "No email available";

  return (
    <aside className="fixed left-0 top-0 flex h-screen w-64 flex-col border-r border-zinc-800 bg-zinc-950 px-4 py-6">
      {/* Logo */}
      <Logo />

      {/* Navigation */}
      <nav className="mt-8 flex flex-col gap-2">
        {navigation.map((item) => (
          <NavItem
            key={item.path}
            title={item.title}
            path={item.path}
            icon={item.icon}
            onClick={closeSidebar}
          />
        ))}
      </nav>

      {/* Authenticated User Profile */}
      <div className="mt-auto overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <p className="truncate text-sm font-medium text-white">
          {userName}
        </p>

        <p className="mt-1 truncate text-xs text-zinc-400">
          {userEmail}
        </p>

        <div className="mt-3 border-t border-zinc-800 pt-3">
          <p className="text-xs text-zinc-500">
            FinTrack Account
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;