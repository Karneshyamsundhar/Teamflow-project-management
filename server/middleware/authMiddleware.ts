import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "teamflow_super_secret_jwt_key_9911";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    name: string;
    email: string;
    roleId: number; // 1 = Admin, 2 = Manager, 3 = Developer
  };
}

export function authenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: "Invalid or expired token. Access denied." });
      }
      
      req.user = decoded as AuthenticatedRequest["user"];
      next();
    });
  } else {
    res.status(401).json({ error: "Authorization token missing. Please sign in." });
  }
}

export function authorizeRoles(...allowedRoles: number[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized. Please login." });
    }

    if (!allowedRoles.includes(req.user.roleId)) {
      return res.status(430).json({ 
        error: "Forbidden. Your role is not authorized to perform this action." 
      });
    }

    next();
  };
}
