import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { Notes } from "./components/Notes";
import { StudyPlan } from "./components/StudyPlan";
import { FocusTimer } from "./components/FocusTimer";
import { Checklist } from "./components/Checklist";
import { Calendar } from "./components/Calendar";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "notes", Component: Notes },
      { path: "study-plan", Component: StudyPlan },
      { path: "timer", Component: FocusTimer },
      { path: "checklist", Component: Checklist },
      { path: "calendar", Component: Calendar },
    ],
  },
]);
