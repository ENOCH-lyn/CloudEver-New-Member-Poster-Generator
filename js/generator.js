(() => {
  const $ = (sel) => document.querySelector(sel);

  // Elements
  const canvas = $('#poster');
  const ctx = canvas.getContext('2d');
  const displayNameEl = $('#displayName');
  const btnGenerate = $('#btnGenerate');
  const btnDownload = $('#btnDownload');
  const sizeSel = document.getElementById('size');
  const zoomSel = document.getElementById('zoom');
  const canvasWrap = document.querySelector('.canvas-wrap');

  // State
  let logoImage = null;
  // no silhouette in brand-minimal design

  // Load logo once
  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  let usedRemoteLogo = false;

  async function ensureAssets() {
    if (!logoImage) {
      try {
        logoImage = await loadImage('images/ce.png');
      } catch (_) {
        try {
          logoImage = await loadImage('https://cloudever.top/images/ce.png');
          usedRemoteLogo = true;
        } catch (__) {
          logoImage = null;
        }
      }
    }
  }

  function setCanvasSize(value) {
    const [w, h] = value.split('x').map((n) => parseInt(n, 10));
    canvas.width = w;
    canvas.height = h;
    applyZoom();
  }

  function radialGradient(ctx, w, h, accent) {
    const grad = ctx.createRadialGradient(w * 0.75, h * 0.2, 0, w * 0.5, h * 0.4, Math.max(w, h) * 0.9);
    grad.addColorStop(0, hex2rgba(accent, 0.55));
    grad.addColorStop(0.5, hex2rgba(accent, 0.1));
    grad.addColorStop(1, '#0b1020');
    return grad;
  }

  function hex2rgba(hex, a = 1) {
    const h = hex.replace('#', '');
    const bigint = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  function drawRoundedRect(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function fitText(text, maxWidth, baseSize, fontFamily, weight = 700) {
    let size = baseSize;
    ctx.font = `${weight} ${size}px ${fontFamily}`;
    while (ctx.measureText(text).width > maxWidth && size > 10) {
      size -= 2;
      ctx.font = `${weight} ${size}px ${fontFamily}`;
    }
    return size;
  }

  function drawBrandMinimal({ w, h, name }) {
    const brandPrimary = '#00e6f6';
    const brandAccent = '#a020f0';
    const isLandscape = w > h;
    const minSide = Math.min(w, h);

    // Sophisticated brand background
    drawBrandBackground(w, h, brandPrimary, brandAccent);

  // Subtle halo near center
  const haloCY = isLandscape ? h * 0.50 : h * 0.46;
  const haloR = minSide * (isLandscape ? 0.16 : 0.18);
  const halo = ctx.createRadialGradient(w / 2, haloCY, haloR * 0.2, w / 2, haloCY, haloR);
    halo.addColorStop(0, hex2rgba(brandPrimary, 0.18));
    halo.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
  ctx.arc(w / 2, haloCY, haloR, 0, Math.PI * 2);
    ctx.fill();

  // Header-like circular logo badge (gradient bg + glow + inner logo)
  const badgeCY = isLandscape ? h * 0.50 : h * 0.46;
  const badgeDia = minSide * (isLandscape ? 0.20 : 0.24);
  drawHeaderStyleLogoBadge(w / 2, badgeCY, badgeDia, brandPrimary);

  // Welcome line (CN)
  ctx.textAlign = 'center';
  ctx.fillStyle = '#cfe3ff';
  ctx.font = `700 ${Math.floor(minSide * 0.038)}px Montserrat, Inter`;
  ctx.fillText('欢迎加入', w / 2, Math.floor(h * (isLandscape ? 0.15 : 0.18)));

  // Gradient brand text: CloudEver (mimic .logo-text)
  const brandWord = 'CloudEver';
  const cloudFontSize = Math.floor(minSide * (isLandscape ? 0.085 : 0.10));
  ctx.font = `900 ${cloudFontSize}px Orbitron, Montserrat`;
  const textWidth = ctx.measureText(brandWord).width;
  const gx = (w - textWidth) / 2;
  const gy = Math.floor(h * (isLandscape ? 0.24 : 0.26));
  const grad = ctx.createLinearGradient(gx, gy, gx + textWidth, gy);
  grad.addColorStop(0, brandPrimary);
  grad.addColorStop(1, '#ffffff');
  ctx.fillStyle = grad;
  ctx.fillText(brandWord, w / 2, gy);

    // Name
  const nameMaxW = w * 0.86;
  const nameSize = fitText(name, nameMaxW, Math.floor(minSide * (isLandscape ? 0.11 : 0.13)), 'Orbitron, Montserrat', 900);
    ctx.fillStyle = '#ffffff';
    ctx.font = `900 ${nameSize}px Orbitron, Montserrat`;
  ctx.fillText(name, w / 2, Math.floor(h * (isLandscape ? 0.78 : 0.80)));

    // Underline gradient
  const textW = ctx.measureText(name).width * (isLandscape ? 0.58 : 0.68); // shorten more on landscape
  const lx = (w - textW) / 2;
  const ly = Math.floor(h * (isLandscape ? 0.805 : 0.825));
    const lineGrad = ctx.createLinearGradient(lx, ly, lx + textW, ly);
    lineGrad.addColorStop(0, brandPrimary);
    lineGrad.addColorStop(1, brandAccent);
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = Math.max(3, Math.floor(w * 0.004));
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(lx + textW, ly);
    ctx.stroke();

    // Thin border
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
  }

  function drawBrandBackground(w, h, brandPrimary, brandAccent) {
    // Base vertical gradient
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#0a0e17');
    bg.addColorStop(1, '#0b1220');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Soft vignette
    const vignette = ctx.createRadialGradient(w / 2, h * 0.5, Math.min(w, h) * 0.4, w / 2, h * 0.5, Math.max(w, h) * 0.8);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);

    // Very subtle grid
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.035)';
    ctx.lineWidth = 1;
    const step = Math.round(Math.min(w, h) / 22);
    for (let x = 0; x <= w; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y <= h; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    ctx.restore();

    // Soft bokeh lights
    const circles = 6;
    for (let i = 0; i < circles; i++) {
      const r = Math.random() * (Math.min(w, h) * 0.08) + Math.min(w, h) * 0.04;
      const cx = Math.random() * w;
      const cy = Math.random() * h * 0.9 + h * 0.05;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      const col = i % 2 === 0 ? brandPrimary : brandAccent;
      g.addColorStop(0, hex2rgba(col, 0.12));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    }

    // Tiny stars/noise points
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (let i = 0; i < 120; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const s = Math.random() * 1.2 + 0.2;
      ctx.fillRect(x, y, s, s);
    }
    ctx.restore();
  }

  function drawHeaderStyleLogoBadge(cx, cy, diameter, brandPrimary) {
    if (!logoImage) return;
    const r = diameter / 2;
    const pad = Math.max(8, Math.floor(diameter * 0.035)); // mimic CSS padding: 8px
    const inner = diameter - pad * 2;

    // Outer circular gradient background matching index header
    // Approximate linear-gradient(135deg, #0a0e17 60%, #00e6f6 100%)
    const grad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    grad.addColorStop(0, '#0a0e17');
    grad.addColorStop(0.6, '#0a0e17');
    grad.addColorStop(1, brandPrimary);

    ctx.save();
    // Box shadow like: 0 4px 16px rgba(0,230,246,0.35)
    ctx.shadowColor = 'rgba(0, 230, 246, 0.35)';
    ctx.shadowBlur = Math.max(6, Math.floor(diameter * 0.08));
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();

    // Inner logo with drop shadow and slight brightness effect (approximated)
    ctx.save();
    ctx.shadowColor = brandPrimary;
    ctx.shadowBlur = Math.max(8, Math.floor(inner * 0.18));
    // Clip to inner circle (simulate padding)
    ctx.beginPath();
    ctx.arc(cx, cy, inner / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(logoImage, cx - inner / 2, cy - inner / 2, inner, inner);
    ctx.restore();
  }

  function applyZoom() {
    if (!canvas || !canvasWrap) return;
    const mode = (zoomSel?.value || 'fit');
    const cw = canvas.width;
    const ch = canvas.height;
    let scale = 1;
    // Always prioritize fit behavior per requirement
    if (mode === 'fit') {
      const stage = document.querySelector('main.stage');
      const rect = stage?.getBoundingClientRect();
      const availW = Math.max(100, (rect?.width || window.innerWidth) - 32);
      const availH = Math.max(100, (rect?.height || window.innerHeight) - 32);
      // Slightly smaller than browser height to avoid scroll
      const marginFactor = 0.9; // 90% of available height
      scale = Math.min(availW / cw, (availH * marginFactor) / ch, 1);
    } else {
      const p = parseInt(mode, 10);
      if (!isNaN(p)) scale = p / 100;
    }
    // Use CSS width/height so layout matches scaled size (no overflow)
    const dispW = Math.floor(cw * scale);
    const dispH = Math.floor(ch * scale);
    canvas.style.width = `${dispW}px`;
    canvas.style.height = `${dispH}px`;
    // Container stays auto, centered by layout
  }

  function wrapText(text, x, y, maxWidth, lineHeight) {
    const words = text.split(/\s+/);
    let line = '';
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), x, y);
  }

  function drawNeoTheme({ w, h, accent, name, role, dateStr, tagline }) {
    // Background gradient
    const grad = radialGradient(ctx, w, h, accent);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Glow rings
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const cx = w * 0.62;
    const cy = h * 0.3;
    for (let i = 0; i < 6; i++) {
      ctx.strokeStyle = hex2rgba(accent, 0.12 - i * 0.015);
      ctx.lineWidth = Math.max(2, Math.floor(w * 0.003));
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(w, h) * (0.18 + i * 0.06), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    // Logo top-right
    if (logoImage) {
      const lw = Math.min(160, w * 0.14);
      const lh = (logoImage.height / logoImage.width) * lw;
      ctx.globalAlpha = 0.95;
      ctx.drawImage(logoImage, w - lw - 40, 32, lw, lh);
      ctx.globalAlpha = 1;
    }

    // Title
    ctx.fillStyle = '#fff';
    ctx.font = `800 ${Math.floor(w * 0.08)}px Montserrat, Inter`;
    ctx.fillText('WELCOME', 48, Math.floor(h * 0.22));
    ctx.fillStyle = hex2rgba(accent, 0.95);
    ctx.font = `800 ${Math.floor(w * 0.06)}px Montserrat, Inter`;
    ctx.fillText('TO CLOUDEVER', 48, Math.floor(h * 0.22) + Math.floor(w * 0.08) + 10);

    // Avatar big with neon frame
    if (avatarImage) {
      const size = Math.min(w, h) * 0.55;
      const x = 48;
      const y = Math.floor(h * 0.36);

      // Glow frame
      ctx.save();
      ctx.shadowColor = hex2rgba(accent, 0.9);
      ctx.shadowBlur = size * 0.08;
      drawRoundedRect(x - 8, y - 8, size + 16, size + 16, size * 0.06);
      ctx.strokeStyle = hex2rgba(accent, 0.6);
      ctx.lineWidth = Math.max(4, Math.floor(size * 0.012));
      ctx.stroke();
      ctx.restore();

      // Mask and draw
      ctx.save();
      drawRoundedRect(x, y, size, size, size * 0.06);
      ctx.clip();
      const iw = avatarImage.width;
      const ih = avatarImage.height;
      const ratio = Math.max(size / iw, size / ih);
      const dw = iw * ratio;
      const dh = ih * ratio;
      const dx = x + (size - dw) / 2;
      const dy = y + (size - dh) / 2;
      ctx.drawImage(avatarImage, dx, dy, dw, dh);
      ctx.restore();
    }

    // Right text block
    const blockX = Math.floor(w * 0.64);
    const blockW = Math.floor(w * 0.32);
    let y = Math.floor(h * 0.42);

    const nameSize = fitText(name, blockW, Math.floor(w * 0.09), 'Montserrat, Inter');
    ctx.fillStyle = '#fff';
    ctx.font = `800 ${nameSize}px Montserrat, Inter`;
    wrapText(name, blockX, y, blockW, nameSize * 1.15);
    y += nameSize * 1.5 + 12;

    ctx.fillStyle = hex2rgba('#ffffff', 0.8);
    const roleSize = fitText(role, blockW, Math.floor(w * 0.04), 'Inter', 700);
    ctx.font = `700 ${roleSize}px Inter`;
    wrapText(role, blockX, y, blockW, roleSize * 1.35);
    y += roleSize * 1.6 + 20;

    ctx.fillStyle = hex2rgba('#ffffff', 0.7);
    const dateSize = Math.floor(w * 0.034);
    ctx.font = `600 ${dateSize}px Inter`;
    ctx.fillText(dateStr, blockX, y);
    y += dateSize + 24;

    if (tagline) {
      ctx.fillStyle = hex2rgba(accent, 0.95);
      const tagSize = fitText(tagline, blockW, Math.floor(w * 0.045), 'Inter', 800);
      ctx.font = `800 ${tagSize}px Inter`;
      wrapText(tagline, blockX, y, blockW, tagSize * 1.35);
    }

    // Footer marks
    ctx.fillStyle = hex2rgba('#ffffff', 0.25);
    ctx.font = `600 ${Math.floor(w * 0.026)}px Inter`;
    ctx.fillText('#EverForward  ·  Cloud · Dev · Future', 48, h - 48);
  }

  async function render() {
    await ensureAssets();
    const [w, h] = [canvas.width, canvas.height];
    const name = (displayNameEl.value || 'name').toUpperCase();

  // Clear
    ctx.clearRect(0, 0, w, h);

    drawBrandMinimal({ w, h, name });
    applyZoom();
    // Call again on next frame to ensure layout is settled
    requestAnimationFrame(() => applyZoom());
  }

  function downloadPNG() {
    try {
      const link = document.createElement('a');
      const name = (displayNameEl.value || 'member').trim();
      link.download = `CloudEver-Welcome-${name || 'member'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (_) {
    }
  }

  // Events
  btnGenerate.addEventListener('click', render);
  btnDownload.addEventListener('click', downloadPNG);


  // Initialize
  const hashParamsInit = new URLSearchParams(location.hash.replace(/^#/, ''));
  const initSize = hashParamsInit.get('size') || (document.getElementById('size')?.value || '3840x4800');
  setCanvasSize(initSize);
  if (document.getElementById('size')) document.getElementById('size').value = initSize;
  // 支持 URL hash 传入 #name=XXX
  (async () => {
    try {
      const params = new URLSearchParams(location.hash.replace(/^#/, ''));
      const n = params.get('name');
      if (n) displayNameEl.value = n;
    } catch (_) {}
    await ensureAssets();
    await render();
  })();

  if (sizeSel) {
    sizeSel.addEventListener('change', () => {
      setCanvasSize(sizeSel.value);
      render();
    });
  }

  if (zoomSel) {
    zoomSel.addEventListener('change', () => applyZoom());
  }

  window.addEventListener('resize', () => {
    if ((zoomSel?.value || 'fit') === 'fit') applyZoom();
  });

  // Observe stage size changes to auto-fit at all times
  if ('ResizeObserver' in window) {
    const stage = document.querySelector('main.stage');
    const ro = new ResizeObserver(() => applyZoom());
    if (stage) ro.observe(stage);
    ro.observe(document.body);
  }
})();
