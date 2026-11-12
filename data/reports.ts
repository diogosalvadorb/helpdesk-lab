import "server-only";

import { notFound } from "next/navigation";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { reportingPeriod, ReportLimitError } from "@/lib/reporting";
import { operationScope } from "@/lib/support-access";

import { getPortalContext } from "./portal-context";
import { calculateReport } from "./report-store";

export async function getReportContext(
  raw: Record<string, string | string[] | undefined>,
  operation: boolean,
) {
  const context = await getPortalContext(),
    period = reportingPeriod(raw);
  let scope: Prisma.TicketWhereInput | null = context.scope;
  const companies = operation
    ? await prisma.company.findMany({
        where: {
          status: "ACTIVE",
          ...(context.user.role === "ADMIN"
            ? {}
            : {
                tickets: {
                  some: operationScope(context.user) ?? { id: { in: [] } },
                },
              }),
        },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })
    : [];
  let message = period.error;
  if (operation) {
    scope = operationScope(context.user);
    if (!scope) notFound();
    if (context.user.role === "ADMIN" && !period.filters.company)
      message =
        "Selecione uma empresa ou confirme o escopo de todas as empresas.";
    if (
      period.filters.company &&
      period.filters.company !== "all" &&
      !companies.some((c) => c.id === period.filters.company)
    )
      message = "Empresa indisponível para este relatório.";
    if (context.user.role !== "ADMIN" && period.filters.company === "all")
      message = "O escopo global é exclusivo de administradores globais.";
  } else {
    if (!context.company)
      message = "Selecione uma empresa ativa para consultar seus indicadores.";
    if (
      period.filters.company &&
      period.filters.company !== context.company?.id
    )
      message =
        "A empresa selecionada mudou. Abra o relatório novamente pelo menu.";
    period.filters.company = context.company?.id ?? "";
  }
  const filters: Prisma.TicketWhereInput = {
    ...(period.filters.company && period.filters.company !== "all"
      ? { companyId: period.filters.company }
      : {}),
    ...(period.filters.priority ? { priority: period.filters.priority } : {}),
    ...(period.filters.level ? { level: period.filters.level } : {}),
    ...(period.filters.department
      ? { departmentId: period.filters.department }
      : {}),
  };
  return {
    user: context.user,
    scope: { AND: [scope, filters] } as Prisma.TicketWhereInput,
    period,
    companies,
    message,
    operation,
    ownOnly:
      !operation &&
      context.user.role === "CLIENT" &&
      !context.canManageDepartments,
    companyName: operation
      ? period.filters.company === "all"
        ? "Todas as empresas ativas"
        : (companies.find((c) => c.id === period.filters.company)?.name ??
          "Escopo da equipe")
      : (context.company?.name ?? "Empresa não selecionada"),
  };
}
export async function getReport(
  raw: Record<string, string | string[] | undefined>,
  operation: boolean,
) {
  const context = await getReportContext(raw, operation);
  try {
    return {
      ...context,
      data: context.message
        ? null
        : await calculateReport(context.scope, context.period, operation),
    };
  } catch (error) {
    if (error instanceof ReportLimitError)
      return { ...context, message: error.message, data: null };
    throw error;
  }
}
