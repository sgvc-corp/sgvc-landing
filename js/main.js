/* ============================================================
   SGVC landing — interactions
   ============================================================ */

/**
 * Tracking mínimo y agnóstico de proveedor.
 * Empuja eventos a window.dataLayer (el estándar que usan GA4 y
 * Google Tag Manager) si existe. Si todavía no instalaste GA4/GTM,
 * esto no hace nada dañino: solo no hay nadie escuchando el evento.
 * Para activarlo: agrega tu snippet de GA4 o GTM en el <head> de
 * index.html — no hace falta tocar este archivo.
 */
function trackEvent(name, params = {}) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: name, ...params });
}

document.addEventListener('DOMContentLoaded', () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Tracking: WhatsApp, canales, y vista de cada caso ---------- */
  document.querySelectorAll('a.btn-gold, .contact-actions a').forEach(a => {
    a.addEventListener('click', () => {
      trackEvent('whatsapp_click', { location: a.closest('section')?.id || 'header' });
    });
  });
  document.querySelectorAll('.channel').forEach(a => {
    a.addEventListener('click', () => {
      const label = a.querySelector('.meta small')?.textContent?.trim() || 'channel';
      trackEvent('contact_channel_click', { channel: label });
    });
  });
  if ('IntersectionObserver' in window) {
    const caseIO = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const title = entry.target.querySelector('h3')?.textContent?.trim();
          trackEvent('case_study_view', { case: title });
          caseIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    document.querySelectorAll('.case-card').forEach(el => caseIO.observe(el));
  }

  /* ---------- Brillo del botón dorado: una vez, al cargar ---------- */
  if (!reduceMotion) {
    document.querySelectorAll('.btn-gold').forEach(btn => {
      requestAnimationFrame(() => btn.classList.add('shine-once'));
    });
  }

  /* ---------- Header scroll state ---------- */
  const header = document.querySelector('.site-header');
  const onScroll = () => {
    if (window.scrollY > 12) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Mobile nav ---------- */
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      nav.classList.toggle('open');
      header.classList.toggle('nav-open');
    });
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      nav.classList.remove('open');
      header.classList.remove('nav-open');
    }));
  }

  /* ---------- Scroll reveal ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  /* ---------- Tilt cards (pillars + cases) ---------- */
  if (!reduceMotion && window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.pillar-card, .case-card').forEach(card => {
      const strength = card.classList.contains('case-card') ? 4 : 8;
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        card.style.setProperty('--mx', `${x * 100}%`);
        card.style.setProperty('--my', `${y * 100}%`);
        const rx = (0.5 - y) * strength;
        const ry = (x - 0.5) * strength;
        card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-2px)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  /* ---------- Hero 3D signature ---------- */
  // Isotipo del hero: animación 100% CSS (ver .isotipo-anim en style.css)

  /* ---------- Partículas ambientales (toda la página) ---------- */
  initAmbientParticles(reduceMotion);
});

/**
 * Puntos dorados y plateados flotando suavemente por toda la pagina,
 * como una capa de "polvo" ambiental. Va en un canvas fijo por encima
 * del contenido (pointer-events:none) para no interferir con clicks.
 */
function initAmbientParticles(reduceMotion) {
  const canvas = document.getElementById('ambient-particles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w, h, particles;

  const COLORS = [
    { r: 217, g: 174, b: 85 },  // dorado
    { r: 190, g: 145, b: 54 },  // dorado oscuro
    { r: 214, g: 212, b: 205 }, // plateado calido
  ];

  function makeParticle() {
    const c = COLORS[Math.floor(Math.random() * COLORS.length)];
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      r: 0.9 + Math.random() * 1.8,
      color: c,
      baseAlpha: 0.25 + Math.random() * 0.4,
      driftX: (Math.random() - 0.5) * 0.12,
      driftY: -0.05 - Math.random() * 0.16,
      swayAmp: 8 + Math.random() * 18,
      swaySpeed: 0.15 + Math.random() * 0.25,
      phase: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.4 + Math.random() * 0.8,
    };
  }

  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const density = Math.min(90, Math.max(38, Math.round((w * h) / 26000)));
    particles = Array.from({ length: density }, makeParticle);
  }

  resize();
  window.addEventListener('resize', resize);

  function drawFrame(t) {
    ctx.clearRect(0, 0, w, h);
    particles.forEach(p => {
      const sway = Math.sin(t * p.swaySpeed + p.phase) * p.swayAmp * 0.02;
      const twinkle = 0.55 + 0.45 * Math.sin(t * p.twinkleSpeed + p.phase);
      const alpha = p.baseAlpha * twinkle;
      const { r, g, b } = p.color;
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
      grad.addColorStop(0, `rgba(${r},${g},${b},${alpha})`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x + sway, p.y, p.r * 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  if (reduceMotion) {
    drawFrame(0);
    return;
  }

  function step(ts) {
    const t = ts / 1000;
    particles.forEach(p => {
      p.x += p.driftX;
      p.y += p.driftY;
      if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;
    });
    drawFrame(t);
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

