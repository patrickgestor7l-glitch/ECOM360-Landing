/* ==========================================================================
   ECOM360 — CONFIGURAÇÃO CENTRALIZADA
   Todo valor variável mora aqui. Nada hardcoded no HTML ou no app.js.
   ========================================================================== */
window.CONFIG = {
  // Destino final do lead
  grupoWhatsApp: "https://chat.whatsapp.com/DgRjYSvVWOX05FCILkMYo3?mode=gi_t",

  // Endpoint que grava na planilha (Apps Script OU webhook n8n — mesmo payload).
  // A URL /exec é gerada ao publicar o Apps Script. Ver README §15.1.
  endpoint: "COLE_AQUI_A_URL_DO_APPS_SCRIPT",
  endpointToken: "ecom360_2026_troque_isto",
  planilhaId: "1hJtuGJyA5dcaVHlWf2jG-fM6HGHF6I-mpc0353xDIZk", // referência, usado no Code.gs

  // Evento
  evento: {
    dataISO: "2026-07-27T20:00:00-03:00", // segunda-feira, 27/07, 20h (Brasília)
    dataExtenso: "Segunda-feira, 27 de julho",
    hora: "20h",
    fuso: "horário de Brasília",
    vagas: 1000
  },

  // Tracking — o Pixel da Meta NÃO vai no código. Ele é instalado dentro do GTM.
  // O código só mantém o dataLayer correto. Ver README §9.
  gtmId: "GTM-TDS4ZD45",

  // Redirect
  delayRedirect: 2500,   // ms na página de obrigado antes do redirect automático
  timeoutEnvio: 1500     // ms máximo esperando o endpoint antes de redirecionar assim mesmo

  // -------------------------------------------------------------------------
  // CAMINHO ALTERNATIVO (n8n) — não é necessário agora.
  // Se adotado depois (CAPI server-side, WhatsApp automático, CRM), basta
  // trocar `endpoint` acima pela URL do Webhook node do n8n. O payload chega
  // igual, sem mudar uma linha do front. Requisitos no n8n:
  //   • Webhook node em POST, "Respond: Immediately"
  //   • Allowed Origins (CORS) = domínio da página
  // -------------------------------------------------------------------------
};
