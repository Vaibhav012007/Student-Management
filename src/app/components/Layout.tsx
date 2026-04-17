import { Outlet, Link, useLocation } from "react-router";
import { BookOpen, ClipboardList, Timer, Calendar, CheckSquare, LayoutDashboard, Clock, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { api } from "../api";

interface TimerState {
  minutes: number;
  seconds: number;
  isRunning: boolean;
  customMinutes: number;
  lastUpdate: number;
  timerName: string;
}

export function Layout() {
  const location = useLocation();
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerDisplay, setTimerDisplay] = useState("");
  const [timerName, setTimerName] = useState("Focus Session");

  useEffect(() => {
    const checkTimer = async () => {
      try {
        const state = await api.getTimerState();
        if (state.isRunning) {
          const elapsed = Math.floor((Date.now() - state.lastUpdate) / 1000);
          let totalSeconds = state.minutes * 60 + state.seconds - elapsed;

          if (totalSeconds > 0) {
            const mins = Math.floor(totalSeconds / 60);
            const secs = totalSeconds % 60;
            setTimerDisplay(`${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`);
            setTimerName(state.timerName || "Focus Session");
            setTimerRunning(true);
          } else {
            setTimerRunning(false);
          }
        } else {
          setTimerRunning(false);
        }
      } catch (err) {
        console.error('Failed to load timer state:', err);
      }
    };

    // Check timer immediately
    checkTimer();

    // Check timer every second
    const interval = setInterval(checkTimer, 1000);

    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/notes", label: "Notes", icon: BookOpen },
    { path: "/study-plan", label: "Study Plan", icon: ClipboardList },
    { path: "/timer", label: "Focus Timer", icon: Timer },
    { path: "/checklist", label: "Checklist", icon: CheckSquare },
    { path: "/calendar", label: "Calendar", icon: Calendar },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-blue-600">StudyHub</h1>
          <p className="text-sm text-gray-500 mt-1">Your study companion</p>
        </div>
        
        {/* Timer Status Indicator */}
        {timerRunning && (
          <div className="mx-4 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-blue-600 animate-pulse" />
              <div className="flex-1">
                <p className="text-xs text-blue-600 font-medium">{timerName}</p>
                <p className="text-lg font-bold text-blue-700">{timerDisplay}</p>
              </div>
            </div>
          </div>
        )}
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon className="size-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            onClick={() => {
              localStorage.removeItem('authToken');
              localStorage.removeItem('user');
              window.location.reload();
            }}
          >
            <LogOut className="size-5 mr-2" />
            <span>Logout</span>
          </Button>
          <div className="text-xs text-gray-500 text-center mt-2">
            Stay focused, stay organized
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}