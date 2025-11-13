import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createSession } from './db.js';

/**
 * Hash password using bcrypt
 */
export async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

/**
 * Generate JWT token
 */
export function generateToken(userId, email) {
  const payload = {
    userId,
    email,
    iat: Math.floor(Date.now() / 1000)
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '30d' // Token expires in 30 days
  });
}

/**
 * Verify JWT token
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Create session and return token
 */
export async function createUserSession(userId, email) {
  const token = generateToken(userId, email);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await createSession(userId, token, expiresAt);

  return token;
}

/**
 * Get IP address from request
 */
export function getClientIp(req) {
  // Check various headers for IP address (Vercel uses x-forwarded-for)
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded
    ? forwarded.split(',')[0].trim()
    : req.headers['x-real-ip'] || req.connection?.remoteAddress || 'unknown';

  return ip;
}

/**
 * Validate email format
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function isValidPassword(password) {
  // At least 8 characters
  return password && password.length >= 8;
}

/**
 * Extract and verify auth token from request
 */
export function getAuthToken(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.substring(7); // Remove 'Bearer ' prefix
}

/**
 * Middleware to authenticate user from token
 */
export async function authenticateRequest(req) {
  const token = getAuthToken(req);

  if (!token) {
    return { authenticated: false, error: 'No token provided' };
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    return { authenticated: false, error: 'Invalid or expired token' };
  }

  return {
    authenticated: true,
    userId: decoded.userId,
    email: decoded.email
  };
}
