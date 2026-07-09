/* ==========================================================================
   ECOM360 — app.js
   Form, máscara, validação, tracking (dataLayer), envio, countdown, sticky bar.
   Vanilla. Sem dependências. Ver briefing §7, §8, §9, §10.
   ========================================================================== */
(function () {
  "use strict";

  var CFG = window.CONFIG || {};
  var dataLayer = (window.dataLayer = window.dataLayer || []);

  /* ---------- Helpers de storage ----------------------------------------- */
  var SS = {
    get: function (k) { try { return sessionStorage.getItem(k) || ""; } catch (e) { return ""; } },
    set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  };

  /* ---------- UUID (com fallback) ---------------------------------------- */
  function uuid() {
    try {
      if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    } catch (e) {}
    return Date.now() + "-" + Math.random().toString(36).slice(2, 10);
  }

  /* ---------- UTM / click IDs -------------------------------------------- */
  var UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid"];

  function captureUtms() {
    var params = new URLSearchParams(window.location.search);
    var out = {};
    UTM_KEYS.forEach(function (k) {
      var v = params.get(k);
      if (v) { SS.set("ecom360_" + k, v); }        // vindo da URL → persiste
      out[k] = v || SS.get("ecom360_" + k) || "";   // senão, recupera do storage
    });
    return out;
  }

  /* ---------- Device ------------------------------------------------------ */
  function device() {
    return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? "mobile" : "desktop";
  }

  /* =======================================================================
     COUNTDOWN
     ======================================================================= */
  function initCountdown() {
    var target = CFG.evento && CFG.evento.dataISO ? new Date(CFG.evento.dataISO).getTime() : NaN;
    if (isNaN(target)) return;

    var grid = document.getElementById("cd-grid");
    var live = document.getElementById("cd-live");
    if (!grid) return;

    var nums = {
      dias: grid.querySelector('[data-cd="dias"]'),
      horas: grid.querySelector('[data-cd="horas"]'),
      min: grid.querySelector('[data-cd="min"]'),
      seg: grid.querySelector('[data-cd="seg"]')
    };

    function pad(n) { return (n < 10 ? "0" : "") + n; }

    function tick() {
      var diff = target - Date.now();
      if (diff <= 0) {
        grid.hidden = true;
        if (live) live.hidden = false;   // troca para o CTA, nunca reseta
        clearInterval(timer);
        return;
      }
      var s = Math.floor(diff / 1000);
      var d = Math.floor(s / 86400); s -= d * 86400;
      var h = Math.floor(s / 3600);  s -= h * 3600;
      var m = Math.floor(s / 60);    s -= m * 60;
      if (nums.dias) nums.dias.textContent = pad(d);
      if (nums.horas) nums.horas.textContent = pad(h);
      if (nums.min) nums.min.textContent = pad(m);
      if (nums.seg) nums.seg.textContent = pad(s);
    }
    tick();
    var timer = setInterval(tick, 1000);
  }

  /* =======================================================================
     STICKY BAR (mobile) + IntersectionObserver
     ======================================================================= */
  function initStickyBar() {
    var bar = document.getElementById("sticky-bar");
    var card = document.getElementById("inscricao");
    if (!bar || !card) return;

    var formVisible = false;
    var scrolledEnough = false;

    function update() {
      var show = scrolledEnough && !formVisible;
      bar.classList.toggle("is-visible", show);
      bar.setAttribute("aria-hidden", show ? "false" : "true");
    }

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        formVisible = entries[0].isIntersecting;
        update();
      }, { threshold: 0.15 }).observe(card);
    }

    window.addEventListener("scroll", function () {
      scrolledEnough = window.scrollY > 600;
      update();
    }, { passive: true });
  }

  /* =======================================================================
     REVEAL dos cards de dor (fade-up curto, stagger)
     ======================================================================= */
  function initReveal() {
    var grid = document.getElementById("dor-grid");
    if (!grid || !("IntersectionObserver" in window)) {
      if (grid) [].forEach.call(grid.children, function (c) { c.classList.add("reveal"); });
      return;
    }
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          [].forEach.call(grid.children, function (c) { c.classList.add("reveal"); });
          obs.disconnect();
        }
      });
    }, { threshold: 0.2 });
    io.observe(grid);
  }

  /* =======================================================================
     SCROLL suave para o formulário + foco no nome
     ======================================================================= */
  function initScrollToForm() {
    document.querySelectorAll("[data-scroll-to-form]").forEach(function (btn) {
      btn.addEventListener("click", function (ev) {
        ev.preventDefault();
        var card = document.getElementById("inscricao");
        var nome = document.getElementById("nome");
        if (!card) return;
        card.scrollIntoView({ behavior: "smooth", block: "center" });
        if (nome) setTimeout(function () { nome.focus({ preventScroll: true }); }, 500);
      });
    });
  }

  /* =======================================================================
     MÁSCARA + VALIDAÇÃO DO WHATSAPP
     ======================================================================= */
  function onlyDigits(s) { return (s || "").replace(/\D+/g, ""); }

  function maskPhone(digits) {
    digits = digits.slice(0, 11);
    var len = digits.length;
    if (len === 0) return "";
    if (len < 3) return "(" + digits;
    var ddd = digits.slice(0, 2);
    var rest = digits.slice(2);
    if (rest.length <= 4) return "(" + ddd + ") " + rest;
    if (len <= 10) return "(" + ddd + ") " + rest.slice(0, 4) + "-" + rest.slice(4);
    return "(" + ddd + ") " + rest.slice(0, 5) + "-" + rest.slice(5);
  }

  function validatePhone(digits) {
    if (digits.length !== 10 && digits.length !== 11) return false;
    var ddd = parseInt(digits.slice(0, 2), 10);
    if (isNaN(ddd) || ddd < 11) return false;                 // DDD inválido
    if (digits.length === 11 && digits.charAt(2) !== "9") return false; // celular exige 9
    if (/^(\d)\1+$/.test(digits)) return false;               // todos iguais
    return true;
  }

  function validateName(v) {
    v = (v || "").trim();
    return v.length >= 2 && /[a-zA-ZÀ-ÿ]/.test(v);
  }

  function capitalize(v) {
    return (v || "").trim().toLowerCase().replace(/(^|\s|['-])([a-zà-ÿ])/g, function (m, sep, ch) {
      return sep + ch.toUpperCase();
    });
  }

  /* =======================================================================
     UI de erro
     ======================================================================= */
  function showError(input, msgEl, msg) {
    input.setAttribute("aria-invalid", "true");
    msgEl.textContent = msg;
    msgEl.classList.add("is-visible");
  }
  function clearError(input, msgEl) {
    input.removeAttribute("aria-invalid");
    msgEl.textContent = "";
    msgEl.classList.remove("is-visible");
  }

  /* =======================================================================
     ENVIO — nunca bloqueia o lead
     ======================================================================= */
  function enviarLead(payload) {
    var body = new URLSearchParams(payload);
    // x-www-form-urlencoded = simple request, sem preflight CORS
    return fetch(CFG.endpoint, { method: "POST", body: body })
      .catch(function () {
        if (navigator.sendBeacon) {
          try { navigator.sendBeacon(CFG.endpoint, body); } catch (e) {}
        }
      });
  }
  function timeout(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  /* =======================================================================
     FORMULÁRIO
     ======================================================================= */
  function initForm() {
    var form = document.getElementById("lead-form");
    if (!form) return;

    var nome = document.getElementById("nome");
    var whats = document.getElementById("whatsapp");
    var errNome = document.getElementById("err-nome");
    var errWhats = document.getElementById("err-whatsapp");
    var honeypot = document.getElementById("empresa");
    var btn = document.getElementById("submit-btn");
    var btnLabel = btn.querySelector(".btn__label");

    var loadTime = Date.now();
    var utm = captureUtms();
    var formStartFired = false;
    var submitting = false;

    // Máscara enquanto digita / cola
    whats.addEventListener("input", function () {
      var pos = whats.selectionStart === whats.value.length;
      whats.value = maskPhone(onlyDigits(whats.value));
      if (pos) whats.selectionStart = whats.selectionEnd = whats.value.length;
      if (whats.getAttribute("aria-invalid")) clearError(whats, errWhats);
    });
    nome.addEventListener("input", function () {
      if (nome.getAttribute("aria-invalid")) clearError(nome, errNome);
    });

    // form_start — uma única vez, no primeiro focus de qualquer campo
    [nome, whats].forEach(function (el) {
      el.addEventListener("focus", function () {
        if (formStartFired) return;
        formStartFired = true;
        dataLayer.push({ event: "form_start", form: "captura_aulao" });
      }, { once: false });
    });

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (submitting) return;

      // Honeypot: finge sucesso, não envia
      if (honeypot && honeypot.value.trim() !== "") {
        window.location.href = "obrigado.html";
        return;
      }
      // Time-trap: submit rápido demais = bot
      if (Date.now() - loadTime < 2500) { return; }

      // Validação
      var ok = true;
      if (!validateName(nome.value)) {
        showError(nome, errNome, "Digite seu nome completo.");
        ok = false;
      } else { clearError(nome, errNome); }

      var digits = onlyDigits(whats.value);
      if (!validatePhone(digits)) {
        showError(whats, errWhats, "Esse número parece incompleto. Confira o DDD e os 9 dígitos.");
        if (ok) whats.focus();
        ok = false;
      } else { clearError(whats, errWhats); }

      if (!ok) {
        if (nome.getAttribute("aria-invalid")) nome.focus();
        return;
      }

      submitting = true;

      // Dados normalizados
      var nomeFmt = capitalize(nome.value);
      var e164 = "55" + digits;
      var eventId = uuid();

      SS.set("ecom360_event_id", eventId);
      SS.set("ecom360_nome", nomeFmt);
      SS.set("ecom360_whatsapp", whats.value);
      SS.set("ecom360_whatsapp_e164", e164);

      // Estado de envio no botão (largura reservada pelo min-height/padding)
      btn.classList.add("is-loading");
      btn.disabled = true;
      if (btnLabel) btnLabel.textContent = "Entrando no grupo…";

      // Tracking client-side (diagnóstico). A conversão principal é no obrigado.html.
      dataLayer.push({
        event: "lead_form_submit",
        form: "captura_aulao",
        event_id: eventId,
        utm_source: utm.utm_source || "",
        utm_campaign: utm.utm_campaign || ""
      });

      var payload = {
        token: CFG.endpointToken || "",
        nome: nomeFmt,
        whatsapp: whats.value,
        whatsapp_e164: e164,
        event_id: eventId,
        utm_source: utm.utm_source || "",
        utm_medium: utm.utm_medium || "",
        utm_campaign: utm.utm_campaign || "",
        utm_content: utm.utm_content || "",
        utm_term: utm.utm_term || "",
        fbclid: utm.fbclid || "",
        gclid: utm.gclid || "",
        referrer: document.referrer || "",
        page: window.location.href,
        device: device(),
        user_agent: navigator.userAgent || "",
        ts_load: String(loadTime)
      };

      // Redireciona em QUALQUER desfecho: sucesso, erro ou timeout.
      var go = function () { window.location.href = "obrigado.html"; };
      Promise.race([
        enviarLead(payload),
        timeout(CFG.timeoutEnvio || 1500)
      ]).then(go, go);
    });
  }

  /* =======================================================================
     BOOT
     ======================================================================= */
  function boot() {
    dataLayer.push({ event: "page_ready", page_type: "captura" });
    initCountdown();
    initStickyBar();
    initReveal();
    initScrollToForm();
    initForm();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
