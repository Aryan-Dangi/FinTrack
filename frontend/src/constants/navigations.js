import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Target,
  Trophy,
  BarChart3,
  Settings,
} from "lucide-react";

export const navigation = [
  {
    title: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Transactions",
    path: "/transactions",
    icon: ArrowLeftRight,
  },
  {
    title: "Accounts",
    path: "/accounts",
    icon: Wallet,
  },
  {
    title: "Budgets",
    path: "/budgets",
    icon: Target,
  },
  {
    title: "Goals",
    path: "/goals",
    icon: Trophy,
  },
  {
    title: "Analytics",
    path: "/analytics",
    icon: BarChart3,
  },
  {
    title: "Settings",
    path: "/settings",
    icon: Settings,
  },
];