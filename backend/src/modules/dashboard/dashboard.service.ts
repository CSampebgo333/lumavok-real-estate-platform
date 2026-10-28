import { localeConfig } from "../../lib/localization.js";
import {
  mapProperty,
  propertyInclude,
} from "../properties/property.service.js";
import {
  appointmentInclude,
  mapAppointment,
  historyMessage,
} from "../appointments/appointment.service.js";
import { mapNotification } from "../notifications/notification.service.js";
import { buildActions } from "../analytics/analytics.service.js";
import { requireDeveloperId } from "../../middleware/auth.js";
import { prisma } from "../../config/prisma.js";
import { NotFoundError } from "../../utils/errors.js";

export async function getDashboard(developerId: string) {
  requireDeveloperId(developerId);
  const locale = await localeConfig();
  const where = { propertyDeveloperId: developerId };
  const props = { ...where, deletedAt: null };
  const previews = (status: "CONFIRMED" | "REQUESTED" | "COMPLETED") =>
    prisma.appointment.findMany({
      where: {
        ...where,
        ...(status === "CONFIRMED"
          ? {
              status: { in: ["CONFIRMED", "RESCHEDULED"] },
              scheduledFor: { gte: new Date() },
            }
          : { status }),
      },
      orderBy: [
        { scheduledFor: status === "COMPLETED" ? "desc" : "asc" },
        { id: "asc" },
      ],
      take: 5,
      include: appointmentInclude,
    });
  const [
    developer,
    counts,
    listings,
    upcoming,
    requested,
    completed,
    requestCount,
    overdue,
    notifications,
    unreadCount,
    history,
  ] = await Promise.all([
    prisma.propertyDeveloper.findUnique({
      where: { id: developerId },
      select: { businessName: true, user: { select: { fullName: true } } },
    }),
    prisma.property.groupBy({ by: ["status"], where: props, _count: true }),
    prisma.property.findMany({
      where: props,
      orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
      take: 5,
      include: propertyInclude,
    }),
    previews("CONFIRMED"),
    previews("REQUESTED"),
    previews("COMPLETED"),
    prisma.appointment.count({ where: { ...where, status: "REQUESTED" } }),
    prisma.appointment.count({
      where: {
        ...where,
        status: { in: ["REQUESTED", "CONFIRMED", "RESCHEDULED"] },
        scheduledFor: { lt: new Date() },
      },
    }),
    prisma.notification.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      take: 5,
    }),
    prisma.notification.count({ where: { ...where, status: "UNREAD" } }),
    prisma.appointmentHistory.findMany({
      where: { appointment: where },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      take: 6,
    }),
  ]);
  if (!developer) throw new NotFoundError("Developer not found");
  const drafts = counts.find((c) => c.status === "DRAFT")?._count ?? 0;
  return {
    summary: {
      developerName: developer.user.fullName ?? developer.businessName ?? "",
      companyName: developer.businessName ?? developer.user.fullName ?? "",
    },
    metrics: {
      totalProperties: counts.reduce((n, c) => n + c._count, 0),
      activeListings: counts.find((c) => c.status === "ACTIVE")?._count ?? 0,
      draftListings: drafts,
      appointmentRequests: requestCount,
      unreadNotifications: unreadCount,
    },
    recentListings: await Promise.all(
      listings.map((p) => mapProperty(p, locale, false, true)),
    ),
    appointmentOverview: {
      upcoming: upcoming.map((a) => mapAppointment(a, locale)),
      requested: requested.map((a) => mapAppointment(a, locale)),
      completed: completed.map((a) => mapAppointment(a, locale)),
    },
    actionNeeded: buildActions(
      overdue,
      drafts,
      requestCount,
      locale.requested === "fr",
    ),
    recentNotifications: notifications.map((n) =>
      mapNotification(n, locale.requested),
    ),
    recentActivity: history.map((h) => ({
      id: h.id,
      type: h.type,
      message: historyMessage(h.type, h.message, locale.requested),
      timestamp: h.createdAt.toISOString(),
    })),
  };
}
