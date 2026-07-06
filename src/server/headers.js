export function getRequestHeader(request, name) {
    const value = request.headers[name.toLowerCase()];

    if (Array.isArray(value)) {
        return value.join(", ");
    }

    return value === undefined ? "" : String(value);
}

export function isBrowserRequest(request) {
    const accept = getRequestHeader(request, "Accept").toLowerCase();
    const userAgent = getRequestHeader(request, "User-Agent").toLowerCase();

    return accept.includes("text/html") &&
        /\b(mozilla|chrome|chromium|safari|firefox|edg|opr)\b/.test(userAgent);
}

export function normalizeIp(value) {
    const ip = String(value || "").trim();
    const mappedPrefix = "::ffff:";

    if (ip.toLowerCase().startsWith(mappedPrefix)) {
        return ip.slice(mappedPrefix.length);
    }

    return ip;
}

export function getClientIp(request) {
    const forwardedFor = getRequestHeader(request, "X-Forwarded-For");
    const ip = forwardedFor === ""
        ? request.socket?.remoteAddress || ""
        : forwardedFor.split(",")[0].trim();

    return normalizeIp(ip);
}
