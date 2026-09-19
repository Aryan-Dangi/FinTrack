import { Outlet } from "react-router-dom";

const DashboardLayout = () =>{
    return(
        <div className="min-h-screen bg-zinc-950 text-white">
            <header className="border-b border-zinc-800 p-4"> 
                <h1 className="text-xl font-semibold text-emerald-400">FinTrack</h1>
            </header>

            <main className="p-6">
                <Outlet />
            </main>
        </div>
    )
}

export default DashboardLayout;