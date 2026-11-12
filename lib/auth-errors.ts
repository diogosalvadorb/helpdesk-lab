import { APIError } from "better-auth/api";

export function authErrorMessage(error: unknown) {
  if (!(error instanceof APIError))
    return "Não foi possível concluir a solicitação. Tente novamente.";
  if (error.statusCode === 429)
    return "Muitas solicitações. Aguarde antes de tentar novamente.";
  switch (error.body?.code) {
    case "INVALID_PASSWORD":
      return "A senha atual está incorreta.";
    case "OTP_EXPIRED":
      return "Este código expirou. Solicite um novo código.";
    case "TOO_MANY_ATTEMPTS":
      return "Limite de tentativas atingido. Solicite um novo código.";
    case "INVALID_OTP":
      return "Código inválido ou já utilizado. Confira os dígitos ou solicite outro.";
    case "EMAIL_DELIVERY_UNAVAILABLE":
      return "Não foi possível enviar o código. Tente reenviar em instantes.";
    default:
      return "Não foi possível concluir a solicitação. Confira os dados e tente novamente.";
  }
}
