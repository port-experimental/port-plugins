import "./App.css";
import { useEffect } from "react";
import { usePortPluginData } from "@port-labs/plugins-sdk/react";
import { DoraDashboard } from "./components/DoraDashboard/DoraDashboard";

export function App() {
  const { applyThemeCss } = usePortPluginData();
  useEffect(() => { applyThemeCss(); }, [applyThemeCss]);
  return <DoraDashboard />;
}
