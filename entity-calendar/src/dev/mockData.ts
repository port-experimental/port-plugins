import type { PortEntity } from "../types";

export const MOCK_USER_EMAIL = "developer@example.com";

export const MOCK_BLUEPRINT = {
  identifier: "service",
  title: "Service",
};

/** Sample entities with dates in the current month for local calendar preview. */
export const MOCK_ENTITIES: PortEntity[] = (() => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const day = (d: number) =>
    new Date(y, m, d, 12, 0, 0).toISOString();
  return [
    {
      identifier: "payments-api",
      title: "Payments API",
      blueprint: "service",
      createdAt: day(3),
    },
    {
      identifier: "auth-service",
      title: "Auth Service",
      blueprint: "service",
      createdAt: day(3),
    },
    {
      identifier: "notifications",
      title: "Notifications",
      blueprint: "service",
      createdAt: day(14),
    },
  ];
})();
