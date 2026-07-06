import { readFileSync } from "node:fs";

const INDEX_TEMPLATE = readFileSync(new URL("../client/index.html", import.meta.url), "utf8");

export function renderIndex({ ip, host, defaultPort = 80 }) {
    return INDEX_TEMPLATE
        .replaceAll("{{IP}}", escapeHtml(ip))
        .replaceAll("{{HOST}}", escapeHtml(host))
        .replaceAll("{{DEFAULT_PORT}}", escapeHtml(String(defaultPort)));
}

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}
