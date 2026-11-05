"use client";
import { Headset } from "lucide-react";
import { useState } from "react";
import LoginForm from "./components/login-form";
import RegisterForm from "./components/register-form";

export default function AuthenticationPage() {
  const [view, setView] = useState<"login" | "register">("login");
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 flex-col items-center justify-center bg-blue-600 px-6 lg:flex">
        <div className="flex flex-col items-center gap-4 text-center text-white">
          <div className="rounded-2xl bg-blue-500/60 p-4">
            <Headset size={36} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Helpdesk Lab</h1>
          <p className="max-w-xs text-sm text-blue-100">
            {view === "login"
              ? "Gerencie seus chamados de forma simples e rápida."
              : "Crie sua conta e comece a organizar seus atendimentos."}
          </p>
        </div>
      </div>
      <div className="bg-background flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
        {view === "login" ? (
          <LoginForm onSwitchToRegister={() => setView("register")} />
        ) : (
          <RegisterForm onSwitchToLogin={() => setView("login")} />
        )}
      </div>
    </div>
  );
}
