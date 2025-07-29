export function getLoginPage(): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MCP Weather Server - Login</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 30px;
        }
        .login-btn {
            display: block;
            width: 100%;
            padding: 12px 20px;
            background-color: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            text-align: center;
            font-size: 16px;
            margin: 20px 0;
        }
        .login-btn:hover {
            background-color: #0056b3;
        }
        .info {
            background-color: #e7f3ff;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
        }
        .code {
            background-color: #f8f9fa;
            padding: 10px;
            border-radius: 4px;
            font-family: monospace;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🌤️ MCP Weather Server</h1>
        <div class="info">
            <p><strong>Authentication Required</strong></p>
            <p>This MCP server is protected with Auth0 OAuth. Please log in to access the weather API.</p>
        </div>
        
        <a href="/login" class="login-btn">🔐 Login with Auth0</a>
        
        <div class="info">
            <h3>API Endpoints:</h3>
            <ul>
                <li><strong>POST /mcp</strong> - MCP protocol endpoint (requires authentication)</li>
                <li><strong>GET /profile</strong> - User profile (requires authentication)</li>
                <li><strong>GET /health</strong> - Health check (public)</li>
                <li><strong>GET /logout</strong> - Logout</li>
            </ul>
        </div>
        
        <div class="info">
            <h3>Testing with MCP Inspector:</h3>
            <p>After authentication, you can test the MCP endpoint:</p>
            <div class="code">
                npm install -g @modelcontextprotocol/inspector<br>
                mcp-inspector
            </div>
            <p>Then connect to: <code>http://localhost:3000/mcp</code></p>
            <p><em>Note: You'll need to authenticate in your browser first.</em></p>
        </div>
    </div>
</body>
</html>
  `;
}

export function getProfilePage(user: any): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MCP Weather Server - Profile</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 30px;
        }
        .success {
            background-color: #d4edda;
            color: #155724;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
        }
        .user-info {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
        }
        .logout-btn {
            display: block;
            width: 100%;
            padding: 12px 20px;
            background-color: #dc3545;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            text-align: center;
            font-size: 16px;
            margin: 20px 0;
        }
        .logout-btn:hover {
            background-color: #c82333;
        }
        .code {
            background-color: #f8f9fa;
            padding: 10px;
            border-radius: 4px;
            font-family: monospace;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>✅ Authentication Successful</h1>
        
        <div class="success">
            <p><strong>Welcome!</strong> You are now authenticated and can access the MCP weather API.</p>
        </div>
        
        <div class="user-info">
            <h3>User Information:</h3>
            <p><strong>Name:</strong> ${user.displayName || 'N/A'}</p>
            <p><strong>Email:</strong> ${user.emails?.[0]?.value || 'N/A'}</p>
            <p><strong>Provider:</strong> ${user.provider || 'auth0'}</p>
            <p><strong>User ID:</strong> ${user.id || 'N/A'}</p>
        </div>
        
        <div class="user-info">
            <h3>Available Tools:</h3>
            <ul>
                <li><strong>get_forecast</strong> - Get weather forecast for a location using lat/lng coordinates</li>
                <li><strong>get_alerts</strong> - Get weather alerts for a location using lat/lng coordinates</li>
            </ul>
            
            <h3>Example UK Coordinates:</h3>
            <ul>
                <li>London: 51.5074, -0.1278</li>
                <li>Manchester: 53.4808, -2.2426</li>
                <li>Edinburgh: 55.9533, -3.1883</li>
                <li>Cardiff: 51.4816, -3.1791</li>
            </ul>
        </div>
        
        <div class="user-info">
            <h3>Testing with MCP Inspector:</h3>
            <p>You can now test the authenticated MCP endpoint:</p>
            <div class="code">
                mcp-inspector
            </div>
            <p>Connect to: <code>http://localhost:3000/mcp</code></p>
            <p><em>Make sure to keep this browser session active for authentication.</em></p>
        </div>
        
        <a href="/logout" class="logout-btn">🚪 Logout</a>
    </div>
</body>
</html>
  `;
}