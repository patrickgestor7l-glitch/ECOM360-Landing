# ECOM360 — Página de Captura

Landing page estática (HTML + CSS + JavaScript vanilla, **sem build step**) para o evento
gratuito da Tamara Marinho. Captura **nome** e **WhatsApp**, grava numa planilha do Google
Sheets e leva o lead direto para o Grupo VIP no WhatsApp.

Abre funcionando ao dar duplo clique no `index.html` e sobe em qualquer hospedagem estática
(Vercel / Netlify / Hostinger). Sem React, sem Tailwind, sem jQuery, sem CDN de terceiros
(exceto o GTM/Pixel).

---

## Estrutura

```
/
├── index.html                    página de captura
├── obrigado.html                 página de obrigado + redirect pro grupo
├── politica-de-privacidade.html  (rascunho — cliente revisa)
├── termos.html                   (rascunho — cliente revisa)
├── vercel.json                   headers de cache p/ deploy na Vercel
├── assets/
│   ├── css/style.css             CSS único
│   ├── js/config.js              TODAS as variáveis de configuração
│   ├── js/app.js                 form, máscara, validação, tracking, envio, countdown
│   ├── img/                      logo + imagens
│   └── fonts/                    woff2 auto-hospedados (ver assets/fonts/LEIA-ME.txt)
├── apps-script/Code.gs           backend Google Sheets
└── og-image.jpg                  preview de compartilhamento (PENDENTE — ver abaixo)
```

Tudo que muda mora em **`assets/js/config.js`**. Nada de valor hardcoded no HTML.

---

## Passo a passo para publicar

### 1. Criar/usar a planilha e publicar o Apps Script (obter a URL do endpoint)

1. Abra a planilha:
   `https://docs.google.com/spreadsheets/d/1hJtuGJyA5dcaVHlWf2jG-fM6HGHF6I-mpc0353xDIZk/edit`
2. Menu **Extensões → Apps Script**.
3. Apague o `function myFunction() {}` e cole **todo** o conteúdo de `apps-script/Code.gs`.
4. Troque a constante `TOKEN` por uma string aleatória sua. **Use a mesma** em
   `CONFIG.endpointToken` no `config.js`.
5. Salve (ícone do disquete).
6. Botão azul **Implantar → Nova implantação**.
7. Engrenagem ao lado de "Selecionar tipo" → **App da Web**.
8. Preencha:
   - Descrição: `ECOM360 captura v1`
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa** ← exatamente isso, **não** "Qualquer pessoa com conta do Google".
9. **Implantar** → autorize (a tela "app não verificado" é normal:
   *Avançado → Acessar projeto sem título*).
10. Copie a **URL do app da Web** (termina em `/exec`). Cole em `CONFIG.endpoint`.

**Teste rápido:** abra a URL `/exec` no navegador. Deve responder
`{"ok":true,"ping":"alive"}`. Se pedir login, o passo 8 está errado.

> ⚠️ **Toda vez que alterar o `Code.gs`:** Implantar → **Gerenciar implantações** →
> lápis (editar) → Versão: **Nova versão** → Implantar. Se criar uma implantação nova do
> zero, a URL muda e a página para de gravar.
> A aba `Leads` e o cabeçalho são criados sozinhos no primeiro envio.

### 2. Configurar o `config.js`

Abra `assets/js/config.js` e preencha:

| Campo | O que colocar |
|---|---|
| `endpoint` | a URL `/exec` do passo 1 |
| `endpointToken` | o mesmo `TOKEN` que você pôs no `Code.gs` |
| `grupoWhatsApp` | já preenchido — confira se é o link certo do grupo |
| `gtmId` | já preenchido (`GTM-TDS4ZD45`) |

### 3. Colocar o Pixel da Meta (dentro do GTM, **não** no código)

O código **nunca** contém `fbq`. Ele só alimenta o `dataLayer`. O Pixel entra no GTM.

**Onde pegar o Pixel ID:** Gerenciador de Anúncios → Gerenciador de Eventos →
selecione o conjunto de dados → número de 15–16 dígitos abaixo do nome.

**Dentro do GTM (`GTM-TDS4ZD45`):**

Variáveis (Variável da Camada de Dados):
- `DLV - event_id` → nome: `event_id`
- `DLV - user_data.fn` → nome: `user_data.fn`
- `DLV - user_data.ph` → nome: `user_data.ph`

Acionadores:
- `Todas as Páginas` (nativo)
- Evento personalizado → `form_start`
- Evento personalizado → `lead_confirmado`

Tags:

