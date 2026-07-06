import { Socket } from "node:net";

export const DEFAULT_PORT_CHECK_TIMEOUT_MS = 5000;

const CLOSED_ERROR_CODES = new Set([
    "ECONNREFUSED",
    "ECONNRESET",
]);

const FILTERED_ERROR_CODES = new Set([
    "ETIMEDOUT",
    "EHOSTUNREACH",
    "ENETUNREACH",
    "EADDRNOTAVAIL",
]);

export function parsePort(value) {
    let port;

    if (typeof value === "number") {
        port = value;
    } else if (typeof value === "string") {
        const trimmed = value.trim();

        if (!/^\d+$/.test(trimmed)) {
            return null;
        }

        port = Number(trimmed);
    } else {
        return null;
    }

    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        return null;
    }

    return port;
}

export function mapSocketErrorToStatus(error) {
    const code = error?.code;

    if (CLOSED_ERROR_CODES.has(code)) {
        return "closed";
    }

    if (FILTERED_ERROR_CODES.has(code)) {
        return "filtered";
    }

    return "error";
}

export async function checkPort(host, port, options = {}) {
    const parsedPort = parsePort(port);

    if (parsedPort === null) {
        return "error";
    }

    const timeoutMs = options.timeoutMs || DEFAULT_PORT_CHECK_TIMEOUT_MS;
    const createSocket = options.createSocket || (() => new Socket());

    return new Promise((resolve) => {
        let socket;
        let settled = false;

        function finish(status) {
            if (settled) {
                return;
            }

            settled = true;

            if (socket) {
                socket.destroy();
            }

            resolve(status);
        }

        try {
            socket = createSocket();
            socket.setTimeout(timeoutMs);
            socket.once("connect", () => finish("open"));
            socket.once("timeout", () => finish("filtered"));
            socket.once("error", (error) => finish(mapSocketErrorToStatus(error)));
            socket.connect({ host, port: parsedPort });
        } catch (error) {
            finish(mapSocketErrorToStatus(error));
        }
    });
}
