# check-host

Lightweight container image for showing the requester's visible IP address and checking whether a selected TCP port is reachable from the server.

## Initial Setup

### Build

```bash
docker build -t check-host .
```

### Pull

```bash
docker pull ghcr.io/ergolyam/check-host:latest
```

## Run

- With default settings:
    ```bash
    docker run --rm -it \
      -p 3000:3000 \
      check-host
    ```

- With custom listen port:
    ```bash
    docker run --rm -it \
      -p 8080:8080 \
      -e PORT=8080 \
      check-host
    ```

## Usage

- Open the browser UI:
    - http://localhost:3000

- Request the visible IP address directly from the container:
    ```bash
    curl http://localhost:3000/
    ```

- Check whether TCP port `80` on the requester is reachable from the server:
    ```bash
    curl http://localhost:3000/port/80
    ```

- The port check response is plain text:
    - `open` when the TCP connection succeeds.
    - `closed` when the port is closed, filtered, or times out.

- Port values must be integers from `1` to `65535`. Invalid port requests receive a JSON error.

### Nginx reverse proxy

- To expose check-host through Nginx, proxy requests to the container root and pass the original client address:
    ```nginx
    server {
        listen 80 default;
        server_name example.com;

        location / {
            proxy_pass http://127.0.0.1:3000/;
            proxy_set_header Host $http_host;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
    }
    ```

- With this configuration, use check-host through Nginx:
    - http://example.com/

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | HTTP listen port |
| `HOST` | `0.0.0.0` | HTTP listen address |
