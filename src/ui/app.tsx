import { HashRouter, Route } from "@solidjs/router";
import { createSignal, onMount, Show, Suspense } from "solid-js";
import Nav from "./components/Nav.tsx";
import "./app.css";
import { isServer } from "solid-js/web";
import { api } from "./client.ts";
import StatsPage from "./routes/stats.tsx";
import HomePage from "./routes/index.tsx";

export default function App() {
  const [alive, setAlive] = createSignal(true);

  onMount(() => {
    if (!isServer) {
      setInterval(async () => {
        try {
          await api.keepAlive.mutate();
        } catch (error) {
          setAlive(false);
          console.error("Error keeping server alive:", error);
        }
      }, 10 * 1000);
    }
  });

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <HashRouter
      root={(props) => (
        <>
          <div
            class="app-layout"
            style={{
              opacity: !alive() ? 0.5 : 1,
              "pointer-events": !alive() ? "none" : "auto",
            }}
          >
            <Nav />
            <main class="app-content">
              <Suspense fallback={<div>App.tsx loading...</div>}>
                {props.children}
              </Suspense>
            </main>
          </div>

          <Show when={!alive()}>
            <dialog class="modal modal-open">
              <div class="modal-box">
                <h3 class="font-bold text-lg">Server Connection Lost</h3>
                <p class="py-4">
                  The connection to the server has been lost. Please refresh the
                  page to reconnect.
                </p>
                <div class="modal-action">
                  <button class="btn btn-primary" onClick={handleRefresh}>
                    Refresh
                  </button>
                </div>
              </div>
            </dialog>
          </Show>
        </>
      )}
    >
      <Route path="/" component={HomePage} />
      <Route path="/stats" component={StatsPage} />
    </HashRouter>
  );
}
