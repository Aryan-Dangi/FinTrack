import Logo from "../common/Logo";
import NavItem from "./NavItem";
import { navigation } from "../../constants/navigations";

const Sidebar = ({ closeSidebar }) => {
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

      {/* Bottom Placeholder */}
      <div className="mt-auto rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <p className="text-sm font-medium text-white">Aryan</p>
        <p className="text-xs text-zinc-400">Free Plan</p>
      </div>
    </aside>
  );
};

export default Sidebar;