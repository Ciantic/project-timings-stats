import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import Nav from "./components/Nav.tsx";
import "./app.css";

export default function App() {
  return (
    <Router
      root={props => (
        <div class="app-layout">
          <Nav />
          <main class="app-content">
            <Suspense fallback={<div>App.tsx loading...</div>}>{props.children}</Suspense>
          </main>
        </div>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
