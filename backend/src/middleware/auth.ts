import type { Response, NextFunction } from "express";
import { getSupabase } from "../config/supabase.js";
import { databaseContext, prisma } from "../config/prisma.js";
import { ApiError, UnauthorizedError, ForbiddenError } from "../utils/errors.js";
import type { AuthenticatedRequest } from "../types/index.js";
export async function authenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) throw new UnauthorizedError();
    const { data, error } = await getSupabase().auth.getUser(header.slice(7));
    if (error && (error.status===0 || (error.status??0)>=500)) throw new ApiError(503,"Authentication unavailable","AUTH_UNAVAILABLE");
    if (error || !data.user?.email_confirmed_at)
      throw new UnauthorizedError("A verified session is required");
    const context = databaseContext.getStore();
    if (!context) throw new Error("Missing request database context");
    context.actor = { authUserId: data.user.id };
    // getUser has already validated this JWT. Parsing never substitutes for verification.
    const claims = JSON.parse(
      Buffer.from(header.slice(7).split(".")[1], "base64url").toString(),
    );
    if (
      typeof claims.session_id !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(claims.session_id)
    )
      throw new UnauthorizedError();
    const [session] = await prisma.$queryRaw<
      Array<{ active: boolean }>
    >`SELECT lumavok_private.session_active(${claims.session_id}::uuid) AS active`;
    if (!session?.active) throw new UnauthorizedError("Session has ended");
    const account = await prisma.user.findUnique({
      where: { authUserId: data.user.id },
      select: {
        id: true,
        role: true,
        developerProfile: {
          select: { id: true, sellerStatus: true, deletedAt: true },
        },
      },
    });
    if (!account) throw new UnauthorizedError("Account mapping is required");
    const developerId =
      account.role === "PROPERTY_DEVELOPER" &&
      account.developerProfile?.sellerStatus === "ACTIVE" &&
      !account.developerProfile.deletedAt
        ? account.developerProfile.id
        : undefined;
    context.actor = {
      authUserId: data.user.id,
      userId: account.id,
      role: account.role,
      developerId,
    };
    req.user = {
      userId: account.id,
      role: account.role,
      developerId,
    };
    next();
  } catch (error) {
    next(error instanceof ApiError ? error : error instanceof SyntaxError ? new UnauthorizedError("Invalid or expired session") : new ApiError(503,"Authentication temporarily unavailable","AUTH_UNAVAILABLE"));
  }
}
export function authorize(...roles: string[]) {
  return (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction,
  ): void => {
    if (!req.user) return next(new UnauthorizedError());
    if (
      !roles.includes(req.user.role) ||
      (req.user.role === "PROPERTY_DEVELOPER" && !req.user.developerId)
    )
      return next(new ForbiddenError("An active seller profile is required"));
    next();
  };
}
export function requireDeveloperId(id: unknown): asserts id is string {
  if (typeof id !== "string" || !id.trim())
    throw new ForbiddenError("An active seller profile is required");
}
