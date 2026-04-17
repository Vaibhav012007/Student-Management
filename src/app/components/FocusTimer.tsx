import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Settings } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { toast } from "sonner";
import { api } from "../api";

interface TimerState {
  minutes: number;
  seconds: number;
  isRunning: boolean;
  customMinutes: number;
  lastUpdate: number;
  timerName: string;
}

export function FocusTimer() {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(25);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [timerName, setTimerName] = useState("Focus Session");
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const intervalRef = useRef<number | null>(null);

  // Load timer state from API on mount
  useEffect(() => {
    const loadTimerState = async () => {
      try {
        const state = await api.getTimerState();
        // Calculate elapsed time since last update
        if (state.isRunning) {
          const elapsed = Math.floor((Date.now() - state.lastUpdate) / 1000);
          let totalSeconds = state.minutes * 60 + state.seconds - elapsed;

          if (totalSeconds <= 0) {
            // Timer completed while away
            setMinutes(0);
            setSeconds(0);
            setIsRunning(false);
            setIsCompleteDialogOpen(true);
          } else {
            setMinutes(Math.floor(totalSeconds / 60));
            setSeconds(totalSeconds % 60);
            setIsRunning(true);
          }
        } else {
          setMinutes(state.minutes || 25);
          setSeconds(state.seconds || 0);
          setIsRunning(false);
        }

        setCustomMinutes(state.customMinutes || 25);
        setTimerName(state.timerName || "Focus Session");
      } catch (err) {
        console.error('Failed to load timer state:', err);
        toast.error('Failed to load timer state');
      }
    };
    loadTimerState();
  }, []);

  // Save timer state to API whenever it changes
  useEffect(() => {
    const state = {
      minutes,
      seconds,
      isRunning,
      customMinutes,
      lastUpdate: Date.now(),
      timerName,
    };
    api.updateTimerState(state).catch(err => console.error('Failed to save timer state:', err));
  }, [minutes, seconds, isRunning, customMinutes, timerName]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        setSeconds((prevSeconds) => {
          if (prevSeconds === 0) {
            setMinutes((prevMinutes) => {
              if (prevMinutes === 0) {
                handleTimerComplete();
                return 0;
              }
              return prevMinutes - 1;
            });
            return 59;
          }
          return prevSeconds - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    setIsCompleteDialogOpen(true);
    // Play notification sound if browser supports it
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Focus Timer', {
        body: `${timerName} complete! Great job!`,
      });
    }
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setMinutes(customMinutes);
    setSeconds(0);
  };

  const applyCustomTime = () => {
    if (customMinutes < 1 || customMinutes > 180) {
      toast.error("Please enter a valid time (1-180 minutes)");
      return;
    }
    setMinutes(customMinutes);
    setSeconds(0);
    setIsRunning(false);
    setIsSettingsOpen(false);
    toast.success(`Timer set to ${customMinutes} minutes`);
  };

  const formatTime = (mins: number, secs: number) => {
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const progress = ((customMinutes * 60 - (minutes * 60 + seconds)) / (customMinutes * 60)) * 100;

  const presetTimes = [
    { label: "Pomodoro", minutes: 25 },
    { label: "Short Break", minutes: 5 },
    { label: "Long Break", minutes: 15 },
    { label: "Deep Work", minutes: 50 },
  ];

  return (
    <div className="p-8">
      {/* Completion Dialog */}
      <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">🎉 Timer Complete!</DialogTitle>
            <DialogDescription>
              Great work! You've finished your {timerName.toLowerCase()}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-center text-lg font-medium text-gray-700">
              {timerName}
            </p>
            <p className="text-center text-3xl font-bold text-blue-600 mt-2">
              {customMinutes} minutes completed
            </p>
            <p className="text-center text-sm text-gray-500 mt-4">
              Take a break and stay hydrated! 💧
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => {
                setIsCompleteDialogOpen(false);
                resetTimer();
              }}
              className="flex-1"
            >
              Start Another Session
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsCompleteDialogOpen(false)}
              className="flex-1"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Focus Timer</h1>
          <p className="text-gray-500 mt-1">Set a countdown timer for your study sessions</p>
        </div>

        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Settings className="size-4 mr-2" />
              Settings
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Timer Settings</DialogTitle>
              <DialogDescription>Customize your focus timer settings</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="timerName">Timer Name</Label>
                <Input
                  id="timerName"
                  type="text"
                  placeholder="e.g., Math Study, Reading"
                  value={timerName}
                  onChange={(e) => setTimerName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="customMinutes">Custom Time (minutes)</Label>
                <Input
                  id="customMinutes"
                  type="number"
                  min="1"
                  max="180"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(parseInt(e.target.value) || 25)}
                />
              </div>
              <Button onClick={applyCustomTime} className="w-full">
                Apply
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card className="mb-6">
          <CardContent className="p-12">
            <div className="text-center">
              {/* Timer Name */}
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">{timerName}</h2>

              {/* Timer Display */}
              <div className="relative mb-8">
                <svg className="size-64 mx-auto" viewBox="0 0 200 200">
                  <circle
                    cx="100"
                    cy="100"
                    r="90"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                  />
                  <circle
                    cx="100"
                    cy="100"
                    r="90"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="8"
                    strokeDasharray={`${2 * Math.PI * 90}`}
                    strokeDashoffset={`${2 * Math.PI * 90 * (1 - progress / 100)}`}
                    strokeLinecap="round"
                    transform="rotate(-90 100 100)"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-6xl font-bold text-gray-900">
                    {formatTime(minutes, seconds)}
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex justify-center gap-4">
                <Button
                  size="lg"
                  onClick={toggleTimer}
                  className="px-8"
                >
                  {isRunning ? (
                    <>
                      <Pause className="size-5 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="size-5 mr-2" />
                      Start
                    </>
                  )}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={resetTimer}
                >
                  <RotateCcw className="size-5 mr-2" />
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preset Times */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Presets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {presetTimes.map((preset) => (
                <Button
                  key={preset.label}
                  variant="outline"
                  onClick={() => {
                    setCustomMinutes(preset.minutes);
                    setMinutes(preset.minutes);
                    setSeconds(0);
                    setIsRunning(false);
                    toast.success(`Timer set to ${preset.minutes} minutes`);
                  }}
                  className="flex flex-col h-auto py-4"
                >
                  <span className="text-sm font-medium">{preset.label}</span>
                  <span className="text-2xl font-bold mt-1">{preset.minutes}</span>
                  <span className="text-xs text-gray-500">minutes</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Study Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Take regular breaks to maintain focus and avoid burnout</li>
              <li>• Use the Pomodoro technique: 25 minutes of focused work, 5 minutes break</li>
              <li>• Eliminate distractions during your focus sessions</li>
              <li>• Stay hydrated and maintain good posture while studying</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}