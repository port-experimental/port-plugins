import "./App.css";
import { useEffect } from "react";
import { usePortPluginData } from "@port-labs/plugins-sdk/react";
import { ScorecardDashboard } from "./components/ScorecardDashboard/ScorecardDashboard";

export function App() {
  const { applyThemeCss } = usePortPluginData();
  useEffect(() => { applyThemeCss(); }, [applyThemeCss]);
  return <ScorecardDashboard />;
}
