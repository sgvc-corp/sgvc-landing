/* ============================================================
   SGVC — mejoras de movimiento con GSAP + ScrollTrigger
   (gratis, licencia GreenSock "No Charge" desde 2025)

   Todo esto es progresivo: si el CDN de GSAP no carga por
   cualquier motivo, este archivo simplemente no hace nada y el
   sitio se ve exactamente igual con las animaciones base que ya
   trae main.js (reveal por IntersectionObserver, tilt, etc).
   Nada del contenido depende de que esto funcione.
   ============================================================ */
(function () {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- 1. Hero: titular palabra por palabra ---------- */
  (function heroWords() {
    const h1 = document.querySelector('.hero h1');
    if (!h1 || h1.dataset.split) return;

    const chunks = h1.innerHTML.split(/(<em>.*?<\/em>|\s+)/g).filter(Boolean);
    h1.innerHTML = chunks.map(chunk => {
      if (/^\s+$/.test(chunk)) return chunk;
      if (chunk.startsWith('<em>')) {
        const inner = chunk.replace(/<\/?em>/g, '');
        const words = inner.split(' ').map(w => `<span class="word">${w}</span>`).join(' ');
        return `<em>${words}</em>`;
      }
      return `<span class="word">${chunk}</span>`;
    }).join('');
    h1.dataset.split = '1';

    gsap.from(h1.querySelectorAll('.word'), {
      opacity: 0,
      y: 24,
      duration: 0.7,
      ease: 'power3.out',
      stagger: 0.045,
      delay: 0.15,
    });
  })();

  /* ---------- 2. Conteo de cifras en "Quiénes somos" ---------- */
  document.querySelectorAll('.about-stats strong').forEach((el) => {
    const raw = el.textContent.trim();
    const match = raw.match(/[\d.]+/);
    if (!match) return;
    const target = parseFloat(match[0]);
    const suffix = raw.slice(match[0].length);
    const isInt = Number.isInteger(target);
    const counter = { val: 0 };

    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        gsap.to(counter, {
          val: target,
          duration: 1.3,
          ease: 'power2.out',
          onUpdate: () => {
            el.textContent = (isInt ? Math.round(counter.val) : counter.val.toFixed(1)) + suffix;
          },
        });
      },
    });
  });

  /* ---------- 3. Stagger de tarjetas por grupo ---------- */
  function staggerGroup(containerSel, itemSel, extra) {
    document.querySelectorAll(containerSel).forEach((container) => {
      const items = container.querySelectorAll(itemSel);
      if (!items.length) return;
      gsap.from(items, Object.assign({
        opacity: 0,
        y: 26,
        duration: 0.6,
        ease: 'power2.out',
        stagger: 0.09,
        scrollTrigger: { trigger: container, start: 'top 82%' },
      }, extra || {}));
    });
  }
  staggerGroup('.method-grid', '.method-step');
  staggerGroup('.reasons-grid', '.reason-card');
  staggerGroup('.timeline', '.timeline-step', { y: 18 });

  /* ---------- 4. Línea de progreso — Proceso Comercial ---------- */
  const timeline = document.querySelector('.timeline');
  const progress = timeline && timeline.querySelector('.timeline-progress');
  if (timeline && progress) {
    gsap.to(progress, {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: timeline,
        start: 'top 75%',
        end: 'bottom 65%',
        scrub: 0.6,
      },
    });
  }

  /* ---------- 5. Badges numerados de sección: pop al entrar ---------- */
  gsap.utils.toArray('.section-badge').forEach((badge) => {
    gsap.from(badge, {
      opacity: 0,
      scale: 0.6,
      duration: 0.5,
      ease: 'back.out(2)',
      scrollTrigger: { trigger: badge, start: 'top 90%' },
    });
  });
})();
