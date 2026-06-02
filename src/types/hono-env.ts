// src/types/hono-env.ts
import type { JwtVariables } from "hono/jwt";

export interface Variables extends JwtVariables {
  user: {
    id: number;
    email: string;
    role: string;
    name: string;
    iat?: number;
    exp?: number;
  };
}