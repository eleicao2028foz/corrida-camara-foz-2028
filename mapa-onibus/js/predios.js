/* Civic buildings: retro-library volumes + wall-mounted facade signs (WebGL). */
(function (root) {
  "use strict";

  const BEFORE_BUS = ["sim-bus-icons", "sim-bus-labels"];
  let cfg = null;
  let volumes = null;
  let map = null;
  let timer = 0;
  let fontsReady = false;
  const stats = { loaded: 0, visible: 0, bytes: 0, parts: 0, signs: 0 };

  function beforeId() {
    for (const id of BEFORE_BUS) if (map.getLayer(id)) return id;
    if (map.getLayer("veg-trees")) return "veg-trees";
    if (map.getLayer("street-labels")) return "street-labels";
    return undefined;
  }

  function snapshotBaseFilters() {
    if (snapshotBaseFilters.done) return;
    snapshotBaseFilters.done = true;
    snapshotBaseFilters.filters = {};
    for (const id of [
      "footprints-flat",
      "footprints-walls",
      "footprints-roofs",
      "retro-architecture",
      "veg-trees",
      "veg-bushes",
    ]) {
      if (map.getLayer(id)) snapshotBaseFilters.filters[id] = map.getFilter(id) || null;
    }
  }

  function hideByIds(ids) {
    if (!ids || !ids.length) return null;
    return ["!", ["in", ["id"], ["literal", ids]]];
  }

  function applyLayerFilter(layerId, hide) {
    if (!map.getLayer(layerId)) return;
    const prior = snapshotBaseFilters.filters ? snapshotBaseFilters.filters[layerId] : map.getFilter(layerId);
    if (!hide) {
      map.setFilter(layerId, prior || null);
      return;
    }
    const tagged = ["all", hide];
    if (prior) tagged.push(prior);
    map.setFilter(layerId, tagged);
  }

  function applyExclusion() {
    snapshotBaseFilters();
    const ids = (cfg && cfg.exclude_building_ids) || [];
    const hideB = hideByIds(ids);
    applyLayerFilter("footprints-flat", hideB);
    applyLayerFilter("footprints-walls", hideB);
    applyLayerFilter("footprints-roofs", hideB);
  }

  function inView(b, bounds, pad) {
    return (
      b.lon >= bounds.getWest() - pad &&
      b.lon <= bounds.getEast() + pad &&
      b.lat >= bounds.getSouth() - pad &&
      b.lat <= bounds.getNorth() + pad
    );
  }

  async function fetchGzipJson(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error("Falha ao carregar " + url + " (" + r.status + ")");
    const data = await new Response(r.body.pipeThrough(new DecompressionStream("gzip"))).arrayBuffer();
    stats.bytes += data.byteLength;
    return JSON.parse(new TextDecoder().decode(data));
  }

  function retroCanvas(w, h, draw) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const g = c.getContext("2d");
    g.imageSmoothingEnabled = false;
    draw(g, w, h);
    return g.getImageData(0, 0, w, h);
  }

  function paintWall(g, p) {
    const k = p.family;
    const frame = p.frame || p.trim;
    g.fillStyle = k === 7 ? p.glass : p.wall;
    g.fillRect(0, 0, 64, 64);
    if (k === 7) {
      for (let x = 0; x < 64; x += 8) {
        g.fillStyle = x % 16 ? "#9cb8ba" : "#e8eef0";
        g.fillRect(x, 0, 1, 64);
      }
      for (let y = 0; y < 64; y += 12) {
        g.fillStyle = frame;
        g.fillRect(0, y, 64, 2);
      }
      g.fillStyle = "#c1dddd38";
      g.fillRect(8, 0, 7, 64);
      g.fillRect(32, 0, 12, 64);
    } else {
      const dy = k < 2 ? 32 : 20;
      const dx = k < 4 ? 20 : 16;
      for (let y = 0; y < 64; y += dy) {
        g.fillStyle = frame;
        g.fillRect(0, y + dy - 2, 64, 2);
        for (let x = 5; x < 64; x += dx) {
          g.fillStyle = frame;
          g.fillRect(x - 1, y + 4, 12, 11);
          g.fillStyle = p.glass;
          g.fillRect(x, y + 4, 10, 9);
          g.fillStyle = "#a8c5c4";
          g.fillRect(x + 1, y + 5, 3, 6);
          g.fillStyle = "#eee5c6";
          g.fillRect(x + 5, y + 4, 1, 9);
          g.fillRect(x - 1, y + 13, 12, 2);
          if (k === 2 || k === 6 || k === 9) {
            g.fillStyle = "#596b683d";
            g.fillRect(x - 2, y + 14, 15, 2);
            g.fillStyle = frame;
            g.fillRect(x - 2, y + 12, 15, 2);
          }
          if (k === 1) {
            g.fillStyle = frame;
            g.fillRect(x - 3, y + 4, 2, 9);
            g.fillRect(x + 11, y + 4, 2, 9);
          }
        }
      }
      if (k === 3 || k === 6 || k === 8) {
        g.fillStyle = p.trim;
        for (let x = 0; x < 64; x += 32) g.fillRect(x, 0, 3, 64);
      }
      if (k === 4 || k === 5) {
        g.fillStyle = p.glass;
        g.fillRect(3, 42, 58, 18);
        g.fillStyle = p.trim;
        g.fillRect(0, 39, 64, 4);
        for (let x = 0; x < 64; x += 8) {
          g.fillStyle = frame;
          g.fillRect(x, 32, 4, 7);
        }
        g.fillStyle = p.trim;
        for (let x = 0; x < 64; x += 16) g.fillRect(x, 42, 2, 18);
      }
    }
    if (k === 8) {
      g.fillStyle = p.trim;
      for (let x = 1; x < 64; x += 21) {
        g.fillRect(x, 0, 3, 64);
        g.fillRect(x + 5, 0, 1, 64);
      }
      g.fillStyle = p.trim;
      g.fillRect(0, 0, 64, 5);
    }
    if (k === 9) {
      g.fillStyle = p.trim;
      for (let y = 16; y < 64; y += 20) g.fillRect(0, y, 64, 4);
      g.fillStyle = frame;
      for (let x = 4; x < 64; x += 20) g.fillRect(x, 15, 7, 3);
    }
  }

  function paintRoof(g, p) {
    const pitched = p.family < 4;
    g.fillStyle = p.roof;
    g.fillRect(0, 0, 64, 64);
    if (pitched) {
      for (let y = 0; y < 64; y += 8) {
        g.fillStyle = "rgba(120,70,50,0.18)";
        g.fillRect(0, y, 64, 1);
        for (let x = y % 16 ? 4 : 0; x < 64; x += 8) {
          g.fillStyle = "rgba(255,230,200,0.28)";
          g.fillRect(x, y + 1, 2, 6);
          g.fillStyle = "rgba(140,80,70,0.18)";
          g.fillRect(x + 6, y + 1, 1, 7);
        }
      }
    } else {
      g.fillStyle = "rgba(255,255,255,0.28)";
      g.fillRect(0, 0, 64, 3);
      g.fillRect(0, 0, 3, 64);
      g.fillStyle = "rgba(90,100,100,0.22)";
      g.fillRect(60, 0, 4, 64);
      g.fillRect(0, 60, 64, 4);
    }
  }

  function registerCivicPatterns() {
    const styles = (cfg && cfg.styles) || {};
    for (const [id, p] of Object.entries(styles)) {
      const wall = "civic-wall-" + id;
      const roof = "civic-roof-" + id;
      if (map.hasImage(wall)) map.removeImage(wall);
      if (map.hasImage(roof)) map.removeImage(roof);
      map.addImage(wall, retroCanvas(64, 64, (g) => paintWall(g, p)), { pixelRatio: 2 });
      map.addImage(roof, retroCanvas(64, 64, (g) => paintRoof(g, p)), { pixelRatio: 2 });
    }
  }

  function ensureLayers() {
    if (!map.getSource("predios-volumes")) {
      map.addSource("predios-volumes", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
    }
    const before = beforeId();
    const minz = cfg.minzoom || 15;
    if (!map.getLayer("predios-civic-walls")) {
      map.addLayer(
        {
          id: "predios-civic-walls",
          type: "fill-extrusion",
          source: "predios-volumes",
          filter: ["==", ["get", "role"], "wall"],
          minzoom: minz,
          paint: {
            "fill-extrusion-color": ["coalesce", ["get", "color"], "#efe7db"],
            "fill-extrusion-pattern": ["get", "pattern"],
            "fill-extrusion-height": ["get", "height"],
            "fill-extrusion-base": ["get", "base"],
            "fill-extrusion-opacity": ["interpolate", ["linear"], ["zoom"], 15, 0.92, 15.5, 1],
            "fill-extrusion-vertical-gradient": true,
          },
        },
        before
      );
    }
    if (!map.getLayer("predios-civic-caps")) {
      map.addLayer(
        {
          id: "predios-civic-caps",
          type: "fill-extrusion",
          source: "predios-volumes",
          filter: ["==", ["get", "role"], "cap"],
          minzoom: minz,
          paint: {
            "fill-extrusion-color": ["coalesce", ["get", "color"], "#c98968"],
            "fill-extrusion-pattern": ["get", "pattern"],
            "fill-extrusion-height": ["get", "height"],
            "fill-extrusion-base": ["get", "base"],
            "fill-extrusion-opacity": 1,
            "fill-extrusion-vertical-gradient": false,
          },
        },
        before
      );
    }
    if (!map.getLayer("predios-civic-details")) {
      map.addLayer(
        {
          id: "predios-civic-details",
          type: "fill-extrusion",
          source: "predios-volumes",
          filter: ["==", ["get", "role"], "detail"],
          minzoom: minz,
          paint: {
            "fill-extrusion-color": ["get", "color"],
            "fill-extrusion-height": ["get", "height"],
            "fill-extrusion-base": ["get", "base"],
            "fill-extrusion-opacity": 1,
            "fill-extrusion-vertical-gradient": true,
          },
        },
        before
      );
    }
    if (!map.getLayer("predios-plaza")) {
      map.addLayer(
        {
          id: "predios-plaza",
          type: "fill-extrusion",
          source: "predios-volumes",
          filter: ["==", ["get", "role"], "plaza"],
          minzoom: 16.5,
          paint: {
            "fill-extrusion-color": ["get", "color"],
            "fill-extrusion-height": ["get", "height"],
            "fill-extrusion-base": ["get", "base"],
            "fill-extrusion-opacity": 1,
            "fill-extrusion-vertical-gradient": true,
          },
        },
        before
      );
    }
        if (!map.getLayer("predios-parking")) {
      map.addLayer(
        {
          id: "predios-parking",
          type: "fill-extrusion",
          source: "predios-volumes",
          filter: ["==", ["get", "role"], "parking"],
          minzoom: 16.5,
          paint: {
            "fill-extrusion-color": ["get", "color"],
            "fill-extrusion-height": ["get", "height"],
            "fill-extrusion-base": ["get", "base"],
            "fill-extrusion-opacity": 1,
            "fill-extrusion-vertical-gradient": true,
          },
        },
        before
      );
    }
    ensureSignLayer(before);
  }

  /* ---------- wall-mounted sign quads (custom 3D layer) ---------- */

  const ATLAS_COLS = 4;
  const ATLAS_ROWS = 4;
  const CELL_W = 2048;
  const CELL_H = 512;
  let signLayer = null;
  let atlasCanvas = null;
  let atlasIndex = {};

  async function loadSignFonts() {
    if (fontsReady) return;
    try {
      const faces = [
        new FontFace("CivicSign", "url(fonts/ArchivoBlack.ttf)", { weight: "400 900" }),
        new FontFace("CivicSans", "url(fonts/Oswald.ttf)", { weight: "400 900" }),
        new FontFace("CivicSerif", "url(fonts/Cinzel.ttf)", { weight: "400 900" }),
      ];
      const loaded = await Promise.all(faces.map((f) => f.load().catch(() => null)));
      loaded.forEach((f) => f && document.fonts.add(f));
    } catch (e) {
      console.warn("Fonte do letreiro:", e);
    }
    try {
      await document.fonts.ready;
    } catch (e) {}
    fontsReady = true;
  }

  function pickFontSize(g, lines, w, h, families) {
    /* 75–85% of the band. Prefer one line; shrink to fit before wrapping. */
    const target = lines.length > 1 ? Math.floor(h * 0.40) : Math.floor(h * 0.82);
    const min = lines.length > 1 ? Math.floor(h * 0.34) : Math.floor(h * 0.75);
    const maxW = w * 0.94;
    let size = target;
    const longest = lines.reduce((a, b) => (a.length >= b.length ? a : b), "");
    for (; size >= min; size -= 2) {
      g.font = "900 " + size + "px " + families;
      if (g.measureText(longest).width <= maxW) return size;
    }
    g.font = "900 " + min + "px " + families;
    return min;
  }

  function paintSignCell(g, x, y, w, h, sign) {
    const bg = sign.bg || "#c4a07a";
    const fg = sign.fg || "#fff8ee";
    g.fillStyle = bg;
    g.fillRect(x, y, w, h);
    const grd = g.createLinearGradient(x, y, x, y + h);
    grd.addColorStop(0, "rgba(255,255,255,0.16)");
    grd.addColorStop(0.45, "rgba(255,255,255,0.02)");
    grd.addColorStop(1, "rgba(60,40,30,0.16)");
    g.fillStyle = grd;
    g.fillRect(x, y, w, h);
    g.strokeStyle = "rgba(255,248,238,0.35)";
    g.lineWidth = 6;
    g.strokeRect(x + 8, y + 8, w - 16, h - 16);
    const lines = sign.lines && sign.lines.length ? sign.lines : [sign.text || sign.sign || ""];
    const families = '"CivicSign", "CivicSans", "CivicSerif", "DejaVu Sans", "Noto Sans", sans-serif';
    try { g.letterSpacing = "0.02em"; } catch (e) {}
    const fontSize = pickFontSize(g, lines, w, h, families);
    g.font = "900 " + fontSize + "px " + families;
    g.textAlign = "center";
    g.textBaseline = "middle";
    const step = fontSize * 1.14;
    const cy = y + h / 2;
    const start = cy - ((lines.length - 1) * step) / 2;
    g.lineJoin = "round";
    g.miterLimit = 2;
    /* Subtle shadow + thin halo — heavy strokes looked muddy when minified. */
    g.shadowColor = "rgba(50,30,22,0.28)";
    g.shadowBlur = Math.max(2, fontSize * 0.03);
    g.shadowOffsetY = Math.max(2, fontSize * 0.025);
    lines.forEach((ln, i) => {
      const px = x + w / 2;
      const py = start + i * step;
      g.lineWidth = Math.max(3, fontSize * 0.028);
      g.strokeStyle = "rgba(70,42,32,0.28)";
      g.strokeText(ln, px, py, w * 0.96);
      g.fillStyle = fg;
      g.fillText(ln, px, py, w * 0.96);
    });
    g.shadowBlur = 0;
    g.shadowOffsetY = 0;
  }

  function buildAtlas() {
    const c = document.createElement("canvas");
    c.width = ATLAS_COLS * CELL_W;
    c.height = ATLAS_ROWS * CELL_H;
    const g = c.getContext("2d");
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = "high";
    atlasIndex = {};
    const buildings = (cfg && cfg.buildings) || [];
    buildings.forEach((b, i) => {
      const col = i % ATLAS_COLS;
      const row = Math.floor(i / ATLAS_COLS);
      const x = col * CELL_W;
      const y = row * CELL_H;
      const sign = Object.assign({ text: b.sign, sign: b.sign, bg: b.sign_color, fg: "#fff8f0" }, b.sign_quad || {});
      paintSignCell(g, x, y, CELL_W, CELL_H, sign);
      const pad = 2 / c.width;
      const pady = 2 / c.height;
      atlasIndex[b.id] = {
        u0: col / ATLAS_COLS + pad,
        v0: row / ATLAS_ROWS + pady,
        u1: (col + 1) / ATLAS_COLS - pad,
        v1: (row + 1) / ATLAS_ROWS - pady,
      };
    });
    atlasCanvas = c;
    return c;
  }

  function offsetLonLat(lon, lat, east, north) {
    const elon = 111320 * Math.cos((lat * Math.PI) / 180);
    const nlat = 110540;
    return [lon + east / elon, lat + north / nlat];
  }

  function signCorners(sq) {
    /* along should point camera-left so the U-flip reads LTR from the street. */
    let ax = sq.along[0], ay = sq.along[1];
    const ox = (sq.outward && sq.outward[0]) || 0;
    const oy = (sq.outward && sq.outward[1]) || 0;
    const camRightE = -oy, camRightN = ox;
    if (ax * camRightE + ay * camRightN > 0) {
      ax = -ax;
      ay = -ay;
    }
    const half = sq.width_m / 2;
    const left = offsetLonLat(sq.lon, sq.lat, -ax * half, -ay * half);
    const right = offsetLonLat(sq.lon, sq.lat, ax * half, ay * half);
    const z0 = sq.base_m;
    const z1 = sq.base_m + sq.height_m;
    return { left, right, z0, z1 };
  }

  function makeSignLayer() {
    const maplibregl = root.maplibregl;
    let gl, program, buffer, tex, vao, vertexCount = 0;
    const matrix = new Float32Array(16);
    let origin = null;
    let unit = 1;
    let visible = true;
    let dirtyIds = "";
    const layer = {
      id: "predios-signs",
      type: "custom",
      renderingMode: "3d",
      onAdd(m, g) {
        gl = g;
        const shader = (type, src) => {
          const s = gl.createShader(type);
          gl.shaderSource(s, src);
          gl.compileShader(s);
          if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(s));
          return s;
        };
        const v = shader(
          gl.VERTEX_SHADER,
          "precision highp float;attribute vec3 a_pos;attribute vec3 a_normal;attribute vec2 a_uv;uniform mat4 u_matrix;varying vec2 v_uv;varying float v_light;void main(){v_uv=a_uv;v_light=0.82+0.18*max(dot(normalize(a_normal),normalize(vec3(-0.35,-0.55,0.85))),0.0);gl_Position=u_matrix*vec4(a_pos,1.0);gl_Position.z-=0.0015*gl_Position.w;}"
        );
        const f = shader(
          gl.FRAGMENT_SHADER,
          "precision mediump float;varying vec2 v_uv;varying float v_light;uniform sampler2D u_atlas;void main(){vec4 c=texture2D(u_atlas,v_uv);if(c.a<0.1) discard; gl_FragColor=vec4(c.rgb*v_light,1.0);}"
        );
        program = gl.createProgram();
        gl.attachShader(program, v);
        gl.attachShader(program, f);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(program));
        gl.deleteShader(v);
        gl.deleteShader(f);
        buffer = gl.createBuffer();
        tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        if (atlasCanvas) {
          const maxSz = gl.getParameter(gl.MAX_TEXTURE_SIZE);
          gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlasCanvas);
          gl.getError();
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          const anisoExt = gl.getExtension("EXT_texture_filter_anisotropic") ||
            gl.getExtension("WEBKIT_EXT_texture_filter_anisotropic");
          if (anisoExt) {
            const maxA = gl.getParameter(anisoExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT) || 16;
            gl.texParameterf(gl.TEXTURE_2D, anisoExt.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(16, maxA));
          }
          try { gl.generateMipmap(gl.TEXTURE_2D); } catch (e) {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          }
        }
        layer.attrs = ["a_pos", "a_normal", "a_uv"].map((n) => gl.getAttribLocation(program, n));
        layer.matrix = gl.getUniformLocation(program, "u_matrix");
        layer.sampler = gl.getUniformLocation(program, "u_atlas");
        vao = null; // debug: skip VAO
        const first = (cfg.buildings && cfg.buildings[0]) || { lon: -54.588, lat: -25.547 };
        origin = maplibregl.MercatorCoordinate.fromLngLat([first.lon, first.lat], 0);
        unit = origin.meterInMercatorCoordinateUnits();
      },
      setVisible(v) {
        visible = v;
      },
      rebuild(ids) {
        if (!gl || !origin) return;
        const key = Array.from(ids).sort().join(",");
        if (key === dirtyIds) return;
        dirtyIds = key;
        const verts = [];
        const toLocal = (lon, lat, z) => {
          const p = maplibregl.MercatorCoordinate.fromLngLat([lon, lat], z);
          return [(p.x - origin.x) / unit, (p.y - origin.y) / unit, (p.z - (origin.z || 0)) / unit];
        };
        const push = (p, n, u, v) => {
          verts.push(p[0], p[1], p[2], n[0], n[1], n[2], u, v);
        };
        const buildings = cfg.buildings || [];
        for (const b of buildings) {
          if (!ids.has(b.id) || !b.sign_quad) continue;
          const uv = atlasIndex[b.id];
          if (!uv) continue;
          const sq = b.sign_quad;
          const c = signCorners(sq);
          const bl = toLocal(c.left[0], c.left[1], c.z0);
          const br = toLocal(c.right[0], c.right[1], c.z0);
          const tr = toLocal(c.right[0], c.right[1], c.z1);
          const tl = toLocal(c.left[0], c.left[1], c.z1);
          // Normal in local mercator meters, pointing toward the street.
          const n = [-(br[1] - bl[1]), br[0] - bl[0], 0];
          // Prefer the authored outward if we can convert it; fallback to cross of edges.
          const ox = sq.outward ? sq.outward[0] : 0;
          const oy = sq.outward ? sq.outward[1] : 0;
          // outward is east/north meters; local Y is mercator y (south-positive).
          let nx = ox, ny = -oy, nz = 0;
          const len = Math.hypot(nx, ny) || 1;
          nx /= len;
          ny /= len;
          // Two triangles, CCW when viewed from the street.
          // Flip only U so the name reads left-to-right from the street.
          push(bl, [nx, ny, nz], uv.u1, uv.v1);
          push(br, [nx, ny, nz], uv.u0, uv.v1);
          push(tr, [nx, ny, nz], uv.u0, uv.v0);
          push(bl, [nx, ny, nz], uv.u1, uv.v1);
          push(tr, [nx, ny, nz], uv.u0, uv.v0);
          push(tl, [nx, ny, nz], uv.u1, uv.v0);
        }
        const mesh = new Float32Array(verts);
        vertexCount = mesh.length / 8;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, mesh, gl.DYNAMIC_DRAW);
        stats.signs = vertexCount / 6;
        if (vao) {
          gl.bindVertexArray(vao);
          gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
          const stride = 32;
          gl.enableVertexAttribArray(layer.attrs[0]);
          gl.vertexAttribPointer(layer.attrs[0], 3, gl.FLOAT, false, stride, 0);
          gl.enableVertexAttribArray(layer.attrs[1]);
          gl.vertexAttribPointer(layer.attrs[1], 3, gl.FLOAT, false, stride, 12);
          gl.enableVertexAttribArray(layer.attrs[2]);
          gl.vertexAttribPointer(layer.attrs[2], 2, gl.FLOAT, false, stride, 24);
          gl.bindVertexArray(null);
        }
      },
      render(g, m) {
        if (!visible || !program || !vertexCount) return;
        if (map.getZoom() < (cfg.minzoom || 15) - 0.05) return;
        for (let row = 0; row < 4; row++) {
          matrix[row] = m[row] * unit;
          matrix[4 + row] = m[4 + row] * unit;
          matrix[8 + row] = m[8 + row] * unit;
          matrix[12 + row] = m[row] * origin.x + m[4 + row] * origin.y + m[12 + row];
        }
        gl.useProgram(program);
        gl.uniformMatrix4fv(layer.matrix, false, matrix);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.uniform1i(layer.sampler, 0);
        if (vao) gl.bindVertexArray(vao);
        else {
          gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
          const stride = 32;
          gl.enableVertexAttribArray(layer.attrs[0]);
          gl.vertexAttribPointer(layer.attrs[0], 3, gl.FLOAT, false, stride, 0);
          gl.enableVertexAttribArray(layer.attrs[1]);
          gl.vertexAttribPointer(layer.attrs[1], 3, gl.FLOAT, false, stride, 12);
          gl.enableVertexAttribArray(layer.attrs[2]);
          gl.vertexAttribPointer(layer.attrs[2], 2, gl.FLOAT, false, stride, 24);
        }
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.depthMask(true);
        gl.enable(gl.POLYGON_OFFSET_FILL);
        gl.polygonOffset(-8.0, -200.0);
        gl.disable(gl.CULL_FACE);
        gl.disable(gl.BLEND);
        gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
        gl.disable(gl.POLYGON_OFFSET_FILL);
        if (vao) gl.bindVertexArray(null);
      },
      onRemove() {
        if (!gl) return;
        if (buffer) gl.deleteBuffer(buffer);
        if (tex) gl.deleteTexture(tex);
        if (program) gl.deleteProgram(program);
        if (vao) gl.deleteVertexArray(vao);
      },
    };
    return layer;
  }

  function ensureSignLayer(before) {
    if (map.getLayer("predios-signs")) return;
    if (!atlasCanvas) buildAtlas();
    signLayer = makeSignLayer();
    map.addLayer(signLayer, before);
  }

  function setVis(vis) {
    const v = vis === "visible" ? "visible" : "none";
    for (const id of ["predios-civic-walls", "predios-civic-caps", "predios-civic-details", "predios-plaza", "predios-parking"]) {
      if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", v);
    }
    if (signLayer && signLayer.setVisible) signLayer.setVisible(vis === "visible");
    if (map.getLayer("predios-debug-fill")) {
      map.setLayoutProperty("predios-debug-fill", "visibility", v);
      map.setLayoutProperty("predios-debug-line", "visibility", v);
      if (map.getLayer("predios-debug-facade")) {
        map.setLayoutProperty("predios-debug-facade", "visibility", v);
      }
    }
  }

  function visibleIds(bounds, pad) {
    return new Set(cfg.buildings.filter((b) => inView(b, bounds, pad)).map((b) => b.id));
  }

  function update() {
    if (!cfg || !map || !volumes) return;
    const z = map.getZoom();
    const minz = cfg.minzoom || 15;
    ensureLayers();
    if (z < minz - 0.15) {
      setVis("none");
      stats.visible = 0;
      return;
    }
    const bounds = map.getBounds();
    const pad = Math.max(bounds.getEast() - bounds.getWest(), bounds.getNorth() - bounds.getSouth()) * 0.35;
    const ids = visibleIds(bounds, pad);
    const feats = volumes.features.filter((f) => ids.has(f.properties.id));
    map.getSource("predios-volumes").setData({ type: "FeatureCollection", features: feats });
    if (signLayer && signLayer.rebuild) signLayer.rebuild(ids);
    stats.visible = ids.size;
    stats.parts = feats.length;
    stats.loaded = cfg.buildings.length;
    ensureDebug(ids);
    setVis("visible");
  }

  function schedule() {
    if (timer) return;
    timer = setTimeout(() => {
      timer = 0;
      try {
        update();
      } catch (e) {
        console.error("Prédios:", e);
      }
    }, 80);
  }

  function focusHall() {
    const origin = [-54.58821460604668, -25.5468809996802];
    const angle = (14.5 * Math.PI) / 180;
    const east = 111320 * Math.cos((origin[1] * Math.PI) / 180);
    const north = 110540;
    const x = -40,
      y = 3;
    const center = [
      origin[0] + (x * Math.cos(angle) - y * Math.sin(angle)) / east,
      origin[1] + (x * Math.sin(angle) + y * Math.cos(angle)) / north,
    ];
    const el = map.getContainer();
    const h = el.clientHeight;
    const w = el.clientWidth;
    const zoom = 17.8 + Math.log2(Math.min(h / 1000, w / 950));
    map.jumpTo({
      center,
      zoom,
      pitch: 50,
      bearing: -14.5,
      padding: { top: h * 0.22, bottom: h * 0.04, left: 20, right: 20 },
    });
    schedule();
  }

  function debugOn() {
    try {
      return new URLSearchParams(location.search).get("debug") === "1";
    } catch (e) {
      return false;
    }
  }

  function facadeLine(b) {
    const sq = b.sign_quad;
    if (sq) {
      const half = (sq.width_m || 16) / 2;
      const ax = sq.along[0], ay = sq.along[1];
      const p1 = offsetLonLat(sq.lon, sq.lat, -ax * half, -ay * half);
      const p2 = offsetLonLat(sq.lon, sq.lat, ax * half, ay * half);
      return {
        type: "Feature",
        properties: { id: b.id, kind: "facade" },
        geometry: { type: "LineString", coordinates: [p1, p2] },
      };
    }
    return null;
  }

  function ensureDebug(ids) {
    if (!debugOn() || !cfg) return;
    const rings = [];
    const lines = [];
    for (const b of cfg.buildings) {
      if (ids && !ids.has(b.id)) continue;
      if (b.footprint) {
        rings.push({
          type: "Feature",
          properties: { id: b.id, label: b.label, kind: "footprint" },
          geometry: { type: "Polygon", coordinates: b.footprint },
        });
      }
      if (b.wing && b.wing.footprint) {
        rings.push({
          type: "Feature",
          properties: { id: b.id + "-ala", label: "Ala", kind: "footprint" },
          geometry: { type: "Polygon", coordinates: b.wing.footprint },
        });
      }
      const fl = facadeLine(b);
      if (fl) lines.push(fl);
    }
    if (!map.getSource("predios-debug")) {
      map.addSource("predios-debug", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addSource("predios-debug-lines", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({
        id: "predios-debug-fill",
        type: "fill",
        source: "predios-debug",
        paint: { "fill-color": "#18c5ff", "fill-opacity": 0.18 },
      });
      map.addLayer({
        id: "predios-debug-line",
        type: "line",
        source: "predios-debug",
        paint: { "line-color": "#07a0d8", "line-width": 2.4 },
      });
      map.addLayer({
        id: "predios-debug-facade",
        type: "line",
        source: "predios-debug-lines",
        paint: { "line-color": "#ff2d6a", "line-width": 4, "line-dasharray": [1, 0] },
      });
    }
    map.getSource("predios-debug").setData({ type: "FeatureCollection", features: rings });
    map.getSource("predios-debug-lines").setData({ type: "FeatureCollection", features: lines });
  }

  async function install(m) {
    map = m;
    if (!cfg) {
      const r = await fetch("data/predios/predios.json");
      if (!r.ok) throw new Error("Não foi possível carregar a lista de prédios");
      cfg = await r.json();
    }
    await loadSignFonts();
    buildAtlas();
    registerCivicPatterns();
    if (!volumes) {
      volumes = await fetchGzipJson(cfg.volumes || "data/predios/volumes.json.gz");
    }
    applyExclusion();
    hookTreeClear();
    map.on("moveend", schedule);
    map.on("zoomend", schedule);
    update();
    return { cfg, stats, focus: focusHall, update };
  }

  function lonLatToEN(lon0, lat0, lon, lat) {
    const elon = 111320 * Math.cos((lat0 * Math.PI) / 180);
    const nlat = 110540;
    return [(lon - lon0) * elon, (lat - lat0) * nlat];
  }

  function enToLonLat(lon0, lat0, e, n) {
    const elon = 111320 * Math.cos((lat0 * Math.PI) / 180);
    const nlat = 110540;
    return [lon0 + e / elon, lat0 + n / nlat];
  }

  function treeInZone(z, lon, lat) {
    const [e, n] = lonLatToEN(z.lon, z.lat, lon, lat);
    const al = z.along[0] * e + z.along[1] * n;
    const ou = z.outward[0] * e + z.outward[1] * n;
    /* Inflate by a typical canopy radius so a tree beside the facade
       cannot still cover the letters in the pitched view. */
    const canopy = 10.0;
    /* Also clear trees sitting on / just behind the facade (2D sprites
       anchored at the ground grow upward and cover the letreiro). */
    const behind = 22.0;
    return {
      hit: ou >= -behind && ou <= z.depth_m + 2 && Math.abs(al) <= z.half_width_m + canopy,
      al: al,
      ou: ou,
    };
  }

  function moveTreeOut(z, lon, lat, zones) {
    const info = treeInZone(z, lon, lat);
    const side = info.al >= 0 ? 1 : -1;
    const newAl = side * (z.half_width_m + 5);
    const e = z.along[0] * newAl + z.outward[0] * info.ou;
    const n = z.along[1] * newAl + z.outward[1] * info.ou;
    const pos = enToLonLat(z.lon, z.lat, e, n);
    for (let i = 0; i < zones.length; i++) {
      if (treeInZone(zones[i], pos[0], pos[1]).hit) return null;
    }
    return pos;
  }

  function pointInRing(lon, lat, ring) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0], yi = ring[i][1];
      const xj = ring[j][0], yj = ring[j][1];
      const intersect = ((yi > lat) !== (yj > lat)) &&
        (lon < ((xj - xi) * (lat - yi)) / ((yj - yi) || 1e-12) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  function metersPerDeg(lat) {
    const mLat = 110540;
    const mLon = 111320 * Math.cos((lat * Math.PI) / 180);
    return { mLon: mLon, mLat: mLat };
  }

  function distPointToSegMeters(lon, lat, lon1, lat1, lon2, lat2) {
    const m = metersPerDeg(lat);
    const x1 = (lon1 - lon) * m.mLon, y1 = (lat1 - lat) * m.mLat;
    const x2 = (lon2 - lon) * m.mLon, y2 = (lat2 - lat) * m.mLat;
    const dx = x2 - x1, dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    let t = len2 > 0 ? (-x1 * dx - y1 * dy) / len2 : 0;
    if (t < 0) t = 0;
    else if (t > 1) t = 1;
    const px = x1 + t * dx, py = y1 + t * dy;
    return Math.sqrt(px * px + py * py);
  }

  function minDistToRingMeters(lon, lat, ring) {
    let d = Infinity;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const a = ring[j], b = ring[i];
      if (!a || !b) continue;
      d = Math.min(d, distPointToSegMeters(lon, lat, a[0], a[1], b[0], b[1]));
    }
    return d;
  }

  function treeOnCivicFootprint(lon, lat) {
    const buildings = (cfg && cfg.buildings) || [];
    const buffer = (cfg && cfg.tree_buffer_m) || 3;
    for (let i = 0; i < buildings.length; i++) {
      const fps = [];
      if (buildings[i].footprint) fps.push(buildings[i].footprint);
      if (buildings[i].wing && buildings[i].wing.footprint) fps.push(buildings[i].wing.footprint);
      if (buildings[i].exclusion) fps.push(buildings[i].exclusion);
      for (let f = 0; f < fps.length; f++) {
        let ring = fps[f];
        if (ring && ring[0] && typeof ring[0][0] !== "number") ring = ring[0];
        if (!ring) continue;
        if (pointInRing(lon, lat, ring)) return true;
        if (buffer > 0 && minDistToRingMeters(lon, lat, ring) <= buffer) return true;
      }
    }
    return false;
  }

  function applyTreeClear(data) {
    const zones = ((cfg && cfg.tree_clear) || []).filter(function (z) {
      return z && z.kind !== "footprint";
    });
    if (!data || !Array.isArray(data.features)) return data;
    const features = [];
    for (let i = 0; i < data.features.length; i++) {
      const f = data.features[i];
      const kind = f.properties && f.properties.kind;
      if (kind !== "tree" && kind !== "bush") {
        features.push(f);
        continue;
      }
      const c = f.geometry && f.geometry.coordinates;
      if (!c) {
        features.push(f);
        continue;
      }
      // Drop first if the trunk sits on (or within the buffer of) a civic
      // footprint, including street-tree sprites whose icons would cover
      // the façade in the pitched view. Do this before trying to slide
      // the tree sideways along a sign-cone zone.
      if (treeOnCivicFootprint(c[0], c[1])) {
        continue;
      }
      let zone = null;
      for (let z = 0; z < zones.length; z++) {
        if (treeInZone(zones[z], c[0], c[1]).hit) {
          zone = zones[z];
          break;
        }
      }
      if (!zone) {
        features.push(f);
        continue;
      }
      const moved = moveTreeOut(zone, c[0], c[1], zones);
      if (moved && !treeOnCivicFootprint(moved[0], moved[1])) {
        const copy = Object.assign({}, f);
        copy.geometry = Object.assign({}, f.geometry, { coordinates: moved });
        features.push(copy);
      }
    }
    return { type: "FeatureCollection", features: features };
  }

  function hookTreeClear() {
    const src = map.getSource("vegetation");
    if (!src || src.__fozTreeHook) return;
    const orig = src.setData.bind(src);
    src.setData = function (data) {
      if (data && data.__fozCleared) return orig(data);
      const cleaned = applyTreeClear(data);
      if (cleaned && typeof cleaned === "object") cleaned.__fozCleared = true;
      return orig(cleaned);
    };
    src.__fozTreeHook = true;
    const reapply = () => {
      try {
        const data = src._data;
        if (data && data.features && data.features.length && !data.__fozCleared) src.setData(data);
      } catch (e) {}
    };
    reapply();
    map.on("idle", reapply);
    setTimeout(reapply, 400);
    setTimeout(reapply, 1600);
  }

  root.FozPredios = { install, focusHall, stats, getAtlas: () => atlasCanvas };
})(typeof window !== "undefined" ? window : globalThis);
