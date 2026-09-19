import { NavLink } from "react-router-dom";

const NavItem = ({ title, path, icon: Icon, onClick}) => {
  return (
    <NavLink
      to={path}
      onClick={() => onClick?.()}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3 py-2 transition-all ${
          isActive
            ? "bg-emerald-500 text-black font-semibold"
            : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
        }`
      }
    >
      <Icon size={20} />
      <span>{title}</span>
    </NavLink>
  );
};

export default NavItem;