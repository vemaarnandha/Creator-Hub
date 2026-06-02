import { Context } from "hono";

export type AuthContext = Context & {
  Variables: {
    user: {
      id: number;
      email: string;
      role: string;
      name: string;
    };
  };
};
