import { AuthInfo } from "../authentication/_components/auth-info";

export function HomeFooter() {
  return (
    <footer>
      <div className="wrap">
        <div className="brand">
          helpdesk<span>.</span>
        </div>
        <span className="small">
          © 2026 Nexo Tecnologia · Feito para cuidar.
        </span>
        <div className="links">
          <AuthInfo topic="help">Precisa de ajuda?</AuthInfo>
          <AuthInfo topic="privacy">Privacidade</AuthInfo>
          <AuthInfo topic="terms">Termos de uso</AuthInfo>
        </div>
      </div>
    </footer>
  );
}
