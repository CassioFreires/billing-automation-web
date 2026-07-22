import React from "react";
import { LegalLayout, LegalSection } from "./LegalLayout";

/** Termos de Uso (spec 0022) — público em /termos. Modelo inicial. */
export const TermsPage: React.FC = () => {
  return (
    <LegalLayout
      title="Termos de Uso"
      subtitle="Condições para uso da plataforma Adimplo de automação de cobranças."
    >
      <LegalSection n="1" title="Aceite">
        <p>
          Ao criar uma conta e usar o Adimplo, você declara ter lido e concordado com estes
          Termos e com a Política de Privacidade. Se não concordar, não utilize a plataforma.
        </p>
      </LegalSection>

      <LegalSection n="2" title="O serviço">
        <p>
          O Adimplo oferece ferramentas para emitir cobranças, gerar links e PIX, enviar
          lembretes, registrar recebimentos, oferecer condições de renegociação e acompanhar
          indicadores. Recursos podem variar conforme o plano contratado (Free, Essencial, Pro).
        </p>
      </LegalSection>

      <LegalSection n="3" title="Responsabilidades de quem contrata">
        <ul className="list-disc pl-5 space-y-1">
          <li>Usar a plataforma apenas para cobrar créditos legítimos e próprios.</li>
          <li>Obter as bases legais necessárias para tratar os dados dos seus pagadores.</li>
          <li>Manter a confidencialidade das credenciais de acesso.</li>
          <li>Não usar a plataforma para spam, assédio ou fins ilícitos.</li>
        </ul>
      </LegalSection>

      <LegalSection n="4" title="Planos, cobrança e teste grátis">
        <p>
          O Adimplo oferece um período de teste e planos pagos. A assinatura é cobrada conforme o
          plano escolhido; ao expirar o teste sem um plano ativo, as ações de escrita podem ser
          bloqueadas até a regularização. Preços e condições podem ser atualizados com aviso.
        </p>
      </LegalSection>

      <LegalSection n="5" title="Pagamentos de terceiros">
        <p>
          Os pagamentos dos pagadores são processados por <strong>gateways de terceiros</strong>.
          O Adimplo não retém os valores; a liquidação e as taxas seguem as regras do provedor
          escolhido pela empresa contratante.
        </p>
      </LegalSection>

      <LegalSection n="6" title="Disponibilidade e limitação de responsabilidade">
        <p>
          Buscamos alta disponibilidade, mas o serviço é fornecido "como está", sem garantia de
          operação ininterrupta. Na máxima extensão permitida em lei, o Adimplo não se
          responsabiliza por perdas indiretas decorrentes do uso ou indisponibilidade.
        </p>
      </LegalSection>

      <LegalSection n="7" title="Encerramento">
        <p>
          Você pode encerrar sua conta a qualquer momento pela plataforma (Configurações →
          Privacidade e dados), o que remove os dados da conta conforme a Política de Privacidade.
          Podemos suspender contas que violem estes Termos.
        </p>
      </LegalSection>

      <LegalSection n="8" title="Alterações e foro">
        <p>
          Estes Termos podem ser atualizados; a versão vigente fica sempre publicada nesta página.
          Aplica-se a legislação brasileira, elegendo-se o foro do domicílio do contratante quando
          cabível.
        </p>
      </LegalSection>
    </LegalLayout>
  );
};
