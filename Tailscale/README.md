# Tailscale Configuration

This directory contains configuration files for Tailscale integration with the
MCP Weather server.

## Files

### config/serve.json

This file configures Tailscale's serve functionality to expose the MCP Weather
HTTP server. It defines:

- **TCP Configuration**: Enables HTTPS on port 443
- **Web Handlers**: Proxies requests from `${TS_CERT_DOMAIN}:443` to the local
  HTTP server on port 3000
- **Funnel Settings**: Disables funnel (external internet access) for security

The configuration allows the MCP Weather server running on port 3000 to be
securely accessible through Tailscale's network with automatic HTTPS
certificates.

## Usage

This configuration is used by:

- Docker Compose setup via volume mount to `/config/serve.json`

The `${TS_CERT_DOMAIN}` variable is automatically resolved by Tailscale based on
your node's name and tailnet domain.
