import "./App.css";
import { useEffect } from "react";
import { usePortPluginData } from "@port-labs/plugins-sdk/react";
import { EntityCatalogue } from "./components/EntityCatalogue/EntityCatalogue";

export function App() {
  const { applyThemeCss } = usePortPluginData();
  useEffect(() => { applyThemeCss(); }, [applyThemeCss]);
  return <EntityCatalogue />;
}
