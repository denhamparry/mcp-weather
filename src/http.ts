import express, { Request, Response } from "express";
import session from "express-session";
import passport from "passport";
import cors from "cors";
import dotenv from "dotenv";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createWeatherServer } from "./server-tools.js";
import { configureAuth0, requireAuth, getAuthRoutes, AuthConfig } from "./auth.js";
import { getLoginPage, getProfilePage } from "./views.js";

// Load environment variables
dotenv.config();

const app = express();

// Validate required environment variables
const requiredEnvVars = [
  'AUTH0_DOMAIN',
  'AUTH0_CLIENT_ID', 
  'AUTH0_CLIENT_SECRET',
  'SESSION_SECRET'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') || []
    : true,
  credentials: true
}));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Configure Auth0
const authConfig: AuthConfig = {
  domain: process.env.AUTH0_DOMAIN!,
  clientID: process.env.AUTH0_CLIENT_ID!,
  clientSecret: process.env.AUTH0_CLIENT_SECRET!,
  callbackURL: process.env.AUTH0_CALLBACK_URL || `http://localhost:${process.env.PORT || 3000}/callback`
};

configureAuth0(authConfig);

app.use(express.json());

// Get authentication routes
const authRoutes = getAuthRoutes();

// Authentication routes
app.get('/login', (req: Request, res: Response) => {
  if (req.isAuthenticated()) {
    return res.redirect('/profile');
  }
  
  // Check if this is an API request
  if (req.headers.accept?.includes('application/json')) {
    return authRoutes.login(req, res);
  }
  
  // Show login page for browser requests
  res.send(getLoginPage());
});

// Initiate Auth0 login (for API/programmatic access)
app.get('/auth/login', authRoutes.login);

app.get('/callback', authRoutes.callback, (req: Request, res: Response) => {
  // Successful authentication, redirect to profile page
  res.redirect('/profile');
});

app.get('/logout', authRoutes.logout);

// Profile route (protected)
app.get('/profile', requireAuth, (req: Request, res: Response) => {
  const user = req.user as any;
  
  // Check if this is an API request
  if (req.headers.accept?.includes('application/json')) {
    return res.json({
      message: 'Authentication successful',
      user: {
        id: user.id,
        displayName: user.displayName,
        emails: user.emails,
        provider: user.provider
      },
      mcpEndpoint: '/mcp',
      instructions: 'You can now make authenticated requests to the /mcp endpoint'
    });
  }
  
  // Show profile page for browser requests
  res.send(getProfilePage(user));
});

// Health check endpoint (public)
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    authentication: 'Auth0 OAuth enabled'
  });
});

// Root endpoint with authentication info
app.get('/', (req: Request, res: Response) => {
  const isAuthenticated = req.isAuthenticated();
  res.json({
    message: 'MCP Weather Server with Auth0 OAuth',
    authenticated: isAuthenticated,
    endpoints: {
      login: '/login',
      logout: '/logout', 
      profile: '/profile',
      mcp: '/mcp (requires authentication)',
      health: '/health'
    },
    user: isAuthenticated ? req.user : null
  });
});

// Protected MCP endpoint
app.post("/mcp", requireAuth, async (req: Request, res: Response) => {
  try {
    // Create server instance
    const server = createWeatherServer();

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    res.on("close", () => {
      console.log("Request closed");
      transport.close();
      server.close();
    });

    await server.connect(transport);

    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("Error handling MCP request:", error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error",
        },
        id: null,
      });
    }
  }
});

const PORT = parseInt(process.env.PORT || '3000', 10);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`MCP Weather Server with Auth0 OAuth listening on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to get started`);
  console.log(`Login at http://localhost:${PORT}/login`);
});
