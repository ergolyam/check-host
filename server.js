import { createServer } from "node:http";
import { fileURLToPath } from "node:url";

import { createApp } from "./src/server/app.js";

export function getListenConfig(env = process.env) {
    const port = Number.parseInt(env.PORT || "3000", 10);
    const host = env.HOST || "0.0.0.0";

    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error("PORT must be an integer between 1 and 65535");
    }

    return { host, port };
}

export function createHttpServer(options = {}) {
    return createServer(createApp(options));
}

function shutdown(server, signal) {
    console.log(`${signal} received, shutting down`);

    const timeout = setTimeout(() => {
        console.error("Shutdown timed out, forcing exit");
        process.exit(1);
    }, 10000);
    timeout.unref();

    server.close((error) => {
        clearTimeout(timeout);

        if (error) {
            console.error(error);
            process.exit(1);
        }

        console.log("HTTP server closed");
        process.exit(0);
    });
}

function isMainModule() {
    return process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
}

if (isMainModule()) {
    const { host, port } = getListenConfig();
    const server = createHttpServer();
    let isShuttingDown = false;

    function handleShutdown(signal) {
        if (isShuttingDown) {
            console.error(`${signal} received during shutdown, forcing exit`);
            process.exit(1);
        }

        isShuttingDown = true;
        shutdown(server, signal);
    }

    process.on("SIGTERM", () => handleShutdown("SIGTERM"));
    process.on("SIGINT", () => handleShutdown("SIGINT"));

    server.listen(port, host, () => {
        console.log(`check-host listening on ${host}:${port}`);
    });
}