| Tag | Acionador | Configuração |
|---|---|---|
| Meta — Base | Todas as Páginas | `fbq('init', PIXEL_ID)` + `fbq('track','PageView')` |
| Meta — FormStart | `form_start` | Evento: `InitiateCheckout` |
| Meta — Lead | `lead_confirmado` | Evento: `Lead` · **Event ID:** `{{DLV - event_id}}` · Advanced Matching: `fn`=`{{DLV - user_data.fn}}`, `ph`=`{{DLV - user_data.ph}}` |

Se usar HTML personalizado no lugar do template Meta na tag Lead:
```html
<script>
  fbq('track', 'Lead', {}, { eventID: {{DLV - event_id}} });
</script>
```

**Validação obrigatória antes de subir ads:** GTM em modo **Preview** + Meta Events Manager
→ **Test Events**. Confirme que `Lead` dispara **uma única vez** por lead, com `event_id`
presente. O `event_id` do evento tem que ser idêntico ao gravado na coluna `event_id` da
planilha.

### 4. Fontes (opcional, mas recomendado)

Solte os `.woff2` em `assets/fonts/` conforme `assets/fonts/LEIA-ME.txt`. Sem eles a página
usa fallback do sistema e continua funcionando.

### 5. Subir na Vercel

**Opção A — via GitHub (recomendado):**
1. Crie um repositório e suba esta pasta.
2. Em vercel.com → **Add New → Project** → importe o repositório.
3. Framework Preset: **Other**. Build Command: *(vazio)*. Output Directory: *(vazio / raiz)*.
4. Deploy. A Vercel serve os arquivos estáticos direto.

**Opção B — via CLI:**
```bash
npm i -g vercel
cd ECOM360-Landing
vercel        # segue o assistente; framework = Other
vercel --prod # publica em produção
```

Depois de ter o domínio, atualize a linha `og:image` no `index.html`
(`https://SEU_DOMINIO/og-image.jpg`).

---

## Como funciona o fluxo do lead

1. Visitante preenche nome + WhatsApp e clica em **Garantir minha vaga**.
2. JS valida, gera um `event_id` (UUID), salva no `sessionStorage`, empurra `lead_form_submit`
   no `dataLayer` e envia o payload para o Apps Script (`x-www-form-urlencoded`, sem preflight).
3. **O lead nunca é bloqueado pela rede:** `Promise.race([envio, timeout])`. Se o endpoint
   demorar ou falhar, redireciona mesmo assim (fallback `sendBeacon`).
4. Vai para `obrigado.html`, que dispara `lead_confirmado` (a **conversão principal**),
   mostra o primeiro nome e redireciona pro grupo — com botão manual obrigatório (navegador
   in-app do Instagram/Facebook bloqueia redirect programático).

**Por que a conversão mora no obrigado e não no submit:** o GTM é assíncrono; se o redirect
acontece antes da tag disparar, a conversão se perde. Um `PageView` novo em `/obrigado.html`
é o único ponto de disparo confiável. `lead_form_submit` serve só de diagnóstico.

Proteções anti-bot sem atrito: **honeypot** (campo `empresa` oculto) + **time-trap**
(submit em menos de 2,5s é descartado). Sem CAPTCHA.

---

## Pendências do cliente (bloqueiam a publicação, não o build)

| Item | Onde entra | Como conseguir |
|---|---|---|
| URL do Apps Script (`/exec`) | `config.js → endpoint` | passo 1 |
| Token (igual nos dois lados) | `config.js` + `Code.gs` | escolha uma string aleatória |
| Pixel ID da Meta | dentro do GTM | Gerenciador de Eventos |
| Domínio final | `og:image` no `index.html` | Vercel/Netlify ou domínio próprio |
| `og-image.jpg` (1200×630) | raiz do projeto | arte com título + data + rosto |
| ~~Foto da Tamara~~ | `assets/img/tamara-retrato.jpg` | ✅ recebida e integrada |
| ~~Bio real da Tamara~~ | Módulo 03 do `index.html` | ✅ recebida e integrada |
| ~~Logo oficial~~ | `assets/img/logo-ecom360.jpg` | ✅ recebido e integrado (selo compacto no header/rodapé) |
| Fontes `.woff2` | `assets/fonts/` | ver `assets/fonts/LEIA-ME.txt` |
| ~~Razão social + CNPJ~~ | rodapé / legal | dispensado a pedido da cliente — não será exibido |
| ~~E-mail de suporte~~ | rodapé + Política/Termos | ✅ `Tamara_marinho2006@yahoo.com.br` |
| Revisar Política/Termos | `politica-de-privacidade.html`, `termos.html` | rascunhos prontos, cliente valida |

Enquanto não houver os dados, os placeholders ficam visíveis com
`<!-- TODO: cliente preencher -->`. **Nenhum número, faturamento ou depoimento foi inventado.**
