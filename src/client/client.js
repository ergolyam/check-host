(function () {
    function byId(id) {
        return document.getElementById(id);
    }

    function setCopyState(button, ok) {
        var label = ok ? "Copied" : "Copy failed";

        button.classList.remove("copy-btn--copied", "copy-btn--failed");
        void button.offsetWidth;
        button.classList.add(ok ? "copy-btn--copied" : "copy-btn--failed");
        button.textContent = label;
        clearTimeout(button.copyTimer);
        button.copyTimer = setTimeout(function () {
            button.classList.remove("copy-btn--copied", "copy-btn--failed");
            button.textContent = "Copy";
        }, 1600);
    }

    function showNotification(message, ok) {
        var notification = document.createElement("div");
        notification.className = "notification" + (ok === false ? " notification--failed" : "");
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(function () {
            notification.classList.add("notification--fade");
            notification.addEventListener("transitionend", function () {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            });
        }, 1800);
    }

    function fallbackCopy(text, done) {
        var area = document.createElement("textarea");
        area.value = text;
        area.setAttribute("readonly", "");
        area.style.position = "fixed";
        area.style.left = "-9999px";
        document.body.appendChild(area);
        area.select();

        var ok = false;
        try {
            ok = document.execCommand("copy");
        } catch (error) {
        }

        document.body.removeChild(area);
        done(ok);
    }

    function copy(text, done) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function () {
                done(true);
            }, function () {
                fallbackCopy(text, done);
            });
            return;
        }

        fallbackCopy(text, done);
    }

    function copyWithButtonState(button, text) {
        copy(text, function (ok) {
            setCopyState(button, ok);
        });
    }

    function copyIp(button) {
        copy(button.getAttribute("data-copy") || button.textContent, function (ok) {
            showNotification(ok ? "IP address copied!" : "Failed to copy IP address!", ok);
        });
    }

    function copyEndpoint(row) {
        copy(row.getAttribute("data-curl"), function (ok) {
            row.classList.remove("endpoint-row--copied", "endpoint-row--failed");
            void row.offsetWidth;
            row.classList.add(ok ? "endpoint-row--copied" : "endpoint-row--failed");
            clearTimeout(row.copyTimer);
            row.copyTimer = setTimeout(function () {
                row.classList.remove("endpoint-row--copied", "endpoint-row--failed");
            }, 1600);
        });
    }

    document.addEventListener("click", function (event) {
        var target = event.target;

        if (target.id === "ip-address") {
            copyIp(target);
            return;
        }

        var endpoint = target.closest ? target.closest(".endpoint-row") : null;

        if (endpoint) {
            copyEndpoint(endpoint);
            return;
        }

        if (!target.classList || !target.classList.contains("copy-btn")) {
            return;
        }

        var source = byId(target.getAttribute("data-target"));

        if (source) {
            copyWithButtonState(target, source.textContent);
        }
    });

    document.addEventListener("keydown", function (event) {
        var target = event.target;

        if (!target.classList || !target.classList.contains("endpoint-row")) {
            return;
        }

        if (event.key !== "Enter" && event.key !== " ") {
            return;
        }

        event.preventDefault();
        copyEndpoint(target);
    });

    var THEME_STORAGE_KEY = "check-host-theme";
    var THEME_LABELS = {
        system: "Auto",
        light: "Light",
        dark: "Dark",
    };
    var themeToggle = byId("theme-toggle");

    function isSupportedTheme(theme) {
        return theme === "system" || theme === "light" || theme === "dark";
    }

    function getStoredTheme() {
        try {
            var theme = localStorage.getItem(THEME_STORAGE_KEY);

            if (isSupportedTheme(theme)) {
                return theme;
            }
        } catch (error) {
        }

        return "system";
    }

    function setThemeButtonLabel(theme) {
        if (!themeToggle) {
            return;
        }

        var label = THEME_LABELS[theme] || THEME_LABELS.system;

        themeToggle.textContent = label;
        themeToggle.setAttribute("aria-label", "Theme: " + label);
        themeToggle.setAttribute("title", "Theme: " + label);
    }

    function applyTheme(theme) {
        if (theme === "light" || theme === "dark") {
            document.documentElement.setAttribute("data-theme", theme);
        } else {
            document.documentElement.removeAttribute("data-theme");
        }

        setThemeButtonLabel(theme);
    }

    function getNextTheme(theme) {
        if (theme === "system") {
            return "light";
        }

        if (theme === "light") {
            return "dark";
        }

        return "system";
    }

    var currentTheme = getStoredTheme();
    applyTheme(currentTheme);

    if (themeToggle) {
        themeToggle.addEventListener("click", function () {
            var nextTheme = getNextTheme(currentTheme);

            try {
                localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
            } catch (error) {
            }

            currentTheme = nextTheme;
            applyTheme(currentTheme);
        });
    }

    var form = byId("port-form");
    var portInput = byId("port");
    var checkButton = byId("check-button");
    var endpointPort = byId("endpoint-port");
    var endpointPortLabel = byId("endpoint-port-label");

    if (!form || !portInput || !checkButton) {
        return;
    }

    function setCheckButtonState(status) {
        var label = "Check";

        checkButton.classList.remove("check-btn--checking", "check-btn--open", "check-btn--closed");

        if (status === "checking") {
            label = "Checking";
            checkButton.classList.add("check-btn--checking");
        } else if (status === "open") {
            label = "Open";
            checkButton.classList.add("check-btn--open");
        } else if (status === "closed") {
            label = "Closed";
            checkButton.classList.add("check-btn--closed");
        }

        checkButton.disabled = status === "checking";
        checkButton.textContent = label;
    }

    function updateCommand(port) {
        if (!endpointPort || !endpointPortLabel) {
            return;
        }

        var curlPrefix = endpointPort.getAttribute("data-curl-prefix");

        endpointPort.setAttribute("data-curl", curlPrefix + port);
        endpointPortLabel.textContent = "GET /port/" + port;
    }

    portInput.addEventListener("input", function () {
        updateCommand(portInput.value || "80");
        setCheckButtonState("idle");
    });

    form.addEventListener("submit", function (event) {
        event.preventDefault();

        var port = portInput.value;
        updateCommand(port);
        setCheckButtonState("checking");

        fetch("/port/" + encodeURIComponent(port), {
            headers: {
                Accept: "text/plain",
            },
        }).then(function (response) {
            return response.text().then(function (body) {
                if (!response.ok) {
                    throw new Error("Port check failed");
                }

                return body.trim();
            });
        }).then(function (status) {
            setCheckButtonState(status === "open" ? "open" : "closed");
        }).catch(function () {
            setCheckButtonState("closed");
        });
    });
})();
