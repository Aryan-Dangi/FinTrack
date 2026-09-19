import { Outlet } from "react-router-dom";

const AuthLayout = () =>{
    return(
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
      <div className="w-full max-w-md p-6 border border-zinc-800 rounded-2xl bg-zinc-900">
        <Outlet />
      </div>
    </div>
    )
}

export default AuthLayout