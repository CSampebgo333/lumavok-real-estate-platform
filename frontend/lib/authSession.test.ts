import { expect, it } from "vitest";
import { mapSession } from "./authSession";
import type { AuthSession } from "@/services/auth.service";
it("normalizes a legacy nullable name for dashboard display without changing account authority", () => {
  const raw = {
    user: {
      id: "u1",
      email: "seller@example.test",
      fullName: null,
      role: "PROPERTY_DEVELOPER",
      developerId: "dev1",
    },
    accessToken: "fixture",
  } as unknown as AuthSession;
  const session = mapSession(raw);
  expect(session.user.fullName).toBe("seller@example.test");
  expect(session.user.role).toBe("DEVELOPER");
  expect(session.user.id).toBe("u1");
  expect(session.user.developerId).toBe("dev1");
});
