import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
import { verifyToken, TOKEN_COOKIE, type JWTPayload } from "../lib/auth/jwt";

export const authMiddleware = createMiddleware<{
  Variables: {
    user: JWTPayload;
  };
}>(async (c, next) => {
  const token = getCookie(c, TOKEN_COOKIE) || c.req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return c.json({ error: "Session expired" }, 401);
  }

  c.set("user", payload);
  await next();
});
