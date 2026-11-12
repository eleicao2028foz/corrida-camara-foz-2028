/* News strip for secretaria buttons. Local preview only. */
(function () {
  const ASSET_V = "noticias-barra-v12";
  const DATA_URL = "data/noticias-secretarias.json?t=" + Date.now();
  const RINGS = {
    prefeitura: "#4f8fd0",
    administracao: "#e0c65c",
    fundacao: "#c0846a",
    meio_ambiente: "#6fbf7a",
    obras: "#e09a5a",
    educacao: "#c4845c",
    planejamento: "#6ec0e0",
    hospital: "#e07070",
    fozhabita: "#e8a0b8",
    foztrans: "#e88840",
    turismo: "#4ec4b8",
    guarda: "#293e56",
    financas: "#c9a24a",
    esporte: "#6aaa6a",
    saude: "#e07070",
  };
  const TIPOS = { problema: "Problema", positivo: "Positivo", nota: "Nota" };

  function svgWrap(inner) {
    return (
      '<svg viewBox="0 0 64 64" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">' +
      inner +
      "</svg>"
    );
  }
  const S = "#2a3138";
  const skin = "#f4c9a8";
  function face(cy, smile) {
    const e1 = 26.5, e2 = 37.5, ey = cy + 1;
    return (
      '<circle cx="32" cy="'+cy+'" r="11" fill="'+skin+'" stroke="'+S+'" stroke-width="1.7"/>' +
      '<circle cx="'+e1+'" cy="'+ey+'" r="1.45" fill="'+S+'"/>' +
      '<circle cx="'+e2+'" cy="'+ey+'" r="1.45" fill="'+S+'"/>' +
      '<path d="M27 '+(cy+6.2)+'c2.4 '+(smile)+' 7.6 '+(smile)+' 10 0" fill="none" stroke="'+S+'" stroke-width="1.35" stroke-linecap="round"/>'
    );
  }
  function torso(fill, y) {
    y = y || 36;
    return '<rect x="20" y="'+y+'" width="24" height="22" rx="7" fill="'+fill+'" stroke="'+S+'" stroke-width="1.7"/>';
  }

  const CHARS = {
    prefeitura: svgWrap(
      torso("#4f8fd0") +
      '<path d="M20 40h24v6H20z" fill="#e8c85c"/>' +
      face(22, 1.8) +
      '<path d="M21 18c1.2-10 20.8-10 22 0" fill="#3b3b3b"/>'
    ),
    administracao: svgWrap(
      torso("#efe3a0") +
      '<rect x="38" y="40" width="16" height="14" rx="1.5" fill="#fff" stroke="'+S+'" stroke-width="1.3" transform="rotate(-8 46 47)"/>' +
      '<path d="M41 45h10M41 49h7" stroke="#c9a24a" stroke-width="1.2" transform="rotate(-8 46 47)"/>' +
      face(22, 1.4) +
      '<path d="M21 18c1.2-10 20.8-10 22 0" fill="#6b5340"/>' +
      '<rect x="22" y="20.2" width="20" height="3.6" rx="1.2" fill="#4a5a6a" stroke="'+S+'" stroke-width="1"/>'
    ),
    fundacao: svgWrap(
      torso("#c0846a") +
      '<rect x="44" y="34" width="2.6" height="18" rx=".8" fill="#8a5a3a" stroke="'+S+'" stroke-width="1"/>' +
      '<circle cx="45.3" cy="31.5" r="3.4" fill="#e07070" stroke="'+S+'" stroke-width="1"/>' +
      '<circle cx="49" cy="34" r="2.6" fill="#6aaa6a" stroke="'+S+'" stroke-width="1"/>' +
      face(23, 1.6) +
      '<ellipse cx="32" cy="13.5" rx="12" ry="6.2" fill="#2f2f2f" stroke="'+S+'" stroke-width="1.4"/>'
    ),
    meio_ambiente: svgWrap(
      torso("#6fbf7a") +
      face(24, 1.8) +
      '<ellipse cx="32" cy="14" rx="13" ry="7" fill="#3d8a4a" stroke="'+S+'" stroke-width="1.5"/>' +
      '<circle cx="21.5" cy="17" r="5.2" fill="#4fa85a" stroke="'+S+'" stroke-width="1.2"/>' +
      '<circle cx="42.5" cy="17" r="5.2" fill="#4fa85a" stroke="'+S+'" stroke-width="1.2"/>'
    ),
    obras: svgWrap(
      torso("#e09a5a") +
      '<path d="M20 43h24v5H20z" fill="#f0c833"/>' +
      face(26, 1.6) +
      '<path d="M22 19c0-9 20-9 20 0" fill="#f0c833" stroke="'+S+'" stroke-width="1.7"/>' +
      '<rect x="15" y="17.2" width="34" height="5.2" rx="2.4" fill="#f0c833" stroke="'+S+'" stroke-width="1.5"/>'
    ),
    educacao: svgWrap(
      torso("#c4845c") +
      '<rect x="40" y="40" width="16" height="11" rx="1.2" fill="#f4e6b8" stroke="'+S+'" stroke-width="1.25" transform="rotate(-12 48 45.5)"/>' +
      face(23, 1.5) +
      '<path d="M21 18c1.2-10 20.8-10 22 0" fill="#5a3a28"/>' +
      '<ellipse cx="26.6" cy="23.6" rx="5" ry="5.2" fill="none" stroke="'+S+'" stroke-width="1.6"/>' +
      '<ellipse cx="37.4" cy="23.6" rx="5" ry="5.2" fill="none" stroke="'+S+'" stroke-width="1.6"/>' +
      '<path d="M31.4 23.6h1.2" stroke="'+S+'" stroke-width="1.5"/>'
    ),
    planejamento: svgWrap(
      torso("#6ec0e0") +
      '<rect x="38" y="38" width="16" height="18" rx="1.2" fill="#f3f8fc" stroke="'+S+'" stroke-width="1.3" transform="rotate(-6 46 47)"/>' +
      '<path d="M41 44h10M41 48h8M41 52h6" stroke="#5aa8c8" stroke-width="1.15" transform="rotate(-6 46 47)"/>' +
      face(22, 1.4) +
      '<path d="M21 18c1.2-10 20.8-10 22 0" fill="#4a4a4a"/>'
    ),
    hospital: svgWrap(
      torso("#f3f3f3") +
      '<path d="M32 41v12" stroke="#e07070" stroke-width="3.2" stroke-linecap="round"/>' +
      '<path d="M26.5 47h11" stroke="#e07070" stroke-width="3.2" stroke-linecap="round"/>' +
      face(22, 1.6) +
      '<path d="M21 18c1.2-10 20.8-10 22 0" fill="#d5d9de"/>' +
      '<path d="M18 24c9 12 19 12 28 0" fill="none" stroke="#6a8a96" stroke-width="1.7" stroke-linecap="round"/>'
    ),
    fozhabita: svgWrap(
      torso("#e8a0b8") +
      '<path d="M18 42l14-12 14 12" fill="#f7d4e0" stroke="'+S+'" stroke-width="1.5" stroke-linejoin="round"/>' +
      '<rect x="29" y="44" width="6" height="8" fill="#fff" stroke="'+S+'" stroke-width="1.1"/>' +
      face(21, 1.6) +
      '<path d="M21 18c1.2-10 20.8-10 22 0" fill="#6b3a48"/>'
    ),
    foztrans: svgWrap(
      torso("#e88840") +
      '<rect x="22" y="40" width="20" height="9" rx="2" fill="#d7eef8" stroke="'+S+'" stroke-width="1.2"/>' +
      '<circle cx="25" cy="56" r="3.1" fill="'+S+'"/><circle cx="39" cy="56" r="3.1" fill="'+S+'"/>' +
      face(24, 1.5) +
      '<ellipse cx="32" cy="15" rx="13" ry="7" fill="#2f2f2f" stroke="'+S+'" stroke-width="1.5"/>' +
      '<path d="M16 20.5h32c0 0-3 5-16 5S16 20.5 16 20.5z" fill="#2f2f2f" stroke="'+S+'" stroke-width="1.3"/>'
    ),
    turismo: svgWrap(
      torso("#4ec4b8") +
      face(25, 1.8) +
      '<path d="M16 21.5c2.2-11.5 29.8-11.5 32 0v2.2H16z" fill="#f0c833" stroke="'+S+'" stroke-width="1.6" stroke-linejoin="round"/>' +
      '<rect x="15" y="20.5" width="34" height="3.6" fill="#c9a24a" stroke="'+S+'" stroke-width="1.1"/>'
    ),
    guarda: svgWrap(
      torso("#293e56") +
      '<circle cx="32" cy="46" r="4" fill="#e8c85c" stroke="'+S+'" stroke-width="1.15"/>' +
      face(26, 1.2) +
      '<path d="M19 21h26l-3.4-12.2H22.4z" fill="#293e56" stroke="'+S+'" stroke-width="1.6" stroke-linejoin="round"/>' +
      '<rect x="18" y="19.5" width="28" height="4.2" fill="#e8c85c" stroke="'+S+'" stroke-width="1.3"/>'
    ),
    financas: svgWrap(
      torso("#c9a24a") +
      '<circle cx="46" cy="49" r="8" fill="#e8c85c" stroke="'+S+'" stroke-width="1.4"/>' +
      '<text x="46" y="53" text-anchor="middle" font-size="11" font-weight="700" font-family="sans-serif" fill="'+S+'">$</text>' +
      face(22, 1.6) +
      '<path d="M21 18c1.2-10 20.8-10 22 0" fill="#3a3a3a"/>'
    ),
    esporte: svgWrap(
      torso("#6aaa6a") +
      '<circle cx="46" cy="48" r="8.5" fill="#f6f6f6" stroke="'+S+'" stroke-width="1.5"/>' +
      '<path d="M46 39.5c4 3.2 6.6 6 8.5 8.5M37.5 48c3.2 4 6 6.6 8.5 8.5M46 56.5c-4-3.2-6.6-6-8.5-8.5M54.5 48c-3.2-4-6-6.6-8.5-8.5" fill="none" stroke="'+S+'" stroke-width="1.1"/>' +
      face(21, 2) +
      '<path d="M21 18c1.2-10 20.8-10 22 0" fill="#2a3138"/>'
    ),
    saude: svgWrap(
      torso("#f7f7f7") +
      '<circle cx="32" cy="47" r="7.2" fill="#e07070" stroke="'+S+'" stroke-width="1.4"/>' +
      '<path d="M32 43.2v7.6M28.2 47h7.6" stroke="#fff" stroke-width="2.3" stroke-linecap="round"/>' +
      face(24, 1.6) +
      '<path d="M20 20.5h24v6H20z" fill="#fff" stroke="'+S+'" stroke-width="1.6"/>' +
      '<path d="M23 20.5h18l-2.2-8H25.2z" fill="#fff" stroke="'+S+'" stroke-width="1.6" stroke-linejoin="round"/>' +
      '<path d="M30 14.2h4v6h-4z" fill="#e07070"/>' +
      '<path d="M29 16.2h6v2h-6z" fill="#e07070"/>'
    ),
  };

  const PHOTO_MANIFEST = "img/personagens/manifest.json?v=" + ASSET_V;
  const HUMOR_BY_TIPO = { problema: "triste", positivo: "feliz", nota: "normal", vazio: "normal" };
  let photos = {};
  let data = null;
  let openId = null;
  const strip = () => document.getElementById("news-strip");

  function forcedHumor() {
    const q = new URLSearchParams(location.search).get("humor");
    if (q && /^(feliz|normal|triste)$/.test(q)) return q;
    return null;
  }

  function humorFromItem(item) {
    const forced = forcedHumor();
    if (forced) return forced;
    if (!item || !item.tipo) return "normal";
    return HUMOR_BY_TIPO[item.tipo] || "normal";
  }

  function photoFor(id, humor) {
    const pack = photos[id];
    if (!pack) return null;
    const webp = pack[humor] || pack.normal;
    if (!webp) return null;
    const pngs = pack.png || {};
    const png = pngs[humor] || pngs.normal || webp;
    return { webp: webp, png: png };
  }

  function setCharacter(charEl, id, humor) {
    const src = photoFor(id, humor);
    if (src) {
      let img = charEl.querySelector("img.news-photo");
      let source = charEl.querySelector("source");
      if (!img) {
        charEl.innerHTML = "";
        const pic = document.createElement("picture");
        source = document.createElement("source");
        source.type = "image/webp";
        img = document.createElement("img");
        img.className = "news-photo";
        img.alt = "";
        img.decoding = "async";
        pic.appendChild(source);
        pic.appendChild(img);
        charEl.appendChild(pic);
      }
      if (source) source.srcset = src.webp;
      img.src = src.png;
      charEl.classList.add("has-photo");
    } else {
      charEl.classList.remove("has-photo");
      charEl.innerHTML = CHARS[id] || CHARS.prefeitura;
    }
  }

  function preloadPhotos() {
    Object.keys(photos).forEach(function (id) {
      ["feliz", "normal", "triste"].forEach(function (h) {
        const src = photoFor(id, h);
        if (!src) return;
        const im = new Image();
        im.src = src.webp;
      });
    });
  }


  function fmtDate(iso) {
    if (!iso) return "";
    const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return iso;
    return m[3] + "/" + m[2] + "/" + m[1];
  }

  function padMap() {
    if (typeof window.__fozBarPad === "function") window.__fozBarPad();
  }

  function closeStrip() {
    const el = strip();
    if (!el) return;
    el.setAttribute("hidden", "");
    openId = null;
    padMap();
  }

  function render(id) {
    const el = strip();
    if (!el || !data) return;
    const rec = (data.secretarias || {})[id] || { id: id, nome: id, item: null };
    const item = rec.item;
    const nome = rec.nome || id;
    const ring = RINGS[id] || "#c9a24a";
    el.style.setProperty("--news-ring", ring);
    const char = el.querySelector(".news-char");
    const kicker = el.querySelector(".news-kicker");
    const title = el.querySelector(".news-title");
    const empty = el.querySelector(".news-empty");
    const meta = el.querySelector(".news-meta");
    const tag = el.querySelector(".news-tag");
    const dateEl = el.querySelector(".news-date");
    const srcEl = el.querySelector(".news-src");
    const more = el.querySelector(".news-more");
    const mentions = el.querySelector(".news-mentions");

    kicker.querySelector(".news-sec").textContent = nome;

    if (!item) {
      tag.dataset.tipo = "vazio";
      tag.textContent = "Sem notícias";
      title.hidden = true;
      empty.hidden = false;
      empty.textContent = "Sem notícias recentes sobre " + nome + ".";
      meta.hidden = true;
      more.hidden = true;
    } else {
      const tipo = item.tipo || "nota";
      tag.dataset.tipo = tipo;
      tag.textContent = TIPOS[tipo] || "Nota";
      title.hidden = false;
      empty.hidden = true;
      title.textContent = item.titulo || item.fato || "";
      meta.hidden = false;
      dateEl.textContent = fmtDate(item.data);
      if (item.quando === "hoje") dateEl.textContent = "Hoje · " + fmtDate(item.data);
      srcEl.textContent = item.fonte || "";
      if (item.mencoes && item.mencoes > 1) {
        mentions.hidden = false;
        mentions.textContent = "· " + item.mencoes + " fontes";
      } else {
        mentions.hidden = true;
      }
      if (item.url) {
        more.hidden = false;
        more.href = item.url;
      } else {
        more.hidden = true;
        more.removeAttribute("href");
      }
    }
    const humor = humorFromItem(item);
    setCharacter(char, id, humor);
    char.setAttribute("data-humor", humor);
    el.removeAttribute("hidden");
    openId = id;
    padMap();
  }

  function show(id) {
    render(id);
  }

  function hookClicks() {
    const bar = document.getElementById("sec-bar");
    if (!bar) return;
    bar.addEventListener(
      "click",
      function (e) {
        const item = e.target.closest(".sec-item[data-id]");
        if (!item) return;
        show(item.getAttribute("data-id"));
      },
      true
    );
    const close = document.querySelector("#news-strip .news-close");
    if (close) close.addEventListener("click", closeStrip);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeStrip();
    });
    window.addEventListener("resize", function () {
      if (openId) padMap();
    });
  }

  function boot() {
    hookClicks();
  }

  Promise.all([
    fetch(DATA_URL, { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error("noticias " + r.status);
      return r.json();
    }),
    fetch(PHOTO_MANIFEST).then(function (r) {
      if (!r.ok) return {};
      return r.json();
    }).catch(function () { return {}; }),
  ])
    .then(function (pair) {
      data = pair[0];
      const man = pair[1] || {};
      photos = man.secretarias || {};
      preloadPhotos();
      boot();
    })
    .catch(function (err) {
      console.warn("noticias-secretaria:", err);
      boot();
    });

  window.__fozNews = {
    show: show,
    close: closeStrip,
    humorFromItem: humorFromItem,
    forcedHumor: forcedHumor,
  };
})();
