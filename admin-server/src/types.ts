// Augment Express Request with the authenticated admin user.
import 'express';

declare global {
  namespace Express {
    interface Request {
      adminUser?: { id: string; email: string | null };
    }
  }
}

export {};
