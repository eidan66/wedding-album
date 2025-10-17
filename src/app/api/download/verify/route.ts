import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// Access code stored server-side for security
const ACCESS_CODE = "IDANSAPIR19941993";

// Rate limiting configuration
const MAX_ATTEMPTS = 5; // Maximum attempts per IP
const INITIAL_COOLDOWN = 1000; // 1 second initial cooldown
const MAX_COOLDOWN = 300000; // 5 minutes maximum cooldown

// In-memory storage for rate limiting (in production, use Redis or database)
const attemptTracker = new Map<string, { attempts: number; lastAttempt: number; cooldown: number }>();

// In-memory storage for valid sessions (in production, use JWT tokens or database)
const validSessions = new Map<string, { accessTime: number; ip: string }>();

function getClientIP(request: NextRequest): string {
  // Get real IP from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  // Fallback to connection remote address
  return 'unknown';
}

function calculateCooldown(attempts: number): number {
  // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 32s, 64s, 128s, 256s, 300s (max)
  const cooldown = Math.min(INITIAL_COOLDOWN * Math.pow(2, attempts - 1), MAX_COOLDOWN);
  return cooldown;
}

function isRateLimited(clientIP: string): { blocked: boolean; remainingTime: number; attempts: number } {
  const tracker = attemptTracker.get(clientIP);
  
  if (!tracker) {
    return { blocked: false, remainingTime: 0, attempts: 0 };
  }
  
  const now = Date.now();
  const timeSinceLastAttempt = now - tracker.lastAttempt;
  
  // If still in cooldown period
  if (timeSinceLastAttempt < tracker.cooldown) {
    return { 
      blocked: true, 
      remainingTime: tracker.cooldown - timeSinceLastAttempt,
      attempts: tracker.attempts 
    };
  }
  
  // If exceeded max attempts, apply longer cooldown
  if (tracker.attempts >= MAX_ATTEMPTS) {
    const extendedCooldown = MAX_COOLDOWN;
    if (timeSinceLastAttempt < extendedCooldown) {
      return { 
        blocked: true, 
        remainingTime: extendedCooldown - timeSinceLastAttempt,
        attempts: tracker.attempts 
      };
    }
    // Reset after extended cooldown
    attemptTracker.delete(clientIP);
    return { blocked: false, remainingTime: 0, attempts: 0 };
  }
  
  return { blocked: false, remainingTime: 0, attempts: tracker.attempts };
}

function updateAttemptTracker(clientIP: string, success: boolean): void {
  const tracker = attemptTracker.get(clientIP);
  const now = Date.now();
  
  if (success) {
    // Reset on successful attempt
    attemptTracker.delete(clientIP);
    return;
  }
  
  if (!tracker) {
    // First failed attempt
    attemptTracker.set(clientIP, {
      attempts: 1,
      lastAttempt: now,
      cooldown: INITIAL_COOLDOWN
    });
  } else {
    // Increment failed attempts
    const newAttempts = tracker.attempts + 1;
    const newCooldown = calculateCooldown(newAttempts);
    
    attemptTracker.set(clientIP, {
      attempts: newAttempts,
      lastAttempt: now,
      cooldown: newCooldown
    });
  }
}

function createSession(clientIP: string): string {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  validSessions.set(sessionId, {
    accessTime: Date.now(),
    ip: clientIP
  });
  
  // Clean up old sessions (older than 1 hour)
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  for (const [id, session] of validSessions.entries()) {
    if (session.accessTime < oneHourAgo) {
      validSessions.delete(id);
    }
  }
  
  return sessionId;
}

export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    
    // Check rate limiting first
    const rateLimitCheck = isRateLimited(clientIP);
    if (rateLimitCheck.blocked) {
      const remainingMinutes = Math.ceil(rateLimitCheck.remainingTime / 60000);
      const remainingSeconds = Math.ceil(rateLimitCheck.remainingTime / 1000);
      
      let timeMessage = '';
      if (remainingMinutes > 1) {
        timeMessage = `${remainingMinutes} דקות`;
      } else {
        timeMessage = `${remainingSeconds} שניות`;
      }
      
      return NextResponse.json(
        { 
          error: `יותר מדי ניסיונות כושלים. אנא המתן ${timeMessage} לפני ניסיון נוסף.`,
          attempts: rateLimitCheck.attempts,
          remainingTime: rateLimitCheck.remainingTime
        },
        { status: 429 } // Too Many Requests
      );
    }
    
    const { accessCode } = await request.json();

    if (!accessCode || typeof accessCode !== 'string' || accessCode.trim() === '') {
      updateAttemptTracker(clientIP, false);
      return NextResponse.json(
        { error: 'קוד גישה נדרש' },
        { status: 400 }
      );
    }

    // Check if enough time has passed since the wedding (25 hours)
    const weddingDate = new Date('2025-10-20T20:00:00+03:00');
    const downloadDate = new Date(weddingDate.getTime() + (25 * 60 * 60 * 1000));
    const now = new Date();

    if (now < downloadDate) {
      updateAttemptTracker(clientIP, false);
      return NextResponse.json(
        { error: 'עדיין לא הגיע הזמן להורדה. כפתור זה יהיה זמין רק אחרי 25 שעות מהאירוע.' },
        { status: 403 }
      );
    }

    // Verify access code - exact match only
    if (accessCode === ACCESS_CODE) {
      updateAttemptTracker(clientIP, true);
      
      // Create session for this user
      const sessionId = createSession(clientIP);
      
      // Log successful access for monitoring
      logger.info('Successful access verification', {
        clientIP,
        sessionId,
        userAgent: request.headers.get('user-agent') ?? undefined,
        timestamp: new Date().toISOString(),
      });
      
      return NextResponse.json(
        { 
          success: true, 
          message: 'קוד גישה תקין',
          sessionId: sessionId
        },
        { status: 200 }
      );
    } else {
      updateAttemptTracker(clientIP, false);
      
      // Log failed attempts for monitoring
      const tracker = attemptTracker.get(clientIP);
      logger.warn('Failed access attempt', {
        clientIP,
        attempts: tracker?.attempts || 1,
        userAgent: request.headers.get('user-agent') ?? undefined,
        timestamp: new Date().toISOString(),
      });
      
      // If this is a suspicious number of attempts, log it prominently
      if (tracker && tracker.attempts >= 3) {
        logger.securityEvent('Suspicious access attempts detected', {
          clientIP,
          attempts: tracker.attempts,
          userAgent: request.headers.get('user-agent') ?? undefined,
          timestamp: new Date().toISOString(),
        });
      }
      
      return NextResponse.json(
        { error: 'קוד גישה שגוי. אנא נסה שוב.' },
        { status: 401 }
      );
    }

  } catch (error) {
    logger.error('Verification error', error instanceof Error ? error : new Error(String(error)), {
      clientIP: getClientIP(request),
      userAgent: request.headers.get('user-agent') ?? undefined,
      timestamp: new Date().toISOString(),
    });
    
    return NextResponse.json(
      { error: 'שגיאה בבדיקת הקוד' },
      { status: 500 }
    );
  }
}
