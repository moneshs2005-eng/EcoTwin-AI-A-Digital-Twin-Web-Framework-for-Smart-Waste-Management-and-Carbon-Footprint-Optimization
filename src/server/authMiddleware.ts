/**
 * EcoTwin AI - Authentication & Role-Based Access Control (RBAC) Middleware
 * Production-ready JWT authentication, bcrypt password hashing, and token revocation.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { UserRole } from '../types';

export const JWT_SECRET = process.env.JWT_SECRET || 'ecotwin-ai-secret-key-super-secure-token-2026';
export const BCRYPT_SALT_ROUNDS = 10;

export interface TokenPayload {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Request {
  user?: TokenPayload;
  token?: string;
}

// In-memory token revocation blacklist (persists through server runtime)
const revokedTokens = new Set<string>();

/**
 * Revokes a JWT token (e.g., on explicit logout)
 */
export function revokeToken(token: string): void {
  if (token) {
    const cleanToken = token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim();
    revokedTokens.add(cleanToken);
  }
}

/**
 * Checks if a token has been revoked
 */
export function isTokenRevoked(token: string): boolean {
  if (!token) return true;
  const cleanToken = token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim();
  return revokedTokens.has(cleanToken);
}

/**
 * Clears revoked tokens (primarily for test suite reset)
 */
export function clearRevokedTokens(): void {
  revokedTokens.clear();
}

/**
 * Securely hashes a plain-text password using salted bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters in length.');
  }
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

/**
 * Verifies a plain-text password against a stored bcrypt hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) return false;
  return bcrypt.compare(password, hash);
}

/**
 * Generates a signed JWT access token
 */
export function generateToken(
  user: { id: string; email: string; role: UserRole; name: string },
  expiresIn: string | number = '7d'
): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email.toLowerCase().trim(),
      role: user.role,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: expiresIn as any }
  );
}

/**
 * Synchronously verifies and decodes a JWT token
 */
export function verifyTokenPayload(token: string): TokenPayload {
  const cleanToken = token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim();
  if (isTokenRevoked(cleanToken)) {
    throw new Error('Token has been revoked.');
  }
  return jwt.verify(cleanToken, JWT_SECRET) as TokenPayload;
}

/**
 * Middleware: Verifies Bearer JWT token in Authorization header
 */
export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    res.status(401).json({
      success: false,
      error: 'Authentication required. Missing Authorization header.',
    });
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    res.status(401).json({
      success: false,
      error: 'Authentication format invalid. Expected "Bearer <token>".',
    });
    return;
  }

  const token = parts[1].trim();

  // Check blacklist
  if (isTokenRevoked(token)) {
    res.status(401).json({
      success: false,
      error: 'Session has been invalidated or logged out. Please sign in again.',
    });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      const isExpired = err.name === 'TokenExpiredError';
      res.status(403).json({
        success: false,
        error: isExpired
          ? 'Authentication token has expired. Please log in again.'
          : 'Invalid or forged authentication token.',
      });
      return;
    }

    req.user = decoded as TokenPayload;
    req.token = token;
    next();
  });
}

/**
 * Middleware: Optional Authentication (attaches user if valid token present, allows anonymous if not)
 */
export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return next();
  }

  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    const token = parts[1].trim();
    if (!isTokenRevoked(token)) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
        req.user = decoded;
        req.token = token;
      } catch (e) {
        // Silently ignore invalid token in optional mode
      }
    }
  }
  next();
}

/**
 * Middleware: Role-Based Access Control (RBAC)
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required.',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Permission denied. Endpoint requires role: ${allowedRoles.join(' or ')}. Current role is ${req.user.role}.`,
      });
      return;
    }

    next();
  };
}
