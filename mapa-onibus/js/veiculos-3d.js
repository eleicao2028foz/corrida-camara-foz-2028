/* Modelos 3D low-poly + camada custom instanciada (mesmo desenho dos ônibus 3D).
   Eixos locais: x direita, y frente (nariz +Y), z cima. Medidas em metros.
   Cabine e baú dos caminhões encostados no mesmo eixo (transito-v12). */
(function (root) {
  "use strict";

  function rgb(h) {
    return [1, 3, 5].map(function (i) { return parseInt(h.slice(i, i + 2), 16) / 255; });
  }
  function shade(hex, f) {
    const c = [1, 3, 5].map(function (i) {
      return Math.max(0, Math.min(255, Math.round(parseInt(hex.slice(i, i + 2), 16) * f)));
    });
    return "#" + c.map(function (x) { return x.toString(16).padStart(2, "0"); }).join("");
  }

  function builder() {
    const vertices = [];
    function face(points, color) {
      const c = rgb(color), a = points[0];
      const u = points[1].map(function (v, i) { return v - a[i]; });
      const v = points[2].map(function (vv, i) { return vv - a[i]; });
      let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
      const len = Math.hypot(n[0], n[1], n[2]) || 1;
      n = n.map(function (x) { return x / len; });
      for (let i = 1; i < points.length - 1; i++) {
        const tri = [a, points[i], points[i + 1]];
        for (let k = 0; k < 3; k++) vertices.push(tri[k][0], tri[k][1], tri[k][2], n[0], n[1], n[2], c[0], c[1], c[2]);
      }
    }
    function box(x, y, z, w, l, h, color) {
      const a = x - w / 2, b = x + w / 2, d = y - l / 2, e = y + l / 2, f = z + h;
      face([[a, d, z], [a, e, z], [b, e, z], [b, d, z]], color);
      face([[a, d, f], [b, d, f], [b, e, f], [a, e, f]], color);
      face([[a, d, z], [b, d, z], [b, d, f], [a, d, f]], color);
      face([[b, e, z], [a, e, z], [a, e, f], [b, e, f]], color);
      face([[a, e, z], [a, d, z], [a, d, f], [a, e, f]], color);
      face([[b, d, z], [b, e, z], [b, e, f], [b, d, f]], color);
    }
    function wheel(x, y, r, thick, zMid) {
      r = r || 0.31;
      thick = thick || 0.2;
      zMid = zMid == null ? r : zMid;
      const n = 8, half = thick / 2;
      for (let i = 0; i < n; i++) {
        const a = i * 2 * Math.PI / n, b = (i + 1) * 2 * Math.PI / n;
        const ya = y + Math.cos(a) * r, za = zMid + Math.sin(a) * r;
        const yb = y + Math.cos(b) * r, zb = zMid + Math.sin(b) * r;
        face([[x - half, ya, za], [x + half, ya, za], [x + half, yb, zb], [x - half, yb, zb]], "#1a1c1e");
      }
      const caps = [-1, 1];
      for (let s = 0; s < 2; s++) {
        const side = caps[s];
        const xx = x + side * (half + 0.002);
        const ring = [];
        for (let i = 0; i < n; i++) {
          const a = side * i * 2 * Math.PI / n;
          ring.push([xx, y + Math.cos(a) * r, zMid + Math.sin(a) * r]);
        }
        face(ring, "#242628");
      }
      box(x, y, zMid - 0.07, thick + 0.04, 0.16, 0.14, "#8d9096");
    }
    return { face: face, box: box, wheel: wheel, mesh: function () { return new Float32Array(vertices); } };
  }

  const GLASS = "#3d5c66";
  const GLASS_HI = "#6f8e93";
  const RUBBER = "#1a1c1e";
  const LIGHT_F = "#f3efd2";
  const LIGHT_R = "#b43b32";
  const BUMP = "#d5d2cb";

  function lights(B, L, W, z, w) {
    w = w || 0.3;
    B.box(W * 0.32, L / 2 - 0.03, z, w, 0.06, 0.12, LIGHT_F);
    B.box(-W * 0.32, L / 2 - 0.03, z, w, 0.06, 0.12, LIGHT_F);
    B.box(W * 0.32, -L / 2 + 0.03, z + 0.02, w * 0.9, 0.06, 0.1, LIGHT_R);
    B.box(-W * 0.32, -L / 2 + 0.03, z + 0.02, w * 0.9, 0.06, 0.1, LIGHT_R);
  }

  function carPassenger(opts) {
    const B = builder();
    const L = opts.L, W = opts.W, body = opts.body;
    const dark = shade(body, 0.72);
    const bodyH = opts.bodyH || 0.62;
    const cabinH = opts.cabinH || 0.52;
    const z0 = opts.z0 || 0.28;
    const cabinL = opts.cabinL || L * 0.48;
    const cabinY = opts.cabinY != null ? opts.cabinY : -0.05;
    const hood = opts.hood || L * 0.24;
    const ax = W * 0.48, ay = opts.axle || L * 0.30;
    const wr = opts.wr || 0.30;
    B.box(0, 0, 0.10, W * 0.86, L * 0.88, 0.16, "#2a2a2c");
    B.box(0, 0, z0, W, L * 0.98, bodyH, body);
    B.box(0, L / 2 - hood / 2 - 0.04, z0 + bodyH - 0.03, W * 0.95, hood, 0.06, dark);
    B.box(0, cabinY, z0 + bodyH, W * 0.92, cabinL, cabinH, body);
    B.box(0, cabinY + cabinL / 2 - 0.035, z0 + bodyH + 0.06, W * 0.84, 0.08, cabinH * 0.78, GLASS);
    B.box(0, cabinY - cabinL / 2 + 0.035, z0 + bodyH + 0.08, W * 0.84, 0.07, cabinH * 0.70, GLASS);
    B.box(W * 0.46, cabinY, z0 + bodyH + 0.10, 0.04, cabinL * 0.72, cabinH * 0.66, GLASS);
    B.box(-W * 0.46, cabinY, z0 + bodyH + 0.10, 0.04, cabinL * 0.72, cabinH * 0.66, GLASS);
    B.box(0, cabinY, z0 + bodyH + cabinH, W * 0.86, cabinL * 0.90, 0.05, dark);
    B.box(0, L / 2 - 0.07, z0 + 0.06, W * 0.96, 0.14, 0.18, BUMP);
    B.box(0, -L / 2 + 0.07, z0 + 0.06, W * 0.96, 0.14, 0.16, dark);
    lights(B, L, W, z0 + 0.28);
    B.wheel(ax, ay, wr); B.wheel(-ax, ay, wr);
    B.wheel(ax, -ay, wr); B.wheel(-ax, -ay, wr);
    if (opts.stripe) {
      B.box(0, cabinY, z0 + bodyH * 0.55, W + 0.03, cabinL * 1.15, 0.16, opts.stripe);
    }
    if (opts.sign) {
      B.box(0, cabinY + 0.1, z0 + bodyH + cabinH + 0.05, 0.42, 0.28, 0.16, opts.sign);
    }
    if (opts.bar) {
      B.box(0, cabinY + cabinL * 0.15, z0 + bodyH + cabinH + 0.05, W * 0.55, 0.22, 0.10, opts.bar);
      B.box(0.16, cabinY + cabinL * 0.15, z0 + bodyH + cabinH + 0.15, 0.16, 0.16, 0.08, "#d03030");
      B.box(-0.16, cabinY + cabinL * 0.15, z0 + bodyH + cabinH + 0.15, 0.16, 0.16, 0.08, "#2a5bd8");
    }
    if (opts.roofMark) {
      B.box(0, cabinY, z0 + bodyH + cabinH + 0.05, 0.55, 0.55, 0.04, opts.roofMark);
    }
    if (opts.plate) {
      B.box(0, -L / 2 + 0.01, z0 + 0.22, 0.28, 0.03, 0.10, opts.plate);
    }
    return B.mesh();
  }

  function hatch(color) {
    return carPassenger({ L: 3.95, W: 1.72, body: color, cabinL: 1.85, cabinY: -0.12, hood: 0.85, bodyH: 0.60, cabinH: 0.52, axle: 1.15 });
  }
  function sedan(color, extra) {
    return carPassenger(Object.assign({ L: 4.55, W: 1.78, body: color, cabinL: 1.95, cabinY: -0.05, hood: 1.05, bodyH: 0.60, cabinH: 0.50, axle: 1.38 }, extra || {}));
  }
  function suv(color, extra) {
    return carPassenger(Object.assign({ L: 4.80, W: 1.90, body: color, cabinL: 2.15, cabinY: -0.02, hood: 1.05, bodyH: 0.72, cabinH: 0.62, z0: 0.36, wr: 0.34, axle: 1.42 }, extra || {}));
  }

  function pickup(color) {
    const B = builder();
    const L = 5.25, W = 1.88, body = color, dark = shade(color, 0.7);
    const z0 = 0.32, bodyH = 0.68;
    B.box(0, 0, 0.12, W * 0.86, L * 0.9, 0.16, "#2a2a2c");
    B.box(0, 0.55, z0, W, 3.15, bodyH, body);
    B.box(0, 1.35, z0 + bodyH - 0.03, W * 0.95, 1.0, 0.06, dark);
    B.box(0, 0.35, z0 + bodyH, W * 0.92, 1.7, 0.58, body);
    B.box(0, 1.12, z0 + bodyH + 0.08, W * 0.84, 0.08, 0.44, GLASS);
    B.box(0, -0.42, z0 + bodyH + 0.10, W * 0.84, 0.07, 0.40, GLASS);
    B.box(W * 0.46, 0.35, z0 + bodyH + 0.10, 0.04, 1.2, 0.40, GLASS);
    B.box(-W * 0.46, 0.35, z0 + bodyH + 0.10, 0.04, 1.2, 0.40, GLASS);
    B.box(0, 0.35, z0 + bodyH + 0.58, W * 0.86, 1.55, 0.05, dark);
    B.box(0, -1.45, z0, W * 0.98, 2.2, 0.22, dark);
    B.box(0, -1.45, z0 + 0.22, 0.08, 2.15, 0.42, dark);
    B.box(W * 0.46, -1.45, z0 + 0.22, 0.08, 2.15, 0.42, dark);
    B.box(-W * 0.46, -1.45, z0 + 0.22, 0.08, 2.15, 0.42, dark);
    B.box(0, -1.45, z0 + 0.62, W * 0.98, 2.2, 0.05, shade(color, 0.85));
    B.box(0, L / 2 - 0.08, z0 + 0.06, W * 0.96, 0.14, 0.18, BUMP);
    lights(B, L, W, z0 + 0.30);
    const ax = W * 0.50, wr = 0.34;
    B.wheel(ax, 1.45, wr); B.wheel(-ax, 1.45, wr);
    B.wheel(ax, -1.45, wr); B.wheel(-ax, -1.45, wr);
    return B.mesh();
  }

  function van(color, extra) {
    extra = extra || {};
    const B = builder();
    const L = extra.L || 5.05, W = extra.W || 1.92, body = color, dark = shade(color, 0.72);
    const z0 = 0.32, H = extra.H || 1.85;
    B.box(0, 0, 0.12, W * 0.88, L * 0.9, 0.18, "#2a2a2c");
    B.box(0, 0, z0, W, L, H - z0, body);
    B.box(0, L / 2 - 0.06, z0 + 0.85, W * 0.9, 0.08, 0.55, GLASS);
    B.box(W * 0.49, 0.2, z0 + 0.9, 0.04, L * 0.62, 0.55, GLASS);
    B.box(-W * 0.49, 0.2, z0 + 0.9, 0.04, L * 0.62, 0.55, GLASS);
    B.box(0, -L / 2 + 0.06, z0 + 0.95, W * 0.8, 0.07, 0.5, GLASS);
    B.box(0, 0, H, W * 0.92, L * 0.96, 0.06, dark);
    B.box(0, L / 2 - 0.08, z0 + 0.06, W * 0.96, 0.14, 0.2, BUMP);
    B.box(0, -L / 2 + 0.08, z0 + 0.06, W * 0.96, 0.14, 0.18, dark);
    lights(B, L, W, z0 + 0.32, 0.34);
    const ax = W * 0.50, ay = L * 0.30, wr = 0.34;
    B.wheel(ax, ay, wr); B.wheel(-ax, ay, wr);
    B.wheel(ax, -ay, wr); B.wheel(-ax, -ay, wr);
    if (extra.stripe) B.box(0, 0, z0 + 0.55, W + 0.03, L * 0.92, 0.22, extra.stripe);
    if (extra.bar) {
      B.box(0, L * 0.15, H + 0.05, W * 0.55, 0.28, 0.12, extra.bar);
      B.box(0.16, L * 0.15, H + 0.17, 0.16, 0.18, 0.08, "#d03030");
      B.box(-0.16, L * 0.15, H + 0.17, 0.16, 0.18, 0.08, "#2a5bd8");
    }
    if (extra.cross) {
      B.box(0, 0.1, H + 0.06, 0.50, 0.14, 0.05, extra.cross);
      B.box(0, 0.1, H + 0.06, 0.14, 0.50, 0.05, extra.cross);
    }
    if (extra.sideCross) {
      B.box(W * 0.51, 0.2, z0 + 1.15, 0.03, 0.36, 0.10, extra.sideCross);
      B.box(W * 0.51, 0.2, z0 + 1.15, 0.03, 0.10, 0.36, extra.sideCross);
    }
    return B.mesh();
  }

  function taxi() {
    const B = builder();
    // rebuild sedan then add checkers — easier to call carPassenger with extras
    return sedan("#e6c22e", { sign: "#2a2a2c", stripe: "#1a1a1a" });
  }

  const CAB_L = 2.20;

  function truckCab(B, yCab, W, cabColor) {
    const z0 = 0.42;
    const rearY = yCab - CAB_L / 2;
    const frontY = yCab + CAB_L / 2;
    B.box(0, yCab, z0, W, CAB_L, 1.05, cabColor);
    // cabine alta alinhada na traseira da base, para o baú encostar sem vão
    const upperL = 1.92;
    const upperY = rearY + upperL / 2;
    B.box(0, upperY, z0 + 1.05, W * 0.95, upperL, 0.85, cabColor);
    B.box(0, upperY + upperL / 2 - 0.08, z0 + 1.18, W * 0.88, 0.10, 0.62, GLASS);
    B.box(W * 0.48, upperY, z0 + 1.22, 0.05, upperL * 0.72, 0.55, GLASS);
    B.box(-W * 0.48, upperY, z0 + 1.22, 0.05, upperL * 0.72, 0.55, GLASS);
    B.box(0, upperY, z0 + 1.90, W * 0.9, upperL * 0.92, 0.08, shade(cabColor, 0.7));
    B.box(0, frontY - 0.07, z0 + 0.2, W * 0.96, 0.14, 0.22, BUMP);
    B.box(W * 0.32, frontY - 0.04, z0 + 0.45, 0.32, 0.07, 0.14, LIGHT_F);
    B.box(-W * 0.32, frontY - 0.04, z0 + 0.45, 0.32, 0.07, 0.14, LIGHT_F);
    const wr = 0.42, ax = W * 0.52;
    B.wheel(ax, yCab + 0.55, wr); B.wheel(-ax, yCab + 0.55, wr);
    return { rearY: rearY, frontY: frontY, yCab: yCab };
  }

  function cargoBox(B, cab, rearLimit, W, h, color, extra) {
    extra = extra || {};
    // frente do baú encosta na traseira da cabine (leve overlap para não restar fresta)
    const front = cab.rearY + 0.05;
    const rear = rearLimit;
    const boxL = Math.max(1.2, front - rear);
    const boxY = (front + rear) / 2;
    B.box(0, boxY, extra.z0 != null ? extra.z0 : 0.9, W, boxL, h, color);
    if (extra.roof !== false) {
      B.box(0, boxY, (extra.z0 != null ? extra.z0 : 0.9) + h, W * 0.98, boxL * 0.98, 0.08, shade(color, 0.75));
    }
    return { boxY: boxY, boxL: boxL, front: front, rear: rear };
  }

  function truckBau(cab, boxCol, L, extra) {
    extra = extra || {};
    const B = builder();
    const W = extra.W || 2.48;
    const yCab = L / 2 - CAB_L / 2 - 0.04;
    const cabG = truckCab(B, yCab, W * 0.92, cab);
    const boxH = extra.boxH || 2.4;
    const cargo = cargoBox(B, cabG, -L / 2 + 0.08, W, boxH, boxCol);
    const wr = 0.42, ax = W * 0.52;
    B.wheel(ax, cargo.boxY - cargo.boxL * 0.28, wr); B.wheel(-ax, cargo.boxY - cargo.boxL * 0.28, wr);
    B.wheel(ax, cargo.boxY + cargo.boxL * 0.22, wr); B.wheel(-ax, cargo.boxY + cargo.boxL * 0.22, wr);
    if (extra.bar) {
      B.box(0, cabG.yCab + 0.2, 2.45, 0.9, 0.25, 0.14, "#333");
      B.box(0.18, cabG.yCab + 0.2, 2.58, 0.18, 0.18, 0.1, "#d03030");
      B.box(-0.18, cabG.yCab + 0.2, 2.58, 0.18, 0.18, 0.1, "#f4f0d0");
    }
    return B.mesh();
  }

  function carreta() {
    const B = builder();
    const L = 16.4, W = 2.55;
    const yCab = L / 2 - CAB_L / 2 - 0.04;
    const cabG = truckCab(B, yCab, 2.35, "#3a3d42");
    const cargo = cargoBox(B, cabG, -L / 2 + 0.08, W, 2.55, "#1e5fd6");
    const wr = 0.42, ax = W * 0.54, trY = cargo.boxY;
    B.wheel(ax, trY - 4.2, wr); B.wheel(-ax, trY - 4.2, wr);
    B.wheel(ax, trY - 3.3, wr); B.wheel(-ax, trY - 3.3, wr);
    B.wheel(ax, trY + 3.6, wr); B.wheel(-ax, trY + 3.6, wr);
    return B.mesh();
  }

  function pipa() {
    const B = builder();
    const L = 8.0, W = 2.48;
    const yCab = L / 2 - CAB_L / 2 - 0.04;
    const cabG = truckCab(B, yCab, 2.3, "#1f6bab");
    const tL = cabG.rearY + 0.05 - (-L / 2 + 0.1);
    const tY = (cabG.rearY + 0.05 + (-L / 2 + 0.1)) / 2;
    // faceted tank
    const r = 1.05, n = 8;
    for (let i = 0; i < n; i++) {
      const a = i * 2 * Math.PI / n, b = (i + 1) * 2 * Math.PI / n;
      const z0 = 1.55;
      B.face([
        [-W * 0.02, tY - tL / 2, z0 + Math.sin(a) * r],
        [-W * 0.02, tY + tL / 2, z0 + Math.sin(a) * r],
        [-W * 0.02, tY + tL / 2, z0 + Math.sin(b) * r],
        [-W * 0.02, tY - tL / 2, z0 + Math.sin(b) * r]
      ], i % 2 ? "#1f6bab" : "#eef2f6");
      B.face([
        [W * 0.02, tY + tL / 2, z0 + Math.sin(a) * r],
        [W * 0.02, tY - tL / 2, z0 + Math.sin(a) * r],
        [W * 0.02, tY - tL / 2, z0 + Math.sin(b) * r],
        [W * 0.02, tY + tL / 2, z0 + Math.sin(b) * r]
      ], i % 2 ? "#1f6bab" : "#eef2f6");
    }
    B.box(0, tY, 1.0, 2.0, tL, 0.2, "#1f6bab");
    const wr = 0.42, ax = 1.25;
    B.wheel(ax, tY - 1.3, wr); B.wheel(-ax, tY - 1.3, wr);
    return B.mesh();
  }

  function lixo() {
    const B = builder();
    const L = 8.4, W = 2.5;
    const yCab = L / 2 - CAB_L / 2 - 0.04;
    const cabG = truckCab(B, yCab, 2.3, "#d35412");
    const cargo = cargoBox(B, cabG, -L / 2 + 0.08, W, 2.15, "#e06a1a", { z0: 0.95 });
    const bY = cargo.boxY, bL = cargo.boxL;
    B.box(0, bY + 0.2, 3.10, W * 0.85, bL * 0.7, 0.45, "#b8440e");
    B.box(0, cargo.rear + 0.2, 1.4, W * 0.7, 0.3, 1.1, "#8a8a8a");
    const wr = 0.42, ax = 1.28;
    B.wheel(ax, bY - bL * 0.28, wr); B.wheel(-ax, bY - bL * 0.28, wr);
    B.wheel(ax, bY + bL * 0.22, wr); B.wheel(-ax, bY + bL * 0.22, wr);
    return B.mesh();
  }

  function betoneira() {
    const B = builder();
    const L = 8.3, W = 2.5;
    const yCab = L / 2 - CAB_L / 2 - 0.04;
    const cabG = truckCab(B, yCab, 2.3, "#e2a028");
    const drumFront = cabG.rearY + 0.05;
    const drumRear = -L / 2 + 0.25;
    const tY = (drumFront + drumRear) / 2;
    const halfBack = tY - drumRear, halfFront = drumFront - tY;
    B.box(0, tY, 0.9, 2.1, drumFront - drumRear, 0.25, "#c9c4af");
    const r = 1.05, n = 8, z0 = 1.9;
    for (let i = 0; i < n; i++) {
      const a = i * 2 * Math.PI / n, b = (i + 1) * 2 * Math.PI / n;
      const col = i % 2 ? "#d8d3c6" : "#e2a028";
      B.face([
        [Math.cos(a) * r, tY - halfBack, z0 + Math.sin(a) * r],
        [Math.cos(a) * r, tY + halfFront, z0 + Math.sin(a) * r],
        [Math.cos(b) * r, tY + halfFront, z0 + Math.sin(b) * r],
        [Math.cos(b) * r, tY - halfBack, z0 + Math.sin(b) * r]
      ], col);
    }
    const wr = 0.42, ax = 1.28;
    B.wheel(ax, tY - halfBack * 0.45, wr); B.wheel(-ax, tY - halfBack * 0.45, wr);
    return B.mesh();
  }

  function guincho() {
    const B = builder();
    const L = 7.4, W = 2.35;
    const yCab = L / 2 - CAB_L / 2 - 0.04;
    const cabG = truckCab(B, yCab, 2.2, "#f0f0ea");
    const cargo = cargoBox(B, cabG, -L / 2 + 0.08, W, 0.22, "#3a3d42", { z0: 0.95, roof: false });
    const bY = cargo.boxY, bL = cargo.boxL;
    B.box(0, bY + 0.15, 1.17, 0.22, bL * 0.7, 0.18, "#c9a227");
    B.box(0, cargo.rear + 0.28, 1.4, 0.18, 0.18, 0.9, "#c9a227");
    const wr = 0.42, ax = 1.2;
    B.wheel(ax, bY - bL * 0.28, wr); B.wheel(-ax, bY - bL * 0.28, wr);
    return B.mesh();
  }

  function bombeiros() {
    const B = builder();
    const L = 8.8, W = 2.5;
    const yCab = L / 2 - CAB_L / 2 - 0.04;
    const cabG = truckCab(B, yCab, 2.35, "#c41f1a");
    const cargo = cargoBox(B, cabG, -L / 2 + 0.08, W, 2.15, "#c41f1a", { z0: 0.95 });
    const bY = cargo.boxY, bL = cargo.boxL;
    B.box(0, bY, 2.0, W + 0.03, bL * 0.9, 0.16, "#f4f2ec");
    B.box(0, bY, 3.10, 0.28, bL * 0.85, 0.22, "#b0b0b0");
    B.box(0, cabG.yCab + 0.1, 2.55, 1.0, 0.28, 0.14, "#333");
    B.box(0.2, cabG.yCab + 0.1, 2.68, 0.2, 0.2, 0.1, "#d03030");
    B.box(-0.2, cabG.yCab + 0.1, 2.68, 0.2, 0.2, 0.1, "#f4f0d0");
    const wr = 0.42, ax = 1.28;
    B.wheel(ax, bY - bL * 0.28, wr); B.wheel(-ax, bY - bL * 0.28, wr);
    B.wheel(ax, bY + bL * 0.22, wr); B.wheel(-ax, bY + bL * 0.22, wr);
    return B.mesh();
  }

  function onibus(opts) {
    const B = builder();
    const L = opts.L, W = opts.W, body = opts.body, dark = shade(body, 0.7);
    const accent = opts.accent || "#235b46";
    const z0 = 0.42, H = opts.H || 2.85;
    B.box(0, 0, 0.18, W * 0.9, L * 0.92, 0.22, "#2a2a2c");
    B.box(0, 0, z0, W, L, H - z0, body);
    B.box(0, 0, z0 + 0.7, W + 0.03, L * 0.96, 0.22, accent);
    B.box(0, 0, z0 + 1.15, W * 1.01, L * 0.92, 0.7, "#2a454c");
    B.box(0, L / 2 - 0.05, z0 + 1.25, W * 0.88, 0.08, 0.7, GLASS_HI);
    B.box(0, -L / 2 + 0.05, z0 + 1.3, W * 0.8, 0.07, 0.55, GLASS);
    B.box(0, 0, H, W * 0.95, L * 0.98, 0.1, dark);
    B.box(0, L / 2 - 0.08, z0 + 0.1, W * 0.96, 0.14, 0.22, shade(accent, 0.85));
    B.box(0, -L / 2 + 0.08, z0 + 0.1, W * 0.96, 0.14, 0.2, LIGHT_R);
    const wr = 0.44, ax = W * 0.52, mid = L * 0.32;
    B.wheel(ax, mid, wr); B.wheel(-ax, mid, wr);
    B.wheel(ax, -mid, wr); B.wheel(-ax, -mid, wr);
    if (opts.band) B.box(0, 0, z0 + 0.95, W + 0.04, L * 0.9, 0.14, opts.band);
    return B.mesh();
  }

  function moto(color, boxCol) {
    const B = builder();
    const L = boxCol ? 2.2 : 2.15, W = 0.55;
    B.box(0, 0.1, 0.55, 0.22, 1.15, 0.18, color);
    B.box(0, 0.05, 0.72, 0.32, 0.7, 0.16, shade(color, 0.8));
    B.box(0, 0.55, 0.95, 0.12, 0.12, 0.55, RUBBER);
    B.box(0, 0.55, 1.45, 0.42, 0.12, 0.12, RUBBER);
    B.box(0, -0.15, 0.85, 0.36, 0.5, 0.12, shade(color, 0.6));
    B.wheel(0, 0.72, 0.28, 0.12, 0.28);
    B.wheel(0, -0.72, 0.30, 0.12, 0.30);
    if (boxCol) B.box(0, -0.55, 0.95, 0.42, 0.36, 0.4, boxCol);
    return B.mesh();
  }

  function bike() {
    const B = builder();
    B.box(0, 0, 0.55, 0.06, 1.15, 0.06, "#2a2a2a");
    B.box(0, 0.15, 0.9, 0.06, 0.06, 0.45, "#2a2a2a");
    B.box(0, 0.15, 1.32, 0.35, 0.08, 0.06, "#2a2a2a");
    B.box(0, -0.15, 0.82, 0.16, 0.28, 0.06, "#c4342a");
    B.wheel(0, 0.62, 0.28, 0.07, 0.28);
    B.wheel(0, -0.62, 0.28, 0.07, 0.28);
    return B.mesh();
  }

  function patinete() {
    const B = builder();
    B.box(0, 0, 0.14, 0.22, 1.05, 0.06, "#2d2d30");
    B.box(0, 0.42, 0.18, 0.06, 0.06, 0.95, "#3a8fd4");
    B.box(0, 0.42, 1.12, 0.32, 0.08, 0.06, "#3a8fd4");
    B.wheel(0, 0.42, 0.12, 0.06, 0.12);
    B.wheel(0, -0.42, 0.12, 0.06, 0.12);
    return B.mesh();
  }

  function models() {
    return {
      "hatch-azul": hatch("#1e5fd6"),
      "hatch-vermelho": hatch("#e03131"),
      "hatch-amarelo": hatch("#f0c400"),
      "hatch-verde": hatch("#1f9a4a"),
      "hatch-branco": hatch("#f7f6f2"),
      "sedan-prata": sedan("#c5c8cc"),
      "sedan-preto": sedan("#2a2c2e"),
      "sedan-vermelho": sedan("#e03131"),
      "sedan-azul": sedan("#1e5fd6"),
      "sedan-amarelo": sedan("#f0c400"),
      "sedan-verde": sedan("#1f9a4a"),
      "sedan-branco": sedan("#f7f6f2"),
      "suv-branco": suv("#f2f0ea"),
      "suv-vermelho": suv("#e03131"),
      "suv-azul": suv("#1e5fd6"),
      "suv-verde": suv("#1f9a4a"),
      "suv-amarelo": suv("#f0c400"),
      "picape-prata": pickup("#b7bcc2"),
      "picape-azul": pickup("#1e5fd6"),
      "picape-vermelha": pickup("#e03131"),
      "picape-branca": pickup("#f7f6f2"),
      "van": van("#ece8de"),
      "van-azul": van("#1e5fd6"),
      "van-verde": van("#1f9a4a"),
      "van-vermelha": van("#e03131"),
      "van-branca": van("#f7f6f2"),
      "taxi": sedan("#e6c22e", { sign: "#2a2a2c", stripe: "#1a1a1a" }),
      "uber": sedan("#f4f1ea", { sign: "#1a1a1a" }),
      "comprista-py": sedan("#f0eee8", { plate: "#d01818" }),
      "comprista-ar": suv("#c5d4e0", { plate: "#75a8d6" }),
      "moto": moto("#2c3d7a"),
      "moto-entrega": moto("#c4342a", "#e6c22e"),
      "bicicleta": bike(),
      "patinete": patinete(),
      "kombi-escolar": van("#e8c44a", { L: 4.55, W: 1.82, H: 1.85, stripe: "#1a1a1a" }),
      "onibus-urbano": onibus({ L: 12.0, W: 2.50, body: "#eee5c8", accent: "#235b46" }),
      "onibus-turismo": onibus({ L: 13.0, W: 2.55, body: "#d8dde3", accent: "#2a4a7a", band: "#c5a15d" }),
      "micro-onibus": onibus({ L: 7.6, W: 2.25, body: "#e7e0cc", accent: "#3a5c4a", H: 2.65 }),
      "caminhao-bau": truckBau("#4a4c50", "#e03131", 8.2),
      "caminhao-bau-vermelho": truckBau("#4a4c50", "#e03131", 8.2),
      "caminhao-bau-azul": truckBau("#3a4658", "#1e5fd6", 8.2),
      "caminhao-bau-verde": truckBau("#3d5a3a", "#1f9a4a", 8.2),
      "caminhao-bau-amarelo": truckBau("#5a5240", "#f0c400", 8.2),
      "caminhao-bau-branco": truckBau("#5a5a5c", "#f4f1ea", 8.2),
      "carreta": carreta(),
      "caminhao-pipa": pipa(),
      "caminhao-lixo": lixo(),
      "betoneira": betoneira(),
      "guincho": guincho(),
      "samu": van("#f4f2ec", { L: 5.6, W: 2.1, H: 2.15, stripe: "#c4191f", bar: "#333333", cross: "#c4191f", sideCross: "#c4191f" }),
      "viatura-pm": sedan("#f3f1ec", { stripe: "#1c3f8a", bar: "#333333" }),
      "viatura-guarda": suv("#f3f1ec", { stripe: "#1e5c45", bar: "#333333" }),
      "bombeiros": bombeiros(),
      "receita-pf": suv("#2c3238", { stripe: "#c9a227" })
    };
  }

  function createLayer(map, options) {
    options = options || {};
    const meshMap = options.meshes || models();
    const types = Object.keys(meshMap);
    const anchor = options.anchor || [-54.58, -25.53];
    const matrixBuffer = new Float32Array(16);
    const minzoom = options.minzoom != null ? options.minzoom : 14.0;
    let gl, program, origin, unit, instancing, dirty = true, current = [], viewKey = "";
    const buffers = {};
    const inst = {};
    types.forEach(function (id) {
      inst[id] = { capacity: 16, data: new Float32Array(64), count: 0, buf: null };
    });
    let enabled = options.visible !== false;
    const stats = { visible: 0, active: 0, drawCalls: 0 };

    const layer = {
      id: options.id || "foz-transito-cars3d",
      type: "custom",
      renderingMode: "3d",
      stats: stats,
      onAdd: function (m, g) {
        gl = g;
        origin = root.maplibregl.MercatorCoordinate.fromLngLat(anchor);
        unit = origin.meterInMercatorCoordinateUnits();
        function shader(type, src) {
          const s = gl.createShader(type);
          gl.shaderSource(s, src);
          gl.compileShader(s);
          if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(s));
          return s;
        }
        program = gl.createProgram();
        const vs = shader(gl.VERTEX_SHADER,
          "precision highp float; attribute vec3 a_pos; attribute vec3 a_normal; attribute vec3 a_color; attribute vec4 a_instance; uniform mat4 u_matrix; uniform float u_scale; varying vec3 v_color; void main(){float c=a_instance.z;float s=a_instance.w;vec3 p=vec3(a_pos.x*c+a_pos.y*s,a_pos.x*s-a_pos.y*c,a_pos.z)*u_scale+vec3(a_instance.xy,0.0);vec3 n=vec3(a_normal.x*c+a_normal.y*s,a_normal.x*s-a_normal.y*c,a_normal.z);float light=0.62+0.38*max(dot(normalize(n),normalize(vec3(-0.45,0.28,0.85))),0.0);v_color=a_color*light;gl_Position=u_matrix*vec4(p,1.0);}");
        const fs = shader(gl.FRAGMENT_SHADER,
          "precision mediump float; varying vec3 v_color; void main(){gl_FragColor=vec4(v_color,1.0);}");
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(program));
        gl.deleteShader(vs);
        gl.deleteShader(fs);
        types.forEach(function (id) {
          const buf = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, buf);
          gl.bufferData(gl.ARRAY_BUFFER, meshMap[id], gl.STATIC_DRAW);
          buffers[id] = { glbuf: buf, verts: meshMap[id].length / 9 };
          inst[id].buf = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, inst[id].buf);
          gl.bufferData(gl.ARRAY_BUFFER, inst[id].data.byteLength, gl.DYNAMIC_DRAW);
        });
        layer.attributes = ["a_pos", "a_normal", "a_color"].map(function (n) { return gl.getAttribLocation(program, n); });
        layer.instance = gl.getAttribLocation(program, "a_instance");
        layer.matrix = gl.getUniformLocation(program, "u_matrix");
        layer.scale = gl.getUniformLocation(program, "u_scale");
        const ext = gl.drawArraysInstanced ? null : gl.getExtension("ANGLE_instanced_arrays");
        instancing = gl.drawArraysInstanced
          ? { divisor: function (a, n) { gl.vertexAttribDivisor(a, n); }, draw: function (v, n) { gl.drawArraysInstanced(gl.TRIANGLES, 0, v, n); } }
          : ext
            ? { divisor: function (a, n) { ext.vertexAttribDivisorANGLE(a, n); }, draw: function (v, n) { ext.drawArraysInstancedANGLE(gl.TRIANGLES, 0, v, n); } }
            : null;
      },
      setVisible: function (v) { enabled = v; map.triggerRepaint(); },
      setVehicles: function (list) { current = list || []; dirty = true; map.triggerRepaint(); },
      render: function (g, matrix) {
        if (!enabled || !gl || map.getZoom() < minzoom) { stats.visible = 0; return; }
        const bounds = map.getBounds();
        const key = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth(), map.getZoom().toFixed(2)].join(",");
        if (key !== viewKey) { viewKey = key; dirty = true; }
        if (dirty) {
          types.forEach(function (id) { inst[id].count = 0; });
          const margin = options.margin != null ? options.margin : 0.012;
          const w = bounds.getWest() - margin, e = bounds.getEast() + margin;
          const s = bounds.getSouth() - margin, n = bounds.getNorth() + margin;
          for (let i = 0; i < current.length; i++) {
            const b = current[i];
            const c = b.coordinates;
            if (!c || c[0] < w || c[0] > e || c[1] < s || c[1] > n) continue;
            const id = meshMap[b.type] ? b.type : "sedan-prata";
            const slot = inst[id];
            if (slot.count >= slot.capacity) {
              slot.capacity *= 2;
              const next = new Float32Array(slot.capacity * 4);
              next.set(slot.data);
              slot.data = next;
              gl.bindBuffer(gl.ARRAY_BUFFER, slot.buf);
              gl.bufferData(gl.ARRAY_BUFFER, slot.data.byteLength, gl.DYNAMIC_DRAW);
            }
            const p = root.maplibregl.MercatorCoordinate.fromLngLat(c);
            const r = (b.heading || 0) * Math.PI / 180;
            const o = slot.count * 4;
            slot.data[o] = (p.x - origin.x) / unit;
            slot.data[o + 1] = (p.y - origin.y) / unit;
            slot.data[o + 2] = Math.cos(r);
            slot.data[o + 3] = Math.sin(r);
            slot.count++;
          }
          let vis = 0;
          types.forEach(function (id) {
            const slot = inst[id];
            if (!slot.count) return;
            gl.bindBuffer(gl.ARRAY_BUFFER, slot.buf);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, slot.data.subarray(0, slot.count * 4));
            vis += slot.count;
          });
          stats.visible = vis;
          stats.active = current.length;
          dirty = false;
        }
        if (!stats.visible) { stats.drawCalls = 0; return; }
        gl.useProgram(program);
        for (let row = 0; row < 4; row++) {
          matrixBuffer[row] = matrix[row] * unit;
          matrixBuffer[4 + row] = matrix[4 + row] * unit;
          matrixBuffer[8 + row] = matrix[8 + row] * unit;
          matrixBuffer[12 + row] = matrix[row] * origin.x + matrix[4 + row] * origin.y + matrix[12 + row];
        }
        gl.uniformMatrix4fv(layer.matrix, false, matrixBuffer);
        const z = map.getZoom();
        const sc = (options.scale != null) ? options.scale : (1.45 * Math.min(36, Math.max(1, Math.pow(2, 16.6 - z))));
        gl.uniform1f(layer.scale, sc);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.depthMask(true);
        gl.disable(gl.CULL_FACE);
        gl.disable(gl.BLEND);
        let draws = 0;
        types.forEach(function (id) {
          const slot = inst[id];
          if (!slot.count) return;
          const mesh = buffers[id];
          gl.bindBuffer(gl.ARRAY_BUFFER, mesh.glbuf);
          layer.attributes.forEach(function (a, i) {
            gl.enableVertexAttribArray(a);
            gl.vertexAttribPointer(a, 3, gl.FLOAT, false, 36, i * 12);
          });
          if (instancing) {
            gl.bindBuffer(gl.ARRAY_BUFFER, slot.buf);
            gl.enableVertexAttribArray(layer.instance);
            gl.vertexAttribPointer(layer.instance, 4, gl.FLOAT, false, 16, 0);
            instancing.divisor(layer.instance, 1);
            instancing.draw(mesh.verts, slot.count);
            instancing.divisor(layer.instance, 0);
            gl.disableVertexAttribArray(layer.instance);
          } else {
            gl.disableVertexAttribArray(layer.instance);
            for (let i = 0; i < slot.count; i++) {
              const j = i * 4;
              gl.vertexAttrib4f(layer.instance, slot.data[j], slot.data[j + 1], slot.data[j + 2], slot.data[j + 3]);
              gl.drawArrays(gl.TRIANGLES, 0, mesh.verts);
            }
          }
          draws++;
        });
        stats.drawCalls = draws;
      },
      onRemove: function () {
        types.forEach(function (id) {
          if (buffers[id]) gl.deleteBuffer(buffers[id].glbuf);
          if (inst[id].buf) gl.deleteBuffer(inst[id].buf);
        });
        if (program) gl.deleteProgram(program);
      }
    };
    return layer;
  }

  root.FozTrafego3D = { models: models, createLayer: createLayer };
  if (typeof module !== "undefined") module.exports = root.FozTrafego3D;
})(typeof window !== "undefined" ? window : globalThis);
