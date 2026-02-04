import { createSignal } from "solid-js";
import "./app.css";
import { getDailySummaries } from "./server/api.ts";


async function testServer() {
  "use server";
  console.log("This is a server function");
  return await getDailySummaries({
    from: "2026-01-01",
    to: "2026-01-31"
  })
}

export default function App() {
  const [count, setCount] = createSignal(0);

  return (
    <main>
      <h1>Hello world!</h1>
      <button class="increment" onClick={() => setCount(count() + 1)} type="button">
        Clicks: {count()}
      </button>

      <button class="server" onClick={async () => {
        const result = await testServer();
        console.log(result);
      }} type="button">
        Call Server Function
      </button>
      <p>
        Visit{" "}
        <a href="https://start.solidjs.com" target="_blank">
          start.solidjs.com
        </a>{" "}
        to learn how to build SolidStart apps.
      </p>
    </main>
  );
}
