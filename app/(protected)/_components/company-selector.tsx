"use client";

import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useId } from "react";

import { selectCompany } from "@/actions/portal";

export function CompanySelector({
  companies,
  selected,
}: {
  companies: { id: string; name: string }[];
  selected: string | null;
}) {
  const selectorId = useId();
  const router = useRouter();
  const action = useAction(selectCompany, {
    onSuccess({ data }) {
      if (data?.ok) router.refresh();
    },
  });
  return (
    <div className="portal-workspace">
      <label htmlFor={selectorId} className="sr-only">
        Empresa ativa
      </label>
      <select
        id={selectorId}
        value={selected || ""}
        disabled={action.isPending || !companies.length}
        onChange={(event) => action.execute({ companyId: event.target.value })}
      >
        <option value="" disabled>
          {companies.length ? "Selecione uma empresa" : "Acesso pendente"}
        </option>
        {companies.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <span>Portal de atendimento</span>
      {(action.result.serverError || action.result.data?.ok === false) && (
        <p role="alert">Não foi possível selecionar esta empresa.</p>
      )}
    </div>
  );
}
