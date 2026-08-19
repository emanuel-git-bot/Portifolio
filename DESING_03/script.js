/* =========================================================
   Emanuel Roque — Portfólio
   ========================================================= */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;

  /* ---------------------------------------------------------
     1. Cursor customizado (apenas ponteiro fino)
     --------------------------------------------------------- */
  if (finePointer) {
    var dot = document.querySelector('.cursor-dot');
    var ring = document.querySelector('.cursor-ring');
    var mx = window.innerWidth / 2, my = window.innerHeight / 2;
    var rx = mx, ry = my;

    document.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate(' + mx + 'px,' + my + 'px) translate(-50%,-50%)';
    }, { passive: true });

    (function loop() {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px) translate(-50%,-50%)';
      requestAnimationFrame(loop);
    })();

    document.querySelectorAll('a, button, [role="button"], .chips li').forEach(function (el) {
      el.addEventListener('mouseenter', function () { ring.classList.add('is-hot'); });
      el.addEventListener('mouseleave', function () { ring.classList.remove('is-hot'); });
    });
  }

  /* ---------------------------------------------------------
     2. Revelação de blocos no scroll
     --------------------------------------------------------- */
  var revealables = document.querySelectorAll('.reveal');

  if (reduced || !('IntersectionObserver' in window)) {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.05 });

    revealables.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------------------------------------------------------
     3. Seção ativa no trilho de navegação
     --------------------------------------------------------- */
  var sections = document.querySelectorAll('section[id]');
  var railItems = document.querySelectorAll('.rail-item');

  if ('IntersectionObserver' in window) {
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.id;
        railItems.forEach(function (item) {
          item.classList.toggle('is-active', item.getAttribute('data-nav') === id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    sections.forEach(function (s) { navObserver.observe(s); });
  }

  /* ---------------------------------------------------------
     4. Boneco de neve
     --------------------------------------------------------- */
  var snowman = document.getElementById('snowman');
  var pupils = snowman ? snowman.querySelectorAll('.sm-pupil') : [];
  var clicks = 0;
  var busy = false;

  /* 4a. Olhos seguem o cursor (só em pointer:fine) */
  if (snowman && finePointer && !reduced) {
    var eyes = snowman.querySelectorAll('.sm-eye');
    var targetX = 0, targetY = 0;
    var pending = false;

    document.addEventListener('mousemove', function (e) {
      targetX = e.clientX;
      targetY = e.clientY;
      if (pending) return;
      pending = true;
      requestAnimationFrame(function () {
        pending = false;
        eyes.forEach(function (eye) {
          var pupil = eye.querySelector('.sm-pupil');
          if (!pupil) return;
          var box = eye.getBoundingClientRect();
          var cx = box.left + box.width / 2;
          var cy = box.top + box.height / 2;
          var dx = targetX - cx;
          var dy = targetY - cy;
          var dist = Math.sqrt(dx * dx + dy * dy) || 1;
          var max = 2.1;
          var ox = (dx / dist) * Math.min(max, dist / 26);
          var oy = (dy / dist) * Math.min(max, dist / 26);
          pupil.style.transform = 'translate(' + ox + 'px,' + oy + 'px)';
        });
      });
    }, { passive: true });
  }

  /* 4b. Pulo — e, a cada terceiro clique, desmonte e remonte */
  function react() {
    if (!snowman || busy || reduced) return;
    clicks += 1;
    busy = true;

    if (clicks % 3 === 0) {
      snowman.classList.add('is-scattering');
      window.setTimeout(function () {
        snowman.classList.remove('is-scattering');
        window.setTimeout(function () { busy = false; }, 900);
      }, 1000);
    } else {
      snowman.classList.add('is-jumping');
      window.setTimeout(function () {
        snowman.classList.remove('is-jumping');
        busy = false;
      }, 640);
    }
  }

  if (snowman) {
    snowman.addEventListener('click', react);
    snowman.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        react();
      }
    });
  }

  /* 4c. Companheiro no herói → mascote fixo no canto */
  var hero = document.getElementById('inicio');
  var isNarrow = window.matchMedia('(max-width: 860px)');

  if (hero && snowman && 'IntersectionObserver' in window) {
    var heroObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (isNarrow.matches) {
          document.body.classList.remove('snowman-docked');
          return;
        }
        document.body.classList.toggle('snowman-docked', !entry.isIntersecting);
      });
    }, { threshold: 0.18 });

    heroObserver.observe(hero);
  }

  /* ---------------------------------------------------------
     5. Ano do rodapé (mantém a assinatura atual sem editar HTML)
     --------------------------------------------------------- */
  // A assinatura é fixa por definição do conteúdo: © 2026.
})();
