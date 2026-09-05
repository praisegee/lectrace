import { HashRouter, Routes, Route } from "react-router-dom";
import { TraceApp } from "./components/TraceApp";
// @ts-ignore: CSS is handled by the bundler at runtime.
import "./index.css";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<TraceApp />} />
      </Routes>
    </HashRouter>
  );
}
