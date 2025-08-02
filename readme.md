# check-host

A Python application using FastAPI to check your public IP address and verify if a specified port is open. This app provides a web interface and an API for checking the IP address and port status.

### Initial Setup

1. **Clone the repository**: Clone this repository using `git clone`.
2. **Create Virtual Env**: Create a Python Virtual Env `venv` to download the required dependencies and libraries.
3. **Download Dependencies**: Download the required dependencies into the Virtual Env `venv` using `uv`.

```shell
git clone https://github.com/ergolyam/check-host.git
cd check-host
python -m venv .venv
.venv/bin/python -m pip install uv
.venv/bin/python -m uv sync
```

### Deploy

- Run:
    ```bash
    PORT="8000" RELOAD="True" uv run main.py
    ```

#### Container

- Pull container:
    ```bash
    podman pull ghcr.io/ergolyam/check-host:latest
    ```

- Deploy in container
    ```bash
    podman run -d \
    --name check-host \
    --cap-add=NET_RAW \
    --cap-add=NET_ADMIN \
    --network host \
    -e PORT="8000" \
    ghcr.io/ergolyam/check-host:latest
    ```

#### Proxy on nginx

- Create a file /etc/nginx/sites-enabled/example.com with the lines:
    ```nginx
    server {
        listen 80 default;
        listen [::1]:80 default;
        server_name example.com;
     
        location / {
            proxy_pass http://[::1]:8000/;
            proxy_set_header Host $http_host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
    }
    ```

### Usage

- Open your web browser and navigate to http://localhost:8000

#### API Endpoints

- Get your public IP:
    ```bash
    curl http://localhost:8000/myip
    ```
    - Response:
        ```json
        {
            "ip": "your-public-ip"
        }
        ```

- Check a port's status:
    ```bash
    curl http://localhost:8000/check-port/80
    ```
    - Response
        ```json
        {
            "host": "your-public-ip",
            "port": 80,
            "status": "open/closed/filtered/error"
        }
        ```

### Features

- Display the client's public IP address.
- Check the status of a specific port (open, closed, or filtered).
- Simple and user-friendly web interface.
- API endpoints for programmatic access.

