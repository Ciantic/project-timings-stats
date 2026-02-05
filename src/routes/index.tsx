import { A } from "@solidjs/router";

export default function Home() {
    return (
        <main>
        <h1>Welcome to the Timings Stats App</h1>
        <A href="/stats">Go to Stats Table</A>
        </main>
    )
}