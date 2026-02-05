// @refresh reload
import { mount, StartClient } from "@solidjs/start/client";
import { keepAlive } from "./server/api.ts";

mount(() => {
    setInterval(async () => {
        try {
            await keepAlive();
        } catch (error) {
            console.error("Error keeping server alive:", error);
        }
    }, 10 * 1000); // Every 10 seconds
    return <StartClient />
}, document.getElementById("app")!);
