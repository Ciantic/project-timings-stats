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


// import { createSignal } from "solid-js";
// import "./app.css";


// export default function App() {
//   const [count, setCount] = createSignal(0);

//   return (
//     <main>
//     <nav class="bg-sky-800">
//       <ul class="container flex items-center p-3 text-gray-200">
//         <li class={`border-b-2 mx-1.5 sm:mx-6`}>
//           <a href="/">Home</a>
//         </li>
//         <li class={`border-b-2 mx-1.5 sm:mx-6`}>
//           <a href="/about">About</a>
//         </li>
//       </ul>
//     </nav>
//       <h1>Hello world!</h1>
//       <button class="increment" onClick={() => setCount(count() + 1)} type="button">
//         Clicks: {count()}
//       </button>

//       <button class="server" onClick={async () => {
//         const result = await testServer();
//         console.log(result);
//       }} type="button">
//         Call Server Function
//       </button>
//       <p>
//         Visit{" "}
//         <a href="https://start.solidjs.com" target="_blank">
//           start.solidjs.com
//         </a>{" "}
//         to learn how to build SolidStart apps.
//       </p>
//     </main>
//   );
// }
