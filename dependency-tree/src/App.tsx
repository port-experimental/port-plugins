import "./App.css";
import { useEffect } from "react";
import { usePortPluginData } from "@port-labs/plugins-sdk/react";
import { DependencyTree } from "./components/DependencyTree/DependencyTree";

export function App() {
  const { applyThemeCss } = usePortPluginData();
  useEffect(() => { applyThemeCss(); }, [applyThemeCss]);
  return <DependencyTree />;
}
