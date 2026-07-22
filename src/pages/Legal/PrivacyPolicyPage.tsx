import React from "react";
import { LegalLayout, LegalSection } from "./LegalLayout";

/** Política de Privacidade (spec 0022, LGPD) — pública em /privacidade. Modelo inicial. */
export const PrivacyPolicyPage: React.FC = () => {
  return (
    <LegalLayout
      title="Política de Privacidade"
      subtitle="Como o Adimplo trata os dados pessoais no tratamento de cobranças, em conformidade com a LGPD (Lei nº 13.709/2018)."
    >
      <LegalSection n="1" title="Quem trata os dados">
        <p>
          O <strong>Adimplo</strong> é uma plataforma de automação de cobranças. Em relação aos
          dados dos <em>pagadores</em> (clientes de quem contrata o Adimplo), a empresa
          contratante é a <strong>controladora</strong> dos dados e o Adimplo atua como{" "}
          <strong>operador</strong>, tratando os dados conforme as instruções dela. Em relação
          aos dados de cadastro da própria empresa contratante, o Adimplo é o controlador.
        </p>
      </LegalSection>

      <LegalSection n="2" title="Quais dados coletamos">
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Da empresa contratante:</strong> nome da empresa, nome e e-mail do responsável, senha (armazenada com hash).</li>
          <li><strong>Dos pagadores:</strong> nome, telefone e documento (CPF/CNPJ), além dos dados das cobranças (valores, vencimentos, status).</li>
          <li><strong>De uso do link de cobrança:</strong> eventos de interação (aberturas, tentativas de pagamento). <strong>Não</strong> armazenamos o endereço IP em texto — guardamos apenas um código derivado (hash) para evitar contagem duplicada, sem identificar a pessoa.</li>
        </ul>
      </LegalSection>

      <LegalSection n="3" title="Para que usamos (finalidade)">
        <p>
          Os dados são usados exclusivamente para <strong>emitir e gerir cobranças</strong>:
          gerar faturas e links de pagamento, enviar lembretes, registrar recebimentos, oferecer
          condições de renegociação configuradas pela empresa e apresentar indicadores de caixa.
          Não vendemos dados pessoais.
        </p>
      </LegalSection>

      <LegalSection n="4" title="Base legal">
        <p>
          O tratamento se apoia principalmente na <strong>execução de contrato</strong> e no{" "}
          <strong>legítimo interesse</strong> na cobrança de créditos, além do{" "}
          <strong>cumprimento de obrigação legal/regulatória</strong> quanto à guarda de registros
          fiscais e financeiros. A base legal específica por finalidade é definida pela empresa
          controladora.
        </p>
      </LegalSection>

      <LegalSection n="5" title="Compartilhamento">
        <p>
          Compartilhamos dados apenas com <strong>provedores necessários à operação</strong>:
          gateways de pagamento (para gerar o PIX/checkout) e provedores de mensageria (para
          enviar a cobrança), sempre limitado ao necessário. Provedores de infraestrutura tratam
          os dados sob contrato.
        </p>
      </LegalSection>

      <LegalSection n="6" title="Segurança">
        <p>
          Adotamos isolamento por conta (multi-tenant), criptografia de credenciais sensíveis em
          repouso, senhas com hash e controle de acesso. Nenhum sistema é 100% imune, mas
          buscamos as práticas adequadas ao risco.
        </p>
      </LegalSection>

      <LegalSection n="7" title="Retenção e descarte">
        <p>
          Os dados são mantidos enquanto durar a relação e pelos prazos legais aplicáveis a
          registros financeiros. A pedido, um titular pode ser <strong>anonimizado</strong>: os
          dados pessoais são removidos e as faturas são mantidas de forma não identificável, para
          cumprir obrigações contábeis.
        </p>
      </LegalSection>

      <LegalSection n="8" title="Direitos do titular">
        <p>
          O titular pode solicitar confirmação, acesso, correção, portabilidade, anonimização e
          eliminação dos seus dados. A empresa contratante exerce esses direitos pela plataforma
          (exportar/anonimizar em Configurações). A própria empresa pode exportar ou encerrar sua
          conta a qualquer momento.
        </p>
      </LegalSection>

      <LegalSection n="9" title="Contato / Encarregado (DPO)">
        <p>
          Dúvidas ou solicitações relativas a dados pessoais podem ser encaminhadas pelo canal de
          suporte da plataforma. O encarregado (DPO) e o canal oficial serão informados na versão
          final deste documento.
        </p>
      </LegalSection>
    </LegalLayout>
  );
};
