import { Wallet } from "lucide-react";

const Logo = () => {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500">
        <Wallet size={22} className="text-black" />
      </div>

      <div>
        <h1 className="text-lg font-bold text-white">FinTrack</h1>
        <p className="text-xs text-zinc-400">Personal Finance OS</p>
      </div>
    </div>
  );
};

export default Logo;