import Link from "next/link";

import { Card } from "@/components/ui/card";
import {
  getAdministrativeCompany,
  getAdministrativeCompanyContract,
  getAdministrativeList,
} from "@/data/administration";

import { AdministrationEditor } from "../../../_components/administration-editor";
import { AdministrationList } from "../../../_components/administration-list";
export default async function CompanyPage({
  params,
  searchParams,
}: {
  params: Promise<{ companyId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { companyId } = await params,
    query = await searchParams;
  const company = await getAdministrativeCompany(companyId);
  const contract = await getAdministrativeCompanyContract(companyId);
  const data = await getAdministrativeList("member", query, false, companyId);
  return (
    <>
      <div className="portal-heading">
        <div>
          <p className="portal-eyebrow">Empresa e contrato</p>
          <h1>{company.name}</h1>
          <p>
            {company.legalName || "Cadastro da empresa"} ·{" "}
            {company.taxId || "Documento não informado"}
          </p>
        </div>
        <AdministrationEditor
          entity="company"
          options={data.options}
          initial={{
            entity: "company",
            id: company.id,
            version: company.updatedAt.toISOString(),
            name: company.name,
            legalName: company.legalName || "",
            taxId: company.taxId || "",
            contactName: company.contactName || "",
            contactEmail: company.contactEmail || "",
            contactPhone: company.contactPhone || "",
            internalNotes: company.internalNotes || "",
            status: company.status,
          }}
        />
      </div>
      <div className="portal-admin-summary">
        {[
          ["Usuários", company._count.members],
          ["Departamentos", company._count.departments],
          ["Contratos", company._count.contracts],
          ["Chamados ativos", company._count.tickets],
        ].map(([label, value]) => (
          <Card className="portal-panel" key={label}>
            <p>{label}</p>
            <b>{value}</b>
          </Card>
        ))}
      </div>
      <nav className="portal-queue-tabs" aria-label="Cadastros da empresa">
        <Link href={`/operacao/contratos?company=${companyId}`}>
          Contratos e SLA
        </Link>
        <Link href={`/operacao/departamentos?company=${companyId}`}>
          Departamentos
        </Link>
      </nav>
      <div className="portal-admin-company-grid">
        <Card className="portal-panel portal-admin-contact">
          <h2>Contato e contexto</h2>
          <p>
            {company.contactName || "Contato não informado"} ·{" "}
            {company.contactEmail || "Sem e-mail"} ·{" "}
            {company.contactPhone || "Sem telefone"}
          </p>
          <p>
            Estado:{" "}
            {company.status === "ACTIVE"
              ? "Ativa"
              : company.status === "SUSPENDED"
                ? "Suspensa"
                : "Arquivada"}
          </p>
          {company.internalNotes && (
            <p>Notas internas: {company.internalNotes}</p>
          )}
        </Card>
        <Card className="portal-panel portal-admin-agreement">
          <p className="portal-eyebrow">Contrato de atendimento</p>
          <h2>{contract?.name || "Sem contrato vigente"}</h2>
          {contract ? (
            <>
              <p>
                {contract.number} · {contract.policy}
              </p>
              <p>Vigência até {contract.endsAt || "prazo indeterminado"}</p>
              <p>Meta de cumprimento: {contract.goal}%</p>
              <p>
                Primeira resposta: {contract.firstResponse ?? "—"} minutos úteis
              </p>
              <p>Resolução: {contract.resolution ?? "—"} minutos úteis</p>
              <small>Metas para prioridade média · {contract.calendar}</small>
            </>
          ) : (
            <p>
              Cadastre um contrato ativo com vigência válida e uma política
              ativa.
            </p>
          )}
          <Link href={`/operacao/contratos?company=${companyId}`}>
            Gerenciar contratos →
          </Link>
        </Card>
      </div>
      <div className="portal-heading">
        <div>
          <h2>Usuários vinculados</h2>
          <p>Aprove solicitações e defina os acessos desta empresa.</p>
        </div>
        <AdministrationEditor
          entity="member"
          options={{
            ...data.options,
            companies: [{ id: company.id, name: company.name }],
          }}
          companyId={companyId}
        />
      </div>
      <AdministrationList
        data={data}
        path={`/operacao/empresas/${companyId}`}
      />
    </>
  );
}
