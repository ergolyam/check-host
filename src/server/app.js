import { readFileSync } from "node:fs";

import { getClientIp, getRequestHeader, isBrowserRequest } from "./headers.js";
import { checkPort as checkPortDefault, parsePort } from "./port-checker.js";
import { renderIndex } from "./render.js";

const ASSETS = {
    "client.js": {
        body: readFileSync(new URL("../client/client.js", import.meta.url), "utf8"),
        contentType: "application/javascript; charset=utf-8",
    },
    "styles.css": {
        body: readFileSync(new URL("../client/styles.css", import.meta.url), "utf8"),
        contentType: "text/css; charset=utf-8",
    },
};

const FAVICON = {
    body: readFileSync(new URL("../client/favicon.ico", import.meta.url)),
    contentType: "image/x-icon",
};

export function createApp(options = {}) {
    const checkPort = options.checkPort || checkPortDefault;
    const defaultPort = options.defaultPort || 80;

    return async function app(request, response) {
        try {
            await routeRequest(request, response, { checkPort, defaultPort });
        } catch (error) {
            console.error(`[check-host] Unhandled request error: ${error.message || error}`);
            sendJson(response, request, 500, { error: "Internal server error" });
        }
    };
}

async function routeRequest(request, response, options) {
    const url = new URL(request.url || "/", "http://localhost");
    const pathSegments = getPathSegments(url.pathname);

    if (pathSegments.length === 0 && allowsBodylessMethod(request)) {
        handleIndex(request, response, options.defaultPort);
        return;
    }

    if (isFavicon(pathSegments) && allowsBodylessMethod(request)) {
        send(response, request, 200, FAVICON.body, {
            "Content-Type": FAVICON.contentType,
        });
        return;
    }

    const asset = getAsset(pathSegments);

    if (asset && allowsBodylessMethod(request)) {
        send(response, request, 200, asset.body, {
            "Content-Type": asset.contentType,
        });
        return;
    }

    if (pathSegments.length === 2 && pathSegments[0] === "port" && allowsBodylessMethod(request)) {
        await handlePort(request, response, pathSegments[1], options.checkPort);
        return;
    }

    send(response, request, 404, "");
}

function handleIndex(request, response, defaultPort) {
    const ip = getClientIp(request);

    if (!isBrowserRequest(request)) {
        send(response, request, 200, `${ip}\n`, {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-store",
        });
        return;
    }

    send(response, request, 200, renderIndex({
        defaultPort,
        host: getRequestHeader(request, "Host") || "localhost",
        ip,
    }), {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
    });
}

async function handlePort(request, response, portValue, checkPort) {
    const port = parsePort(decodePathSegment(portValue));

    if (port === null) {
        sendJson(response, request, 400, { error: "Invalid port" });
        return;
    }

    const host = getClientIp(request);
    const status = await checkPort(host, port);
    const publicStatus = status === "open" ? "open" : "closed";

    send(response, request, 200, `${publicStatus}\n`, {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
    });
}

function getPathSegments(pathname) {
    return pathname.split("/").filter(Boolean);
}

function isFavicon(pathSegments) {
    return pathSegments.length === 1 && pathSegments[0] === "favicon.ico";
}

function getAsset(pathSegments) {
    if (pathSegments.length !== 2 || pathSegments[0] !== "assets") {
        return null;
    }

    return ASSETS[pathSegments[1]] || null;
}

function allowsBodylessMethod(request) {
    return request.method === "GET" || request.method === "HEAD";
}

function decodePathSegment(segment) {
    try {
        return decodeURIComponent(segment);
    } catch (error) {
        return segment;
    }
}

function sendJson(response, request, status, body, headers = {}) {
    send(response, request, status, JSON.stringify(body), {
        "Content-Type": "application/json; charset=utf-8",
        ...headers,
    });
}

function send(response, request, status, body, headers = {}) {
    const payload = Buffer.isBuffer(body) ? body : Buffer.from(body, "utf8");

    response.writeHead(status, {
        "Content-Length": String(payload.length),
        ...headers,
    });

    response.end(request.method === "HEAD" ? undefined : payload);
}
