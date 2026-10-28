import { requireDeveloperId } from "../../middleware/auth.js";
import { prisma } from "../../config/prisma.js";
import { localeConfig } from "../../lib/localization.js";

export type AnalyticsPeriod = "7d" | "30d" | "90d";
export async function getSnapshot(
  developerId: string,
  period: AnalyticsPeriod = "30d",
) {
  requireDeveloperId(developerId);
  const locale = await localeConfig();
  const fr = locale.requested === "fr";
  const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
  const now = new Date(),
    start = new Date(now.getTime() - days * 86400000);
  const properties = { propertyDeveloperId: developerId, deletedAt: null };
  const appointments = { propertyDeveloperId: developerId };
  const [
    statuses,
    categories,
    stages,
    overdue,
    drafts,
    response,
    completedDays,
  ] = await Promise.all([
    prisma.property.groupBy({
      by: ["status"],
      where: properties,
      _count: true,
    }),
    prisma.property.groupBy({
      by: ["category"],
      where: properties,
      _count: true,
    }),
    prisma.appointment.groupBy({
      by: ["status"],
      where: { ...appointments, createdAt: { gte: start, lte: now } },
      _count: true,
    }),
    prisma.appointment.count({
      where: {
        ...appointments,
        status: { in: ["REQUESTED", "CONFIRMED", "RESCHEDULED"] },
        scheduledFor: { lt: now },
      },
    }),
    prisma.property.count({
      where: { ...properties, status: "DRAFT", publishedAt: null },
    }),
    prisma.$queryRaw<Array<{ hours: number | null }>>`
      SELECT avg(extract(epoch FROM (first_action.at - a.created_at))/3600)::float8 AS hours
      FROM public.appointment a
      JOIN LATERAL (SELECT min(h.created_at) AS at FROM public.appointment_history h
        WHERE h.appointment_id=a.id AND h.type<>'APPOINTMENT_REQUESTED') first_action ON first_action.at IS NOT NULL
      WHERE a.property_developer_id=${developerId} AND a.created_at>=${start} AND a.created_at<=${now}
        AND first_action.at>=a.created_at AND first_action.at<=${now}`,
    prisma.$queryRaw<Array<{ day: number; count: number }>>`
      SELECT floor(extract(epoch FROM (h.created_at-${start}::timestamptz))/86400)::int AS day, count(DISTINCT a.id)::int AS count
      FROM public.appointment a JOIN public.appointment_history h ON h.appointment_id=a.id
      WHERE a.property_developer_id=${developerId} AND a.status='COMPLETED'
        AND h.type='APPOINTMENT_COMPLETED' AND h.created_at>=${start} AND h.created_at<${now}
      GROUP BY 1 ORDER BY 1`,
  ]);
  const counts = Object.fromEntries(stages.map((s) => [s.status, s._count]));
  const count = (key: string) => counts[key] ?? 0;
  const totalRequested = stages.reduce((n, s) => n + s._count, 0);
  const responded = totalRequested - count("REQUESTED");
  const eligible =
    count("CONFIRMED") +
    count("RESCHEDULED") +
    count("COMPLETED") +
    count("NO_SHOW");
  const funnel = {
    period,
    stages: [
      "REQUESTED",
      "CONFIRMED",
      "RESCHEDULED",
      "COMPLETED",
      "CANCELLED",
      "NO_SHOW",
    ].map((status) => ({ status, count: count(status) })),
    totalRequested,
    responseRate: totalRequested ? responded / totalRequested : 0,
    completionRate: eligible ? count("COMPLETED") / eligible : 0,
    cancellationRate: totalRequested ? count("CANCELLED") / totalRequested : 0,
    noShowRate: eligible ? count("NO_SHOW") / eligible : 0,
    averageResponseHours: response[0]?.hours ?? null,
  };
  const portfolio = {
    totalListings: statuses.reduce((n, s) => n + s._count, 0),
    byStatus: statuses.map((s) => ({ status: s.status, count: s._count })),
    byCategory: categories.map((c) => ({
      category: c.category.toLowerCase(),
      count: c._count,
    })),
  };
  const actionNeeded = buildActions(overdue, drafts, 0, fr);
  if (totalRequested >= 5 && funnel.cancellationRate > 0.3)
    actionNeeded.push({
      type: "HIGH_CANCELLATION_RATE",
      severity: "high",
      title: fr ? "Taux d’annulation élevé" : "High cancellation rate",
      description: fr
        ? "Consultez les demandes annulées."
        : "Review cancelled viewing requests.",
      count: Math.round(funnel.cancellationRate * 100),
      href: "/analytics",
    });
  const trend = Array<number>(days).fill(0);
  for (const row of completedDays)
    if (row.day >= 0 && row.day < days) trend[row.day] = row.count;
  return {
    period,
    generatedAt: now.toISOString(),
    actionNeeded,
    funnel,
    portfolio,
    stats: [
      {
        key: "total_listings",
        label: fr ? "Total des annonces" : "Total Listings",
        value: portfolio.totalListings,
        format: "number",
      },
      {
        key: "active_listings",
        label: fr ? "Annonces actives" : "Active Listings",
        value: statuses.find((s) => s.status === "ACTIVE")?._count ?? 0,
        format: "number",
      },
      {
        key: "completed_viewings",
        label: fr ? "Visites effectuées" : "Completed Viewings",
        value: count("COMPLETED"),
        format: "number",
        trend,
      },
      {
        key: "response_rate",
        label: fr ? "Taux de réponse" : "Response Rate",
        value: Math.round(funnel.responseRate * 100),
        format: "percent",
      },
      {
        key: "completion_rate",
        label: fr ? "Taux de réalisation" : "Completion Rate",
        value: Math.round(funnel.completionRate * 100),
        format: "percent",
      },
      {
        key: "avg_response_time",
        label: fr ? "Délai moyen de réponse" : "Avg Response Time",
        value: Math.round((funnel.averageResponseHours ?? 0) * 10) / 10,
        format: "hours",
        ...(funnel.averageResponseHours === null
          ? {
              hint: fr ? "Aucune réponse enregistrée" : "No responses recorded",
            }
          : {}),
      },
    ],
  };
}
export function buildActions(
  overdue: number,
  drafts: number,
  requests: number,
  fr: boolean,
) {
  const items: Array<{
    type: string;
    severity: string;
    title: string;
    description: string;
    count: number;
    href: string;
  }> = [];
  if (overdue)
    items.push({
      type: "OVERDUE_APPOINTMENTS",
      severity: overdue >= 3 ? "high" : "medium",
      title: fr
        ? `${overdue} visite(s) en retard`
        : `${overdue} overdue appointment${overdue === 1 ? "" : "s"}`,
      description: fr
        ? "La date prévue de ces visites est dépassée."
        : "These appointments have passed their scheduled time.",
      count: overdue,
      href: "/appointments?timeframe=overdue",
    });
  if (drafts)
    items.push({
      type: "STALE_DRAFTS",
      severity: drafts >= 3 ? "high" : "medium",
      title: fr
        ? `${drafts} brouillon(s) non publié(s)`
        : `${drafts} unpublished draft${drafts === 1 ? "" : "s"}`,
      description: fr
        ? "Complétez ces annonces pour les publier."
        : "Complete these listings before publishing.",
      count: drafts,
      href: "/listings?status=DRAFT",
    });
  if (requests)
    items.push({
      type: "NEW_APPOINTMENT_REQUESTS",
      severity: "medium",
      title: fr
        ? `${requests} demande(s) de visite`
        : `${requests} new appointment request${requests === 1 ? "" : "s"}`,
      description: fr
        ? "Des clients attendent votre réponse."
        : "Prospective buyers and renters are waiting.",
      count: requests,
      href: "/appointments?status=REQUESTED",
    });
  return items;
}
