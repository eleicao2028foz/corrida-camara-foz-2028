/* Termômetro da barra das secretarias: índice 0–100 de problemas, igual a Pautas de Foz agora. */
(function () {
  "use strict";

  const el = document.getElementById("sec-termometro");
  if (!el) return;

  const track = el.querySelector(".sec-term-track");
  const knob = el.querySelector(".sec-term-knob");
  const tip = el.querySelector(".sec-term-tip");
  const ticksBox = el.querySelector(".sec-term-ticks");
  if (!track || !knob) return;

  let data = null;
  let scopeId = null; // null = cidade

  function scalePad() {
    const raw = getComputedStyle(el).getPropertyValue("--term-pad").trim();
    const n = parseFloat(raw);
    return isFinite(n) && n > 0 ? n : 14;
  }

  function scaleLeft(pct) {
    const pad = scalePad();
    return "calc(" + pad + "px + (100% - " + pad * 2 + "px) * " + pct / 100 + ")";
  }

  function buildTicks() {
    if (!ticksBox) return;
    ticksBox.innerHTML = "";
    // 10 divisões principais (0,10,...,100) + intermediários a cada 5.
    for (let i = 0; i <= 20; i++) {
      const tick = document.createElement("span");
      tick.className = "sec-term-tick " + (i % 2 === 0 ? "is-major" : "is-minor");
      tick.style.left = scaleLeft((i / 20) * 100);
      ticksBox.appendChild(tick);
    }
  }

  function fmtDate(iso) {
    if (!iso) return "";
    const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return iso;
    return m[3] + "/" + m[2] + "/" + m[1];
  }

  function periodoTxt(t) {
    const p = (t && t.periodo) || [];
    if (p.length === 2) return fmtDate(p[0]) + " a " + fmtDate(p[1]);
    return "";
  }

  function recFor(id) {
    const t = data;
    if (!t) return null;
    if (!id) return t.cidade || null;
    return (t.secretarias || {})[id] || null;
  }

  function titleFor(id, rec) {
    if (!id) return (rec && rec.nome) || "Foz do Iguaçu";
    if (rec && rec.nome) return rec.nome;
    const item = document.querySelector('#sec-bar .sec-item[data-id="' + id + '"]');
    return (item && (item.getAttribute("data-tooltip") || item.getAttribute("aria-label"))) || id;
  }

  function tipText(id, rec) {
    const t = data || {};
    const per = periodoTxt(t);
    const nome = titleFor(id, rec);
    if (!rec || rec.sem_indice || rec.nivel == null) {
      return nome + " · sem índice no mapa Pautas de Foz agora";
    }
    let s = nome + " · " + rec.nivel + "/100";
    if (!id && rec.n_secretarias) s += " · média de " + rec.n_secretarias + " secretarias";
    const pr = rec.problemas != null ? rec.problemas : null;
    const po = rec.positivas != null ? rec.positivas : null;
    if (pr != null && po != null) s += " · " + pr + " problema" + (pr === 1 ? "" : "s") + " · " + po + " positiva" + (po === 1 ? "" : "s");
    if (per) s += " · " + per;
    return s;
  }

  function positionPct(nivel) {
    // nivel 100 (mais problemas) = esquerda; 0 = direita.
    const v = Math.max(0, Math.min(100, nivel));
    return 100 - v;
  }

  function apply(id) {
    scopeId = id || null;
    const rec = recFor(scopeId);
    const known = !!(rec && !rec.sem_indice && rec.nivel != null);
    el.classList.toggle("is-unknown", !known);
    const pct = known ? positionPct(rec.nivel) : 50;
    knob.style.left = scaleLeft(pct);
    const label = tipText(scopeId, rec);
    if (tip) tip.textContent = label;
    el.setAttribute("aria-label", "Termômetro de problemas. " + label);
    if (known) {
      el.setAttribute("aria-valuenow", String(rec.nivel));
      el.setAttribute("aria-valuetext", titleFor(scopeId, rec) + ": " + rec.nivel + " de 100");
    } else {
      el.setAttribute("aria-valuetext", label);
      el.removeAttribute("aria-valuenow");
    }
    syncNewsClass();
  }

  function syncNewsClass() {
    const news = document.getElementById("news-strip");
    const bar = document.getElementById("sec-bar");
    const open = !!(news && !news.hasAttribute("hidden"));
    if (bar) bar.classList.toggle("news-open", open);
    el.classList.toggle("news-open", open);
  }

  function clearBarActive() {
    const api = window.__FOZ_SECRETARIAS__;
    if (api && typeof api.clearActive === "function") api.clearActive();
  }

  function setScope(id) {
    apply(id);
    if (!id) clearBarActive();
    if (typeof window.__fozBarPad === "function") window.__fozBarPad();
  }

  function hook() {
    const bar = document.getElementById("sec-bar");
    if (bar) {
      bar.addEventListener(
        "click",
        function (e) {
          const item = e.target.closest(".sec-item[data-id]");
          if (!item) return;
          setScope(item.getAttribute("data-id"));
        },
        true
      );
      const tab = bar.querySelector(".sec-tab");
      if (tab) {
        tab.setAttribute("role", "button");
        tab.setAttribute("tabindex", "0");
        tab.setAttribute("aria-label", "Ver índice geral de Foz");
        tab.style.cursor = "pointer";
        function toCity() {
          if (window.__fozNews && typeof window.__fozNews.close === "function") window.__fozNews.close();
          setScope(null);
        }
        tab.addEventListener("click", toCity);
        tab.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toCity();
          }
        });
      }
    }
    const close = document.querySelector("#news-strip .news-close");
    if (close) {
      close.addEventListener("click", function () {
        setScope(null);
      });
    }
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setScope(null);
    });
    const news = document.getElementById("news-strip");
    if (news && typeof MutationObserver !== "undefined") {
      new MutationObserver(syncNewsClass).observe(news, { attributes: true, attributeFilter: ["hidden"] });
    }
    el.addEventListener("mouseenter", function () {
      if (tip && !el.classList.contains("news-open")) tip.classList.add("is-on");
    });
    el.addEventListener("mouseleave", function () {
      if (tip) tip.classList.remove("is-on");
    });
    el.addEventListener("focus", function () {
      if (tip && !el.classList.contains("news-open")) tip.classList.add("is-on");
    });
    el.addEventListener("blur", function () {
      if (tip) tip.classList.remove("is-on");
    });
    window.addEventListener("resize", function () {
      buildTicks();
      apply(scopeId);
      if (typeof window.__fozBarPad === "function") window.__fozBarPad();
    });
  }

  function boot(term) {
    data = term || null;
    buildTicks();
    hook();
    apply(null);
    window.__FOZ_TERMOMETRO__ = {
      setScope: setScope,
      data: function () { return data; },
      scope: function () { return scopeId; },
    };
  }

  function fromNewsData() {
    if (window.__fozNews && window.__fozNews.data && window.__fozNews.data.termometro) {
      return window.__fozNews.data.termometro;
    }
    return null;
  }

  // noticias-secretaria.js already fetches the JSON; reuse if ready, otherwise fetch once.
  function start() {
    const ready = fromNewsData();
    if (ready) {
      boot(ready);
      return;
    }
    fetch("data/noticias-secretarias.json?t=" + Date.now(), { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("termometro " + r.status);
        return r.json();
      })
      .then(function (j) {
        boot((j && j.termometro) || null);
      })
      .catch(function (err) {
        console.warn("termometro-secretarias:", err);
        boot(null);
      });
  }

  // Give noticias-secretaria a brief head start so we can share its payload when possible.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { setTimeout(start, 0); });
  } else {
    setTimeout(start, 0);
  }
})();
