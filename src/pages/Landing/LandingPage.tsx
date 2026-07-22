import React from "react";
import { Link } from "react-router-dom";
import {
  MessageSquare,
  Zap,
  BarChart3,
  Check,
  ArrowRight,
  Users,
  CreditCard,
  ListChecks,
  LinkIcon,
} from "lucide-react";
import { LogoWordmark } from "../../components/Logo";

/* ============================================================================
 * Landing comercial Adimplo (pública, rota /). Dark premium, responsiva.
 * Seções: Nav · Hero · Logos · Features · Como funciona · Planos · CTA · Footer
 * ========================================================================== */

const features = [
  { icon: ListChecks, title: "Régua inteligente multi-passo", desc: "Sequência automática de lembretes antes e depois do vencimento — cada passo com sua mensagem, no dia certo." },
  { icon: MessageSquare, title: "Cobrança por WhatsApp", desc: "A régua lembra, cobra e confirma pagamentos direto no WhatsApp do cliente, sem você mexer um dedo." },
  { icon: CreditCard, title: "PIX + multi-gateway", desc: "Asaas, Mercado Pago, PagBank, Stripe e mais. Gere cobranças com PIX/checkout e concilie via webhook." },
  { icon: LinkIcon, title: "Portal do pagador", desc: "Um link só onde o cliente vê tudo que deve, o histórico e paga na hora. Menos ida e volta pra você." },
  { icon: BarChart3, title: "Painel com valor recuperado", desc: "Acompanhe inadimplência, disparos, recebimentos e quanto você recuperou no período em tempo real." },
  { icon: Users, title: "Equipe com papéis", desc: "Convide seu time com permissões (dono, admin, membro). Isolamento total de dados e ferramentas de LGPD." },
];

const steps = [
  { n: "01", title: "Cadastre seus clientes", desc: "Importe ou cadastre quem você precisa cobrar. Cada conta é isolada e sua." },
  { n: "02", title: "Gere as cobranças", desc: "Crie faturas com PIX/checkout. O sistema identifica quem está em atraso." },
  { n: "03", title: "A régua dispara sozinha", desc: "Lembretes e cobranças multi-passo saem no WhatsApp na hora certa, antes e depois do vencimento." },
  { n: "04", title: "Receba e concilie", desc: "O pagamento é confirmado sozinho e a fatura vira paga no painel." },
];

interface Plan {
  name: string;
  price: string;
  period: string;
  desc: string;
  features: string[];
  cta: string;
  highlight?: boolean;
}

const plans: Plan[] = [
  {
    name: "Free",
    price: "R$ 0",
    period: "/mês",
    desc: "Para testar e começar.",
    features: ["Até 30 clientes", "50 cobranças/mês", "1 usuário", "WhatsApp (modo teste)"],
    cta: "Começar grátis",
  },
  {
    name: "Pro",
    price: "R$ 97",
    period: "/mês",
    desc: "Para quem já cobra de verdade.",
    features: ["Até 500 clientes", "Cobranças ilimitadas", "3 usuários", "WhatsApp real", "PIX + conciliação", "Suporte prioritário"],
    cta: "Assinar o Pro",
    highlight: true,
  },
  {
    name: "Business",
    price: "R$ 297",
    period: "/mês",
    desc: "Para escalar a operação.",
    features: ["Clientes ilimitados", "Múltiplos números de WhatsApp", "Usuários ilimitados", "Relatórios avançados", "Onboarding dedicado"],
    cta: "Falar com vendas",
  },
];

const Nav: React.FC = () => (
  <header className="sticky top-0 z-40 backdrop-blur-md bg-bg-main/70 border-b border-border-subtle/60">
    <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
      <Link to="/">
        <LogoWordmark size={26} />
      </Link>
      <nav className="hidden md:flex items-center gap-8 text-sm text-text-muted">
        <a href="#recursos" className="hover:text-white transition-colors">Recursos</a>
        <a href="#como-funciona" className="hover:text-white transition-colors">Como funciona</a>
        <a href="#planos" className="hover:text-white transition-colors">Planos</a>
      </nav>
      <div className="flex items-center gap-3">
        <Link to="/login" className="text-sm text-text-muted hover:text-white transition-colors">Entrar</Link>
        <Link
          to="/register"
          className="focus-ring text-sm bg-brand-primary hover:bg-brand-hover text-white font-semibold px-4 py-2 rounded-xl transition-all active:scale-95"
        >
          Criar conta
        </Link>
      </div>
    </div>
  </header>
);

