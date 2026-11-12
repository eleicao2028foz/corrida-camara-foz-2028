/* Barra de secretarias: flyTo until the civic building in civic-usuario.js. */
(function () {
  'use strict';

  // Cameras aim at the facade/letreiro of each civic model.
  // Coordinates come from civic local frames in civic-usuario.js (saude-esportes-financas-v9).
  // administracao: same civic building as Prefeitura (they share the palace).
  // Same target, slightly different bearing so the view is not identical.
  const CAMERAS = {
    prefeitura:     { center: [-54.58906885, -25.54662574], zoom: 17.35, pitch: 52, bearing: -28 },
    administracao:  { center: [-54.58906885, -25.54662574], zoom: 17.35, pitch: 52, bearing:  -8 },
    fundacao:       { center: [-54.58891742, -25.54766361], zoom: 17.90, pitch: 52, bearing: -28 },
    meio_ambiente:  { center: [-54.58660977, -25.51802968], zoom: 17.70, pitch: 52, bearing: -18 },
    obras:          { center: [-54.58664533, -25.51897477], zoom: 17.85, pitch: 52, bearing: -18 },
    educacao:       { center: [-54.58607374, -25.51904956], zoom: 17.55, pitch: 50, bearing:  40 },
    planejamento:   { center: [-54.58605739, -25.51809892], zoom: 17.70, pitch: 52, bearing: -18 },
    hospital:       { center: [-54.57625390, -25.51950818], zoom: 17.25, pitch: 52, bearing: -22 },
    fozhabita:      { center: [-54.58600834, -25.54262498], zoom: 18.05, pitch: 54, bearing:  20 },
    foztrans:       { center: [-54.55758435, -25.51716901], zoom: 17.70, pitch: 52, bearing: -68 },
    turismo:        { center: [-54.56251704, -25.56065216], zoom: 17.85, pitch: 52, bearing:  14 },
    guarda:         { center: [-54.55833710, -25.51782839], zoom: 17.70, pitch: 52, bearing: -68 },
    financas:       { center: [-54.58780540, -25.53999053], zoom: 18.05, pitch: 52, bearing:  28 },
    esporte:        { center: [-54.58816297, -25.53996781], zoom: 18.15, pitch: 52, bearing: -28 },
    saude:          { center: [-54.58620616, -25.54895870], zoom: 18.35, pitch: 54, bearing: -26 }
  };

  const bar = document.getElementById('sec-bar');
  if (!bar) return;
  const tip = bar.querySelector('.sec-tooltip');
  const items = Array.from(bar.querySelectorAll('.sec-item'));
  let activeId = null;
  let tipLock = false;

  function barPadding() {
    const h = Math.ceil(bar.getBoundingClientRect().height) + 16;
    document.documentElement.style.setProperty('--sec-h', h + 'px');
    bar.style.setProperty('--sec-h', h + 'px');
    return { top: 28, bottom: h, left: 16, right: 16 };
  }

  function placeTip(item) {
    if (!tip || !item) return;
    const stage = bar.getBoundingClientRect();
    const ring = item.querySelector('.sec-ring') || item;
    const r = ring.getBoundingClientRect();
    tip.textContent = item.getAttribute('data-tooltip') || item.getAttribute('aria-label') || '';
    tip.classList.add('is-on');
    // measure after text is set
    const tw = tip.getBoundingClientRect().width;
    let left = r.left - stage.left + r.width / 2;
    const min = tw / 2 + 8, max = stage.width - tw / 2 - 8;
    if (left < min) left = min;
    if (left > max) left = max;
    tip.style.left = left + 'px';
    tip.style.top = '4px';
  }

  function hideTip() {
    if (tipLock && activeId) {
      const item = items.find((el) => el.dataset.id === activeId);
      if (item) { placeTip(item); return; }
    }
    tip.classList.remove('is-on');
  }

  function setActive(id) {
    activeId = id;
    items.forEach((el) => {
      const on = el.dataset.id === id;
      el.classList.toggle('is-active', on);
      el.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    const item = items.find((el) => el.dataset.id === id);
    if (item) {
      tipLock = true;
      placeTip(item);
      // Keep the active button visible on the horizontal mobile scroller.
      item.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }

  function getMap() {
    const s = window.__FOZ_CITY_SIM__;
    return s && s.map;
  }

  function flyTo(id) {
    const cam = CAMERAS[id];
    const map = getMap();
    if (!cam || !map) return false;
    setActive(id);
    const padding = barPadding();
    map.flyTo({
      center: cam.center,
      zoom: cam.zoom,
      pitch: cam.pitch,
      bearing: cam.bearing,
      duration: 2000,
      essential: true,
      curve: 1.42,
      speed: 0.85,
      padding
    });
    return true;
  }

  items.forEach((el) => {
    el.setAttribute('aria-pressed', 'false');
    el.addEventListener('click', () => flyTo(el.dataset.id));
    el.addEventListener('mouseenter', () => placeTip(el));
    el.addEventListener('mouseleave', hideTip);
    el.addEventListener('focus', () => placeTip(el));
    el.addEventListener('blur', hideTip);
  });

  window.addEventListener('resize', () => {
    barPadding();
    if (activeId) {
      const item = items.find((el) => el.dataset.id === activeId);
      if (item && tip.classList.contains('is-on')) placeTip(item);
    }
  });

  function boot() {
    barPadding();
    const s = window.__FOZ_CITY_SIM__;
    if (s && s.ready && s.map) {
      // Expose for tests / console.
      window.__FOZ_SECRETARIAS__ = { flyTo, cameras: CAMERAS, bar, setActive };
      return;
    }
    setTimeout(boot, 80);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
