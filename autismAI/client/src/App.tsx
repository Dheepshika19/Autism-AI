import { Link, Outlet } from 'react-router-dom'

export default function App() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-800">autismAI</h1>
          <nav className="flex gap-4 text-sm text-slate-700">
            <Link to="/" className="hover:text-sky-600">Home</Link>
            <Link to="/children" className="hover:text-sky-600">Children</Link>
            <Link to="/timetable" className="hover:text-sky-600">Timetable</Link>
            <Link to="/staff" className="hover:text-sky-600">Staff</Link>
            <Link to="/progress" className="hover:text-sky-600">Progress</Link>
            <Link to="/settings" className="hover:text-sky-600">Settings</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
