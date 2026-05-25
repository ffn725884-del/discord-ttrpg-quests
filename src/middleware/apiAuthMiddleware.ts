import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface ApiTokenPayload {
  userId: string;
  guildId: string;
  channelId: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      apiToken?: ApiTokenPayload;
    }
  }
}

export function apiAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }

  const token = authHeader.slice(7);
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ error: "Server misconfiguration" });
    return;
  }

  try {
    const payload = jwt.verify(token, secret) as ApiTokenPayload & jwt.JwtPayload;
    req.apiToken = {
      userId: payload.userId,
      guildId: payload.guildId,
      channelId: payload.channelId,
    };
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
