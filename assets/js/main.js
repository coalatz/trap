
/* =========================================================================
   TRAPXHOLICX — Space Portal Intro
   Troque REDIRECT_URL abaixo pelo link real do site.
   ========================================================================= */
window.REDIRECT_URL = "index.html";


var LOGO_DATA_URI = "assets/images/main_img_1.png";



(function () {
  "use strict";

  var REDIRECT_URL = window.REDIRECT_URL || "#";
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isMobile = window.innerWidth < 760;

  /* ---------------------------------------------------------------------
     Renderer / scene / camera
  --------------------------------------------------------------------- */
  var canvas = document.getElementById("scene-canvas");
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 0, 7.2);

  var clock = new THREE.Clock();

  /* ---------------------------------------------------------------------
     Starfield — three depth layers for real parallax
  --------------------------------------------------------------------- */
  function makeStarLayer(count, spread, size, depth, palette) {
    var geo = new THREE.BufferGeometry();
    var positions = new Float32Array(count * 3);
    var colors = new Float32Array(count * 3);
    var col = new THREE.Color();
    for (var i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * spread;
      positions[i * 3 + 1] = (Math.random() - 0.5) * spread;
      positions[i * 3 + 2] = -depth - Math.random() * depth;
      var c = palette[Math.floor(Math.random() * palette.length)];
      col.set(c);
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    var mat = new THREE.PointsMaterial({
      size: size,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });
    var pts = new THREE.Points(geo, mat);
    scene.add(pts);
    return pts;
  }

  var palette = ["#ffffff", "#d9a9ff", "#c084fc", "#ff8fe0", "#8a2be2"];
  var starCountMul = isMobile ? 0.45 : 1;
  var starsFar = makeStarLayer(Math.floor(900 * starCountMul), 60, 0.045, 30, palette);
  var starsMid = makeStarLayer(Math.floor(500 * starCountMul), 45, 0.07, 16, palette);
  var starsNear = makeStarLayer(Math.floor(220 * starCountMul), 30, 0.1, 6, palette);

  /* ---------------------------------------------------------------------
     Soft glow sprites (cheap additive "nebula puffs" in 3D space)
  --------------------------------------------------------------------- */
  function makeGlowTexture(hex) {
    var size = 256;
    var c = document.createElement("canvas");
    c.width = c.height = size;
    var ctx = c.getContext("2d");
    var g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, hex + "ff");
    g.addColorStop(0.35, hex + "88");
    g.addColorStop(1, hex + "00");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(c);
  }

  var glowTexPurple = makeGlowTexture("#8a2be2");
  var glowTexMagenta = makeGlowTexture("#ff2ec4");

  function addGlowPuff(tex, x, y, z, scale, opacity) {
    var mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      opacity: opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    var spr = new THREE.Sprite(mat);
    spr.position.set(x, y, z);
    spr.scale.set(scale, scale, 1);
    scene.add(spr);
    return spr;
  }

  var puffs = [
    addGlowPuff(glowTexPurple, -6, 3, -18, 18, 0.35),
    addGlowPuff(glowTexMagenta, 7, -3.5, -22, 20, 0.3),
    addGlowPuff(glowTexPurple, 3, 5, -28, 24, 0.25)
  ];

  /* ---------------------------------------------------------------------
     Logo group — halo glow sprite behind + textured plane
  --------------------------------------------------------------------- */
  var logoGroup = new THREE.Group();
  scene.add(logoGroup);

  var haloMat = new THREE.SpriteMaterial({
    map: glowTexPurple,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  var halo = new THREE.Sprite(haloMat);
  halo.scale.set(7.5, 7.5, 1);
  logoGroup.add(halo);

  var haloMagenta = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexMagenta,
    transparent: true,
    opacity: 0.35,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  }));
  haloMagenta.scale.set(6, 6, 1);
  logoGroup.add(haloMagenta);

  var loader = new THREE.TextureLoader();
  var LOGO_ASPECT = 1; // square image - will auto-correct after load
  var logoMesh = null;

  loader.load(LOGO_DATA_URI, function (tex) {
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();

    var cameraAspect = window.innerWidth / window.innerHeight;
    var visibleHeight = 2 * 7.2 * Math.tan(25 * Math.PI / 180);
    var visibleWidth = visibleHeight * cameraAspect;

    var imgAspect = tex.image.width / tex.image.height;
    var maxW = visibleWidth * 0.88;
    var maxH = visibleHeight * 0.72;

    var w = maxW;
    var h = w / imgAspect;
    if (h > maxH) { h = maxH; w = h * imgAspect; }

    var geo = new THREE.PlaneGeometry(w, h);
    var mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      depthWrite: false
    });
    logoMesh = new THREE.Mesh(geo, mat);
    logoGroup.add(logoMesh);

    onAssetsReady();
  }, undefined, function (error) {
    console.error("Erro ao carregar a logo do portal:", error);
    onAssetsReady();
  });

  /* ---------------------------------------------------------------------
     Loader dismissal
  --------------------------------------------------------------------- */
  var ready = false;
  function onAssetsReady() {
    if (ready) return;
    ready = true;
    var loaderEl = document.getElementById("loader");
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        loaderEl.classList.add("hidden");
        setTimeout(function () { loaderEl.style.display = "none"; }, 950);
      });
    });
  }
  // safety net in case texture takes too long / fails silently
  setTimeout(onAssetsReady, 4000);

  /* ---------------------------------------------------------------------
     Pointer parallax
  --------------------------------------------------------------------- */
  var pointer = { x: 0, y: 0 };
  var pointerTarget = { x: 0, y: 0 };

  function setPointer(clientX, clientY) {
    pointerTarget.x = (clientX / window.innerWidth) * 2 - 1;
    pointerTarget.y = (clientY / window.innerHeight) * 2 - 1;
  }
  window.addEventListener("mousemove", function (e) { setPointer(e.clientX, e.clientY); }, { passive: true });
  window.addEventListener("touchmove", function (e) {
    if (e.touches && e.touches[0]) setPointer(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  /* ---------------------------------------------------------------------
     Lightning bolts — 2D overlay canvas, arcing from the logo's core
  --------------------------------------------------------------------- */
  var fxCanvas = document.getElementById("fx-canvas");
  var fxCtx = fxCanvas.getContext("2d");
  function resizeFx() {
    fxCanvas.width = window.innerWidth * Math.min(window.devicePixelRatio || 1, 2);
    fxCanvas.height = window.innerHeight * Math.min(window.devicePixelRatio || 1, 2);
    fxCtx.setTransform(Math.min(window.devicePixelRatio || 1, 2), 0, 0, Math.min(window.devicePixelRatio || 1, 2), 0, 0);
  }
  resizeFx();

  var bolts = [];
  function genBoltPath(x0, y0, x1, y1, disp) {
    if (disp < 6) return [{ x: x0, y: y0 }, { x: x1, y: y1 }];
    var mx = (x0 + x1) / 2 + (Math.random() - 0.5) * disp;
    var my = (y0 + y1) / 2 + (Math.random() - 0.5) * disp;
    var left = genBoltPath(x0, y0, mx, my, disp / 2);
    var right = genBoltPath(mx, my, x1, y1, disp / 2);
    return left.concat(right.slice(1));
  }

  function spawnBolt() {
    var cx = window.innerWidth * Math.random();
    var cy = window.innerHeight * Math.random();
    var angle = Math.random() * Math.PI * 2;
    var len = 90 + Math.random() * 160;
    var ex = cx + Math.cos(angle) * len;
    var ey = cy + Math.sin(angle) * len;
    var path = genBoltPath(cx, cy, ex, ey, 60);
    bolts.push({ path: path, life: 1, decay: 0.05 + Math.random() * 0.04, width: 3.5 + Math.random() * 4.0 });
    if (bolts.length > 15) bolts.shift();
  }

  var lightningTimer = 0;
  var lightningInterval = reduceMotion ? 999999 : 300 + Math.random() * 500;

  function drawBolts(dt) {
    fxCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (var i = bolts.length - 1; i >= 0; i--) {
      var b = bolts[i];
      b.life -= b.decay;
      if (b.life <= 0) { bolts.splice(i, 1); continue; }

      fxCtx.save();
      fxCtx.globalAlpha = Math.max(b.life, 0);
      fxCtx.shadowBlur = 18;
      fxCtx.shadowColor = "#d9a9ff";
      fxCtx.strokeStyle = "#f4e6ff";
      fxCtx.lineWidth = b.width;
      fxCtx.beginPath();
      fxCtx.moveTo(b.path[0].x, b.path[0].y);
      for (var p = 1; p < b.path.length; p++) fxCtx.lineTo(b.path[p].x, b.path[p].y);
      fxCtx.stroke();

      fxCtx.shadowBlur = 34;
      fxCtx.shadowColor = "#ff2ec4";
      fxCtx.strokeStyle = "rgba(138,43,226,0.6)";
      fxCtx.lineWidth = b.width * 2.4;
      fxCtx.stroke();
      fxCtx.restore();
    }
  }

  /* ---------------------------------------------------------------------
     Heartbeat pulse (syncs halo glow + subtle logo scale, trap-adjacent)
  --------------------------------------------------------------------- */
  var pulseClock = 0;
  var PULSE_PERIOD = 2.3;

  /* ---------------------------------------------------------------------
     Resize
  --------------------------------------------------------------------- */
  window.addEventListener("resize", function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    resizeFx();
  });

  /* ---------------------------------------------------------------------
     Click-through transition into the site
  --------------------------------------------------------------------- */
  var transitioning = false;
  function startTransition() {
    if (transitioning) return;
    transitioning = true;

    var flash = document.getElementById("flash");
    var ui = document.getElementById("ui");
    ui.style.transition = "opacity 0.4s ease";
    ui.style.opacity = "0";

    if (reduceMotion) {
      flash.style.transition = "opacity 0.6s ease";
      flash.style.opacity = "1";
      setTimeout(function () { 
        var iframe = document.createElement('iframe');
        iframe.src = REDIRECT_URL;
        iframe.style.position = 'absolute';
        iframe.style.top = '0';
        iframe.style.left = '0';
        iframe.style.width = '100vw';
        iframe.style.height = '100vh';
        iframe.style.border = 'none';
        iframe.style.zIndex = '999999';
        document.body.appendChild(iframe);
        setTimeout(function() { document.getElementById('flash').style.display = 'none'; }, 100);
      }, 650);
      return;
    }

    var start = performance.now();
    var DURATION = 1150;
    var startFov = camera.fov;
    var startZ = camera.position.z;

    function flyThrough(now) {
      var t = Math.min((now - start) / DURATION, 1);
      var ease = t * t * (3 - 2 * t); // smoothstep
      camera.position.z = startZ - ease * (startZ - 0.4);
      camera.fov = startFov + ease * 55;
      camera.updateProjectionMatrix();

      if (logoMesh && logoMesh.material) {
        logoMesh.material.transparent = true;
        logoMesh.material.opacity = Math.max(0, 1 - ease * 0.5);
      }
      flash.style.opacity = String(Math.max(0, (t - 0.45) / 0.55));

      if (t < 1) {
        requestAnimationFrame(flyThrough);
      } else {
        // Criando iframe para carregar a página sem parar a música
        var iframe = document.createElement('iframe');
        iframe.src = REDIRECT_URL;
        iframe.style.position = 'absolute';
        iframe.style.top = '0';
        iframe.style.left = '0';
        iframe.style.width = '100vw';
        iframe.style.height = '100vh';
        iframe.style.border = 'none';
        iframe.style.zIndex = '999999';
        
        document.body.appendChild(iframe);
        
        // Remove os canvases para poupar memória
        setTimeout(function() {
          document.getElementById('scene-canvas').style.display = 'none';
          document.getElementById('fx-canvas').style.display = 'none';
          document.getElementById('flash').style.display = 'none';
        }, 100);
      }
    }
    requestAnimationFrame(flyThrough);
  }

  document.body.addEventListener("click", startTransition);
  document.body.addEventListener("touchend", function (e) {
    // avoid double-firing with the synthetic click that follows touchend
    e.preventDefault();
    startTransition();
  }, { passive: false });
  window.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") startTransition();
  });

  /* ---------------------------------------------------------------------
     Main loop
  --------------------------------------------------------------------- */
  function animate() {
    requestAnimationFrame(animate);
    var dt = Math.min(clock.getDelta(), 0.05);
    var t = clock.getElapsedTime();

    pulseClock += dt;
    var pulsePhase = (pulseClock % PULSE_PERIOD) / PULSE_PERIOD;
    var pulse = Math.pow(Math.sin(pulsePhase * Math.PI), 3); // sharp attack, soft decay -> "808 kick" feel

    if (!transitioning) {
      pointer.x += (pointerTarget.x - pointer.x) * 0.04;
      pointer.y += (pointerTarget.y - pointer.y) * 0.04;

      // parallax: layers drift at different rates for real depth
      starsNear.rotation.y = pointer.x * 0.05;
      starsNear.rotation.x = pointer.y * 0.03;
      starsMid.rotation.y = pointer.x * 0.03;
      starsMid.rotation.x = pointer.y * 0.02;
      starsFar.rotation.y = pointer.x * 0.015;

      starsFar.rotation.z += dt * 0.003;
      starsMid.rotation.z -= dt * 0.002;

      camera.position.x = pointer.x * 0.5;
      camera.position.y = -pointer.y * 0.35;
      camera.lookAt(0, 0, 0);

      // logo: gentle float + tumble like it's tumbling in zero-g
      logoGroup.position.y = Math.sin(t * 0.6) * 0.18;
      logoGroup.position.x = Math.cos(t * 0.4) * 0.12;
      logoGroup.rotation.z = Math.sin(t * 0.35) * 0.05;
      logoGroup.rotation.y = Math.sin(t * 0.25) * 0.12 + pointer.x * 0.15;
      logoGroup.rotation.x = pointer.y * 0.08;

      var pulseScale = 1 + pulse * 0.035;
      logoGroup.scale.setScalar(pulseScale);

      halo.material.opacity = 0.05 + pulse * 0.05;
      haloMagenta.material.opacity = 0.03 + pulse * 0.05;

      puffs.forEach(function (p, i) {
        p.position.x += Math.sin(t * 0.1 + i) * 0.003;
        p.position.y += Math.cos(t * 0.08 + i) * 0.002;
      });

      lightningTimer += dt * 1000;
      if (lightningTimer > lightningInterval) {
        lightningTimer = 0;
        lightningInterval = 250 + Math.random() * 400;
        spawnBolt();
        if (Math.random() < 0.65) setTimeout(spawnBolt, 60);
      }
    }

    drawBolts(dt);
    renderer.render(scene, camera);
  }

  animate();
})();

// ---- SoundCloud Background Music ----
let widget = SC.Widget(document.getElementById('sc-player'));

function startMusic() {
  if (widget) {
    widget.play();
    sessionStorage.setItem("musicPlaying", "true");
    document.removeEventListener('click', startMusic);
    document.removeEventListener('touchstart', startMusic);
  }
}
document.addEventListener('click', startMusic);
document.addEventListener('touchstart', startMusic);


