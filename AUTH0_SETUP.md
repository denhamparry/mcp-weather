# Auth0 OAuth Setup Guide

This guide will help you set up Auth0 OAuth authentication for the MCP Weather Server.

## Prerequisites

1. An Auth0 account (free tier available at [auth0.com](https://auth0.com))
2. Node.js and npm installed
3. The MCP Weather Server project

## Auth0 Configuration

### Step 1: Create an Auth0 Application

1. Log in to your Auth0 Dashboard
2. Go to **Applications** > **Applications**
3. Click **Create Application**
4. Choose:
   - **Name**: `MCP Weather Server`
   - **Application Type**: `Regular Web Applications`
5. Click **Create**

### Step 2: Configure Application Settings

In your Auth0 application settings:

1. **Allowed Callback URLs**:
   ```
   http://localhost:3000/callback
   ```

2. **Allowed Logout URLs**:
   ```
   http://localhost:3000/
   ```

3. **Allowed Web Origins**:
   ```
   http://localhost:3000
   ```

4. **Allowed Origins (CORS)**:
   ```
   http://localhost:3000
   ```

5. Save the changes

### Step 3: Get Your Credentials

From the **Settings** tab of your Auth0 application, copy:
- **Domain** (e.g., `your-tenant.auth0.com`)
- **Client ID**
- **Client Secret**

## Environment Configuration

### Step 1: Create Environment File

Copy the example environment file:
```bash
cp .env.example .env
```

### Step 2: Configure Environment Variables

Edit the `.env` file with your Auth0 credentials:

```env
# OpenWeatherMap API Key
OPENWEATHER_API_KEY=your_openweather_api_key_here

# Auth0 Configuration
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=your_auth0_client_id
AUTH0_CLIENT_SECRET=your_auth0_client_secret
AUTH0_CALLBACK_URL=http://localhost:3000/callback

# Session Secret (generate a random string)
SESSION_SECRET=your_random_session_secret_here

# Server Configuration
PORT=3000
NODE_ENV=development
```

**Important**: 
- Replace `your-tenant.auth0.com` with your actual Auth0 domain
- Replace the client ID and secret with your actual values
- Generate a strong random string for `SESSION_SECRET`

## Running the Server

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Build the Project
```bash
npm run build
```

### Step 3: Start the Server
```bash
node build/http.js
```

The server will start on `http://localhost:3000`

## Testing the Authentication

### Browser Testing

1. Open `http://localhost:3000` in your browser
2. Click **Login with Auth0**
3. Complete the Auth0 login process
4. You'll be redirected to your profile page
5. The `/mcp` endpoint is now accessible for authenticated requests

### API Testing

For programmatic access:

1. **Check server status**:
   ```bash
   curl http://localhost:3000/health
   ```

2. **Try accessing protected endpoint** (should fail):
   ```bash
   curl -X POST http://localhost:3000/mcp \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc": "2.0", "method": "tools/list", "id": 1}'
   ```

3. **Authenticate via browser first**, then use the same session for API calls

### MCP Inspector Testing

1. Install MCP Inspector:
   ```bash
   npm install -g @modelcontextprotocol/inspector
   ```

2. Authenticate in your browser first by visiting `http://localhost:3000/login`

3. Start MCP Inspector:
   ```bash
   mcp-inspector
   ```

4. Connect to `http://localhost:3000/mcp`

**Note**: The MCP Inspector will use your browser's session cookies for authentication.

## Available Endpoints

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/` | GET | No | Server info and authentication status |
| `/login` | GET | No | Login page or initiate Auth0 login |
| `/auth/login` | GET | No | Direct Auth0 login (for API clients) |
| `/callback` | GET | No | Auth0 callback handler |
| `/logout` | GET | No | Logout and redirect to Auth0 logout |
| `/profile` | GET | Yes | User profile information |
| `/mcp` | POST | Yes | MCP protocol endpoint |
| `/health` | GET | No | Health check |

## Security Features

- **Session-based authentication** using Express sessions
- **CSRF protection** through Auth0's state parameter
- **Secure cookies** in production mode
- **CORS configuration** for cross-origin requests
- **Environment variable validation** on startup

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production`
2. Use HTTPS URLs in Auth0 configuration
3. Set `ALLOWED_ORIGINS` environment variable
4. Use a secure session secret
5. Configure proper CORS origins

Example production environment variables:
```env
NODE_ENV=production
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
AUTH0_CALLBACK_URL=https://your-domain.com/callback
SESSION_SECRET=your_very_secure_random_string
ALLOWED_ORIGINS=https://your-domain.com,https://api.your-domain.com
PORT=3000
```

## Troubleshooting

### Common Issues

1. **"Missing required environment variable"**
   - Ensure all required environment variables are set in `.env`
   - Check that `.env` file is in the project root

2. **Auth0 callback errors**
   - Verify callback URL matches exactly in Auth0 settings
   - Check that the domain and client credentials are correct

3. **Session issues**
   - Ensure `SESSION_SECRET` is set and sufficiently random
   - Check that cookies are enabled in your browser

4. **CORS errors**
   - Verify `Allowed Origins (CORS)` in Auth0 settings
   - Check CORS configuration in the server

### Debug Mode

To enable debug logging, set:
```env
DEBUG=express-session,passport*
```

This will provide detailed logs for session and passport operations.

## Support

For issues specific to this implementation, please check:
1. The server logs for error messages
2. Your Auth0 application logs in the Auth0 Dashboard
3. Browser developer tools for client-side errors

For Auth0-specific issues, refer to the [Auth0 Documentation](https://auth0.com/docs).