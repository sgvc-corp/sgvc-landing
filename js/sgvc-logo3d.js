/* ============================================================
   SGVC — Logo 3D premium (isotipo en volumen)
   ------------------------------------------------------------
   Construye el isotipo como DOS piezas físicas independientes,
   tal como pide la identidad de marca:

     1) EL ARO  → círculo grueso con textura griega (greca) en
        relieve, oro cepillado, bordes biselados. Gira sobre su
        propio eje (Z) 1 vuelta cada 20s, easing lineal, infinito.
        Cada 8s un brillo metálico recorre la superficie.

     2) LA FLECHA → atraviesa el centro del aro como si fuera el
        eje de una rueda. Permanece COMPLETAMENTE fija: nunca
        rota, solo se mueve junto con el grupo al inclinar con
        el mouse (tilt), igual que el aro.

   Todo el conjunto (rig) se inclina máx. 4° al mover el mouse.
   Sin partículas, sin fuego, sin rayos: metal real, luz real.
   ============================================================ */
(function (global) {
  'use strict';

  const GOLD          = 0xD4AF37; // color de marca
  const GOLD_BRIGHT    = 0xEBCB6E; // oro más pulido (flecha / brillo)
  const GOLD_SHADOW    = 0x6B4F14; // oro en sombra (grietas / AO)

  const OUTER_R   = 2.6;   // radio exterior del aro
  const INNER_R   = 1.62;  // radio interior del aro (grosor = 0.98)
  const RING_DEPTH = 0.52; // espesor del aro (grueso, no una lámina)

  /* ---------------------------------------------------------
     Geometría: EL ARO (anillo grueso + bisel)
     --------------------------------------------------------- */
  function buildRingGeometry() {
    const shape = new THREE.Shape();
    shape.absarc(0, 0, OUTER_R, 0, Math.PI * 2, false);
    const hole = new THREE.Path();
    hole.absarc(0, 0, INNER_R, 0, Math.PI * 2, true);
    shape.holes.push(hole);

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: RING_DEPTH,
      bevelEnabled: true,
      bevelThickness: 0.06,
      bevelSize: 0.05,
      bevelSegments: 4,
      curveSegments: 96
    });
    geo.center();
    return geo;
  }

  /* ---------------------------------------------------------
     Geometría: greca griega en relieve (dientes tallados
     alrededor del aro, patrón tipo "llave griega" repetido)
     --------------------------------------------------------- */
  function buildGrecaMesh() {
    const PATTERN = [1, 1, 0, 1, 1, 0, 0, 1]; // unidad del meandro
    const STEPS = 96; // repeticiones alrededor del círculo completo
    const midR = (OUTER_R + INNER_R) / 2;
    const bandWidth = (OUTER_R - INNER_R) * 0.5; // recorrido radial del diente
    const toothTangential = ((2 * Math.PI * midR) / STEPS) * 0.62;
    const toothHeight = 0.1; // cuánto sobresale (relieve real, no textura)

    const active = [];
    for (let i = 0; i < STEPS; i++) {
      if (PATTERN[i % PATTERN.length]) active.push(i);
    }

    const geo = new THREE.BoxGeometry(bandWidth, toothTangential, toothHeight);
    const mat = new THREE.MeshPhysicalMaterial({
      color: GOLD_SHADOW,
      metalness: 1,
      roughness: 0.38,
      clearcoat: 0.4,
      clearcoatRoughness: 0.3
    });
    const mesh = new THREE.InstancedMesh(geo, mat, active.length);
    const dummy = new THREE.Object3D();

    active.forEach((i, idx) => {
      const theta = (i / STEPS) * Math.PI * 2;
      dummy.position.set(Math.cos(theta) * midR, Math.sin(theta) * midR, RING_DEPTH / 2 + toothHeight / 2 - 0.01);
      dummy.rotation.set(0, 0, theta);
      dummy.updateMatrix();
      mesh.setMatrixAt(idx, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    return mesh;
  }

  /* ---------------------------------------------------------
     Geometría: LA FLECHA (eje fijo que atraviesa el aro)
     ------------------------------------------------------------
     Fiel a la foto de referencia: un pequeño poste con muescas
     (eco de la greca) nace del fondo del aro; de su extremo
     superior sale una flecha diagonal SÓLIDA que se ensancha
     hacia la punta y atraviesa la pared del aro, asomando
     arriba a la derecha. Todo el conjunto queda fijo (no rota).
     --------------------------------------------------------- */
  function buildArrowGroup(mat, toothMat) {
    const group = new THREE.Group();
    const depth = RING_DEPTH * 0.92;
    const extrudeOpts = {
      depth, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.03, bevelSegments: 3, curveSegments: 6
    };

    /* ---- Poste inferior con muescas tipo greca ---- */
    const postCx = 0.05, postHalfW = 0.20, postTopY = -0.05, postBotY = -1.45;
    const postShape = new THREE.Shape([
      new THREE.Vector2(postCx - postHalfW, postBotY),
      new THREE.Vector2(postCx + postHalfW, postBotY),
      new THREE.Vector2(postCx + postHalfW, postTopY),
      new THREE.Vector2(postCx - postHalfW, postTopY)
    ]);
    const postGeo = new THREE.ExtrudeGeometry(postShape, extrudeOpts);
    const postMesh = new THREE.Mesh(postGeo, mat);
    group.add(postMesh);

    const toothGeo = new THREE.BoxGeometry(0.16, 0.16, depth * 0.7);
    const notchYs = [-1.2, -0.75, -0.3];
    const notchMeshes = notchYs.map((y, i) => {
      const side = i % 2 === 0 ? 1 : -1;
      const t = new THREE.Mesh(toothGeo, toothMat || mat);
      t.position.set(postCx + side * (postHalfW + 0.08), y, 0);
      group.add(t);
      return t;
    });

    /* ---- Flecha diagonal sólida (se ensancha hacia la punta) ---- */
    const angle = THREE.MathUtils.degToRad(65); // inclinación hacia arriba-derecha
    const dir = new THREE.Vector2(Math.cos(angle), Math.sin(angle));
    const perp = new THREE.Vector2(-dir.y, dir.x);

    const postTop = new THREE.Vector2(postCx, postTopY);
    const shaftHalfW = 0.21, shaftLen = 1.3;
    const shaftEnd = postTop.clone().addScaledVector(dir, shaftLen);

    const a = postTop.clone().addScaledVector(perp, shaftHalfW);
    const b = postTop.clone().addScaledVector(perp, -shaftHalfW);
    const c = shaftEnd.clone().addScaledVector(perp, -shaftHalfW);
    const d = shaftEnd.clone().addScaledVector(perp, shaftHalfW);
    const shaftShape = new THREE.Shape([a, b, c, d]);
    const shaftGeo = new THREE.ExtrudeGeometry(shaftShape, extrudeOpts);
    const shaftMesh = new THREE.Mesh(shaftGeo, mat);
    group.add(shaftMesh);

    const headHalfW = 0.62, headLen = 1.6;
    const tip = shaftEnd.clone().addScaledVector(dir, headLen);
    const baseL = shaftEnd.clone().addScaledVector(perp, headHalfW);
    const baseR = shaftEnd.clone().addScaledVector(perp, -headHalfW);
    const headShape = new THREE.Shape([baseL, tip, baseR]);
    const headGeo = new THREE.ExtrudeGeometry(headShape, extrudeOpts);
    const headMesh = new THREE.Mesh(headGeo, mat);
    group.add(headMesh);

    group.position.z = -depth / 2;
    group.userData.dispose = () => {
      postGeo.dispose(); toothGeo.dispose(); shaftGeo.dispose(); headGeo.dispose();
    };
    return group;
  }

  /* ---------------------------------------------------------
     Entorno de reflejos (PMREM procedural) — sin depender de
     una imagen HDRI externa. Simula un pequeño estudio con
     paneles de luz cálida/fría para reflejos realistas.
     --------------------------------------------------------- */
  function buildEnvironment(renderer) {
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();

    const envScene = new THREE.Scene();
    const panel = (color, w, h, x, y, z, ry) => {
      const mat = new THREE.MeshBasicMaterial({ color });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
      mesh.position.set(x, y, z);
      mesh.rotation.y = ry;
      envScene.add(mesh);
    };
    envScene.background = new THREE.Color(0x0a0a0a);
    panel(0xfff4dd, 6, 6, 0, 4, -6, 0);        // softbox superior cálido
    panel(0xffe6b0, 5, 8, -7, 0, 0, Math.PI / 2.4); // panel lateral izq
    panel(0xbfd7ff, 5, 8, 7, 0, 0, -Math.PI / 2.4); // panel lateral der (frío, contraste)
    panel(0x1a1a1a, 10, 10, 0, -6, 0, Math.PI / 2);

    const rt = pmrem.fromScene(envScene, 0.04);
    pmrem.dispose();
    return rt.texture;
  }

  /* ---------------------------------------------------------
     Textura del brillo metálico (barrido) — gradiente radial
     suave: núcleo brillante que se apaga hacia los bordes.
     --------------------------------------------------------- */
  function buildSweepTexture() {
    const size = 128;
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx = c.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, size, 0);
    grad.addColorStop(0, 'rgba(255,244,214,0)');
    grad.addColorStop(0.5, 'rgba(255,244,214,0.95)');
    grad.addColorStop(1, 'rgba(255,244,214,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    return tex;
  }

  /* ---------------------------------------------------------
     API pública: SGVCLogo3D.create(canvas, opciones)
     --------------------------------------------------------- */
  function create(canvas, options) {
    const opts = Object.assign({
      transparent: true,
      interactive: true,   // tilt con el mouse
      autoTilt: false,     // si no hay mouse: leve oscilación automática
      tiltMaxDeg: 4,
      ringPeriod: 20,       // segundos por vuelta del aro
      sweepPeriod: 8,       // segundos por barrido de brillo
      baseTiltX: 0.22,
      baseTiltY: -0.12,
      isometric: false,     // cámara ortográfica isométrica (para showcase)
      reduceMotion: false
    }, options || {});

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: opts.transparent });
    } catch (e) {
      return null;
    }
    renderer.setClearColor(0x000000, 0);
    if (renderer.outputColorSpace !== undefined) renderer.outputColorSpace = THREE.SRGBColorSpace;
    if (renderer.toneMapping !== undefined) {
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
    }

    const stage = canvas.parentElement;
    const scene = new THREE.Scene();

    let camera;
    if (opts.isometric) {
      const d = 6;
      camera = new THREE.OrthographicCamera(-d, d, d, -d, 0.1, 100);
      camera.position.set(6.2, 4.6, 6.2); // ángulo isométrico clásico (~35.264°)
      camera.lookAt(0, 0, 0);
    } else {
      camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
      camera.position.set(0, 0.15, 9.2);
    }

    /* ---- Iluminación de estudio (a medida, sin HDRI externo) ---- */
    scene.add(new THREE.AmbientLight(0xfff2dd, 0.45));
    const key = new THREE.DirectionalLight(0xffe3b0, 2.0);
    key.position.set(4, 6, 6);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x9fc4ff, 0.6);
    rim.position.set(-6, -2, -4);
    scene.add(rim);
    const fill = new THREE.PointLight(0xffcf8a, 0.6, 20);
    fill.position.set(-3, -2.5, 5);
    scene.add(fill);

    let envTex = null;
    try {
      envTex = buildEnvironment(renderer);
      scene.environment = envTex;
    } catch (e) { /* si el navegador no soporta PMREM, seguimos sin env map */ }

    /* ---- Materiales ---- */
    const ringMat = new THREE.MeshPhysicalMaterial({
      color: GOLD,
      metalness: 1,
      roughness: 0.3,
      clearcoat: 0.55,
      clearcoatRoughness: 0.22,
      envMapIntensity: 1.35
    });
    const arrowMat = new THREE.MeshPhysicalMaterial({
      color: GOLD_BRIGHT,
      metalness: 1,
      roughness: 0.16,
      clearcoat: 0.75,
      clearcoatRoughness: 0.1,
      envMapIntensity: 1.5
    });

    /* ---- Piezas ---- */
    const rig = new THREE.Group();          // se inclina con el mouse (todo junto)
    const ringGroup = new THREE.Group();     // gira solo — el aro
    const ringMesh = new THREE.Mesh(buildRingGeometry(), ringMat);
    ringGroup.add(ringMesh);
    ringGroup.add(buildGrecaMesh());

    const arrowMesh = buildArrowGroup(arrowMat, ringMat); // fija, NO rota (poste con greca + flecha diagonal)

    /* ---- Brillo metálico que recorre el aro cada N segundos ---- */
    const sweepTex = buildSweepTexture();
    const sweepGeo = new THREE.PlaneGeometry((OUTER_R - INNER_R) * 1.05, 0.9);
    const sweepMat = new THREE.MeshBasicMaterial({
      map: sweepTex, transparent: true, opacity: 0.85,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
    });
    const sweepGroup = new THREE.Group();
    const sweepMesh = new THREE.Mesh(sweepGeo, sweepMat);
    sweepMesh.position.set((OUTER_R + INNER_R) / 2, 0, RING_DEPTH / 2 + 0.08);
    sweepGroup.add(sweepMesh);

    rig.add(ringGroup, arrowMesh, sweepGroup);
    rig.rotation.x = opts.baseTiltX;
    rig.rotation.y = opts.baseTiltY;
    scene.add(rig);

    function resize() {
      const w = stage.clientWidth, h = stage.clientHeight || w;
      renderer.setSize(w, h, false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      if (camera.isPerspectiveCamera) {
        camera.aspect = w / h;
      } else {
        const d = 6, aspect = w / h;
        camera.left = -d * aspect; camera.right = d * aspect;
        camera.top = d; camera.bottom = -d;
      }
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize);

    /* ---- Inclinación con el mouse (máx. opts.tiltMaxDeg grados) ---- */
    const maxRad = THREE.MathUtils.degToRad(opts.tiltMaxDeg);
    let targetX = 0, targetY = 0;
    if (opts.interactive && window.matchMedia('(hover: hover)').matches) {
      stage.addEventListener('mousemove', (e) => {
        const r = stage.getBoundingClientRect();
        const nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
        const ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
        targetX = -ny * maxRad;
        targetY = nx * maxRad;
      });
      stage.addEventListener('mouseleave', () => { targetX = 0; targetY = 0; });
    }

    function renderStatic() { renderer.render(scene, camera); }

    if (opts.reduceMotion) {
      renderStatic();
      return { resize, renderer, scene, camera, dispose() { window.removeEventListener('resize', resize); } };
    }

    const clock = new THREE.Clock();
    let rafId;
    function animate() {
      rafId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      /* El aro: una vuelta completa cada `ringPeriod` seg, easing lineal, infinito */
      ringGroup.rotation.z = (t / opts.ringPeriod) * Math.PI * 2;

      /* La flecha nunca rota — se queda fija dentro del rig */
      arrowMesh.rotation.z = 0;

      /* Brillo: recorre el aro una vez cada `sweepPeriod` seg */
      sweepGroup.rotation.z = (t / opts.sweepPeriod) * Math.PI * 2;
      const pulse = 0.75 + 0.25 * Math.sin((t / opts.sweepPeriod) * Math.PI * 2 * 3);
      sweepMat.opacity = 0.55 * pulse;

      /* Inclinación suave del conjunto hacia el mouse (o leve deriva automática) */
      let tx = targetX, ty = targetY;
      if (opts.autoTilt) {
        tx += Math.sin(t * 0.25) * maxRad * 0.4;
        ty += Math.cos(t * 0.2) * maxRad * 0.4;
      }
      rig.rotation.x += (opts.baseTiltX + tx - rig.rotation.x) * 0.05;
      rig.rotation.y += (opts.baseTiltY + ty - rig.rotation.y) * 0.05;

      renderer.render(scene, camera);
    }
    animate();

    return {
      resize,
      renderer, scene, camera, rig,
      dispose() {
        cancelAnimationFrame(rafId);
        window.removeEventListener('resize', resize);
        ringMesh.geometry.dispose();
        if (arrowMesh.userData.dispose) arrowMesh.userData.dispose();
        ringMat.dispose();
        arrowMat.dispose();
        sweepGeo.dispose();
        sweepMat.dispose();
        sweepTex.dispose();
        if (envTex) envTex.dispose();
        renderer.dispose();
      }
    };
  }

  global.SGVCLogo3D = { create };
})(window);
