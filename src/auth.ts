import passport from 'passport';
import { Strategy as Auth0Strategy } from 'passport-auth0';
import { Request, Response, NextFunction } from 'express';

export interface AuthConfig {
  domain: string;
  clientID: string;
  clientSecret: string;
  callbackURL: string;
}

export interface User {
  id: string;
  displayName: string;
  emails: Array<{ value: string }>;
  provider: string;
}

export function configureAuth0(config: AuthConfig) {
  const strategy = new Auth0Strategy(
    {
      domain: config.domain,
      clientID: config.clientID,
      clientSecret: config.clientSecret,
      callbackURL: config.callbackURL,
    },
    (accessToken: string, refreshToken: string, extraParams: any, profile: any, done: any) => {
      // In a real application, you might want to save the user to a database
      // For this example, we'll just pass the profile through
      return done(null, profile);
    }
  );

  passport.use(strategy);

  passport.serializeUser((user: any, done) => {
    done(null, user);
  });

  passport.deserializeUser((user: any, done) => {
    done(null, user);
  });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  
  // For API requests, return JSON error
  if (req.path === '/mcp' || req.headers.accept?.includes('application/json')) {
    return res.status(401).json({
      jsonrpc: "2.0",
      error: {
        code: -32001,
        message: "Authentication required. Please authenticate via /login",
      },
      id: null,
    });
  }
  
  // For browser requests, redirect to login
  res.redirect('/login');
}

export function getAuthRoutes() {
  return {
    // Initiate Auth0 login
    login: passport.authenticate('auth0', {
      scope: 'openid email profile'
    }),
    
    // Handle Auth0 callback
    callback: passport.authenticate('auth0', {
      failureRedirect: '/login'
    }),
    
    // Logout
    logout: (req: Request, res: Response) => {
      req.logout((err) => {
        if (err) {
          console.error('Logout error:', err);
        }
        
        const returnTo = encodeURIComponent(`${req.protocol}://${req.get('host')}/`);
        const logoutURL = `https://${process.env.AUTH0_DOMAIN}/v2/logout?returnTo=${returnTo}&client_id=${process.env.AUTH0_CLIENT_ID}`;
        
        res.redirect(logoutURL);
      });
    }
  };
}