const Hero: React.FC = () => (
  <section className="relative overflow-hidden">
    <div className="max-w-6xl mx-auto px-6 pt-20 pb-16 lg:pt-28 lg:pb-24 grid lg:grid-cols-2 gap-12 items-center">
      <div className="animate-fade-in-up">
        <span className="inline-flex items-center gap-2 text-xs font-medium text-brand-primary bg-brand-primary/10 border border-brand-primary/20 rounded-full px-3 py-1">
          <Zap className="h-3.5 w-3.5" /> Cobrança automática por WhatsApp
        </span>
        <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05]">
          Reduza a inadimplência{" "}
          <span className="bg-gradient-to-r from-brand-primary to-sky-300 bg-clip-text text-transparent">
            no automático
          </span>
        </h1>
        <p className="mt-5 text-lg text-text-muted max-w-lg">
          O Adimplo identifica quem está em atraso, dispara a cobrança no WhatsApp e confirma o
          pagamento sozinho. Você configura uma vez — ele trabalha todo dia.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link
            to="/register"
            className="focus-ring inline-flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-hover text-white font-semibold px-6 py-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-sky-500/20"
          >
            Começar grátis <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#planos"
            className="focus-ring inline-flex items-center justify-center gap-2 border border-border-subtle hover:bg-bg-card text-white font-semibold px-6 py-3 rounded-xl transition-all"
          >
            Ver planos
          </a>
        </div>
        <p className="mt-4 text-xs text-text-faint">Sem cartão de crédito • Comece em minutos</p>
      </div>

      {/* Mockup de produto (puro CSS, sem dado real) */}
      <div className="animate-fade-in">
        <div className="relative rounded-2xl border border-border-subtle bg-bg-card/80 p-5 shadow-2xl">
          <div className="flex items-center gap-1.5 mb-4">
            <span className="h-3 w-3 rounded-full bg-rose-400/70" />
            <span className="h-3 w-3 rounded-full bg-amber-400/70" />
            <span className="h-3 w-3 rounded-full bg-emerald-400/70" />
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: "Recuperado", value: "R$ 4.850", color: "text-brand-success" },
              { label: "Em atraso", value: "R$ 1.240", color: "text-brand-warning" },
              { label: "Disparos", value: "342", color: "text-white" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-bg-main/60 border border-border-subtle p-3">
                <p className="text-[10px] uppercase tracking-wider text-text-faint">{s.label}</p>
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {[
              { n: "Rodrigo Silva", s: "Notificado", ok: true },
              { n: "Mariana Costa", s: "Na fila", ok: false },
              { n: "Carlos Mendes", s: "Pago", ok: true },
            ].map((r) => (
              <div key={r.n} className="flex items-center justify-between rounded-lg bg-bg-main/40 border border-border-subtle px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-brand-primary/15 flex items-center justify-center">
                    <Users className="h-3.5 w-3.5 text-brand-primary" />
                  </div>
                  <span className="text-sm">{r.n}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${r.ok ? "text-brand-success border-emerald-500/30 bg-emerald-500/10" : "text-brand-warning border-amber-500/30 bg-amber-500/10"}`}>
                  {r.s}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);

const Features: React.FC = () => (
  <section id="recursos" className="max-w-6xl mx-auto px-6 py-16 lg:py-24">
    <div className="text-center max-w-2xl mx-auto">
      <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight">Tudo que você precisa pra cobrar melhor</h2>
      <p className="mt-4 text-text-muted">Uma plataforma completa, do lembrete amigável à conciliação do pagamento.</p>
    </div>
    <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {features.map(({ icon: Icon, title, desc }) => (
        <div key={title} className="rounded-2xl border border-border-subtle bg-bg-card/60 p-6 hover:border-brand-primary/40 hover:-translate-y-0.5 transition-all">
          <div className="h-11 w-11 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary">
            <Icon className="h-5 w-5" />
          </div>
          <h3 className="mt-4 font-semibold text-lg">{title}</h3>
          <p className="mt-2 text-sm text-text-muted leading-relaxed">{desc}</p>
        </div>
      ))}
    </div>
  </section>
);

const HowItWorks: React.FC = () => (
  <section id="como-funciona" className="border-y border-border-subtle/60 bg-bg-card/30">
    <div className="max-w-6xl mx-auto px-6 py-16 lg:py-24">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight">Como funciona</h2>
        <p className="mt-4 text-text-muted">Quatro passos entre você e menos inadimplência.</p>
      </div>
      <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {steps.map((s) => (
          <div key={s.n} className="rounded-2xl border border-border-subtle bg-bg-main/40 p-6">
            <span className="text-3xl font-black text-brand-primary/30">{s.n}</span>
            <h3 className="mt-2 font-semibold">{s.title}</h3>
            <p className="mt-2 text-sm text-text-muted leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const Pricing: React.FC = () => (
  <section id="planos" className="max-w-6xl mx-auto px-6 py-16 lg:py-24">
    <div className="text-center max-w-2xl mx-auto">
      <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight">Planos simples e transparentes</h2>
      <p className="mt-4 text-text-muted">Comece grátis. Cresça quando fizer sentido.</p>
    </div>
    <div className="mt-12 grid md:grid-cols-3 gap-6 items-start">
      {plans.map((p) => (
        <div
          key={p.name}
          className={`relative rounded-2xl p-7 border transition-all ${
            p.highlight
              ? "border-brand-primary bg-bg-card shadow-2xl shadow-sky-500/10 md:-translate-y-2"
              : "border-border-subtle bg-bg-card/60"
          }`}
        >
          {p.highlight && (
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold bg-brand-primary text-white px-3 py-1 rounded-full">
              Mais popular
            </span>
          )}
          <h3 className="font-semibold text-lg">{p.name}</h3>
          <p className="text-sm text-text-muted mt-1">{p.desc}</p>
          <div className="mt-5 flex items-baseline gap-1">
            <span className="text-4xl font-extrabold">{p.price}</span>
            <span className="text-text-muted text-sm">{p.period}</span>
          </div>
          <Link
            to="/register"
            className={`focus-ring mt-6 w-full inline-flex items-center justify-center gap-2 font-semibold px-4 py-2.5 rounded-xl transition-all active:scale-[0.98] ${
              p.highlight
                ? "bg-brand-primary hover:bg-brand-hover text-white shadow-lg shadow-sky-500/20"
                : "border border-border-subtle hover:bg-bg-elevated text-white"
            }`}
          >
            {p.cta}
          </Link>
          <ul className="mt-6 space-y-3">
            {p.features.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-text-muted">
                <Check className="h-4 w-4 text-brand-success mt-0.5 shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
    <p className="text-center text-xs text-text-faint mt-8">
      Preços ilustrativos — ajuste no plano comercial. Impostos podem ser aplicados.
    </p>
  </section>
);

const FinalCTA: React.FC = () => (
  <section className="max-w-6xl mx-auto px-6 pb-20">
    <div className="rounded-3xl border border-brand-primary/30 bg-gradient-to-br from-brand-primary/10 to-transparent p-10 lg:p-14 text-center">
      <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight">Comece a recuperar hoje</h2>
      <p className="mt-4 text-text-muted max-w-xl mx-auto">
        Crie sua conta grátis e configure sua primeira régua de cobrança em minutos.
      </p>
      <Link
        to="/register"
        className="focus-ring mt-8 inline-flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-hover text-white font-semibold px-7 py-3.5 rounded-xl transition-all active:scale-95 shadow-lg shadow-sky-500/20"
      >
        Criar conta grátis <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  </section>
);

const Footer: React.FC = () => (
  <footer className="border-t border-border-subtle/60">
    <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-text-faint">
      <LogoWordmark size={22} />
      <p>© {new Date().getFullYear()} Adimplo. Todos os direitos reservados.</p>
      <div className="flex items-center gap-5">
        <Link to="/privacidade" className="hover:text-white transition-colors">Privacidade</Link>
        <Link to="/termos" className="hover:text-white transition-colors">Termos</Link>
        <Link to="/login" className="hover:text-white transition-colors">Entrar</Link>
        <Link to="/register" className="hover:text-white transition-colors">Criar conta</Link>
      </div>
    </div>
  </footer>
);

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-bg-main text-text-main">
      <Nav />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Pricing />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
};
