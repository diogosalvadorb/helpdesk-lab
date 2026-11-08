export function globalAccessChangeError(
  actorId: string,
  previous: { id: string; role: string; active: boolean },
  next: { role: string; active: boolean },
  activeAdministratorCount: number,
) {
  if (
    previous.id === actorId &&
    (previous.role !== next.role || previous.active !== next.active)
  )
    return "Peça a outro administrador para alterar seu acesso. Seu próprio acesso não pode ser reduzido aqui.";
  if (
    previous.role === "ADMIN" &&
    previous.active &&
    (next.role !== "ADMIN" || !next.active) &&
    activeAdministratorCount <= 1
  )
    return "Não é permitido suspender ou remover o último administrador global ativo.";
  return null;
}
