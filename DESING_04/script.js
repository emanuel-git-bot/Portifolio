/* =========================================================
   Emanuel Roque — Portfólio
   Animações modeladas nas do site de referência
   (redoyanulhaque.me — código MIT © 2025 Redoyanul Haque)
   ========================================================= */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;
  var hasGsap = typeof window.gsap !== 'undefined';

  if (hasGsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  /* ---------------------------------------------------------
     Divisor de texto: quebra em palavras e caracteres
     --------------------------------------------------------- */
  function splitText(el, mode) {
    if (!el || el.dataset.split === 'done') {
      return { chars: el ? Array.from(el.querySelectorAll('.split-char')) : [],
               words: el ? Array.from(el.querySelectorAll('.split-word')) : [] };
    }
    var text = el.textContent.replace(/\s+/g, ' ').trim();
    var words = text.split(' ');
    var chars = [], wordEls = [];
    el.textContent = '';

    words.forEach(function (word, wi) {
      var wSpan = document.createElement('span');
      wSpan.className = 'split-word';

      if (mode === 'chars') {
        word.split('').forEach(function (ch) {
          var cSpan = document.createElement('span');
          cSpan.className = 'split-char';
          cSpan.textContent = ch;
          wSpan.appendChild(cSpan);
          chars.push(cSpan);
        });
      } else {
        wSpan.textContent = word;
      }

      el.appendChild(wSpan);
      wordEls.push(wSpan);
      if (wi < words.length - 1) el.appendChild(document.createTextNode(' '));
    });

    el.dataset.split = 'done';
    return { chars: chars, words: wordEls };
  }

  /* ---------------------------------------------------------
     Lenis — rolagem suave
     --------------------------------------------------------- */
  var lenis = null;
  if (typeof window.Lenis !== 'undefined' && !reduced) {
    lenis = new Lenis({ duration: 1.2, smoothWheel: true });
    lenis.stop();

    if (hasGsap) {
      lenis.on('scroll', function () {
        if (window.ScrollTrigger) ScrollTrigger.update();
      });
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      requestAnimationFrame(function raf(t) { lenis.raf(t); requestAnimationFrame(raf); });
    }
  }

  /* ---------------------------------------------------------
     Navegação por âncora
     --------------------------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -10 });
      else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    });
  });

  /* ---------------------------------------------------------
     Cursor
     --------------------------------------------------------- */
  var cursor = document.getElementById('cursor');
  if (cursor && finePointer && window.innerWidth >= 600) {
    cursor.classList.remove('cursor-disable');
    document.addEventListener('mousemove', function (e) {
      cursor.style.top = e.clientY + 'px';
      cursor.style.left = e.clientX + 'px';
    }, { passive: true });

    document.querySelectorAll('a, button, [data-link], .what-content, .techstack-item, #snowman')
      .forEach(function (el) {
        el.addEventListener('mouseenter', function () { cursor.classList.add('is-hover'); });
        el.addEventListener('mouseleave', function () { cursor.classList.remove('is-hover'); });
      });
  }

  /* ---------------------------------------------------------
     Sequência de entrada
     --------------------------------------------------------- */
  function initialFX() {
    document.body.classList.remove('is-locked');
    if (lenis) lenis.start();

    var mainEl = document.getElementsByTagName('main')[0];
    if (mainEl) mainEl.classList.add('main-active');
    document.body.classList.add('character-loaded');

    if (!hasGsap || reduced) {
      ['.header', '.icons-section', '.nav-fade'].forEach(function (s) {
        var el = document.querySelector(s);
        if (el) el.style.opacity = 1;
      });
      return;
    }

    /* nome + saudação: caracteres subindo com blur */
    var introTargets = [];
    ['.landing-info h3', '.landing-intro h2', '.landing-intro h1'].forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        if (el.querySelector('br')) {
          var lines = el.innerHTML.split(/<br\s*\/?>/i);
          el.innerHTML = '';
          lines.forEach(function (line) {
            var span = document.createElement('span');
            span.className = 'split-line';
            span.textContent = line.trim();
            el.appendChild(span);
            introTargets.push(splitText(span, 'chars').chars);
          });
        } else {
          introTargets.push(splitText(el, 'chars').chars);
        }
      });
    });
    var introChars = introTargets.reduce(function (a, b) { return a.concat(b); }, []);

    gsap.fromTo(introChars,
      { opacity: 0, y: 80, filter: 'blur(5px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.2,
        ease: 'power3.inOut', stagger: 0.025, delay: 0.3 });

    gsap.fromTo('.landing-visual',
      { opacity: 0 },
      { opacity: 1, duration: 1.4, ease: 'power2.out', delay: 0.5,
        clearProps: 'transform' });

    gsap.fromTo(['.header', '.icons-section', '.nav-fade'],
      { opacity: 0 },
      { opacity: 1, duration: 1.2, ease: 'power1.inOut', delay: 0.1 });

    /* troca cíclica do cargo */
    var elA1 = document.querySelector('.landing-h2-1');
    var elB1 = document.querySelector('.landing-h2-2');
    var elA2 = document.querySelector('.landing-h2-info');
    var elB2 = document.querySelector('.landing-h2-info-1');

    var t1 = splitText(elA1, 'chars').chars;
    var t3 = splitText(elA2, 'chars').chars;
    splitText(elB1, 'chars');
    splitText(elB2, 'chars');

    gsap.fromTo([t1, t3], { opacity: 0, y: 80, filter: 'blur(5px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.2,
        ease: 'power3.inOut', stagger: 0.025, delay: 0.3 });

    loopText(elA1, elB1);
    loopText(elA2, elB2);
  }

  /* alterna dois blocos de texto: um sai por cima enquanto o outro entra por baixo */
  function loopText(elA, elB) {
    if (!elA || !elB) return;
    var a = Array.from(elA.querySelectorAll('.split-char'));
    var b = Array.from(elB.querySelectorAll('.split-char'));
    if (!a.length || !b.length) return;

    /* o pai carrega opacity:0 no CSS para não piscar antes do JS rodar */
    gsap.set(elB, { opacity: 1 });
    /* b começa fora da caixa (a caixa tem overflow hidden) */
    gsap.set(b, { y: 90 });

    var tl = gsap.timeline({
      repeat: -1,
      defaults: { duration: 1.1, ease: 'power3.inOut', stagger: 0.05 }
    });

    tl.to(a, { y: -90 }, 4)      // primeiro sobe e some
      .to(b, { y: 0 }, 4)        // segundo entra por baixo
      .to(b, { y: -90 }, 9)      // segundo sobe e some
      .set(a, { y: 90 }, 9)      // primeiro reposicionado embaixo
      .to(a, { y: 0 }, 9)        // e volta
      .set(b, { y: 90 }, 10.4);  // segundo pronto para o próximo ciclo
  }

  /* ---------------------------------------------------------
     Revelações no scroll: títulos por caractere, textos por palavra
     --------------------------------------------------------- */
  function setSplitText() {
    if (!hasGsap || reduced || window.innerWidth < 900) return;

    document.querySelectorAll('.para').forEach(function (para) {
      var words = splitText(para, 'words').words;
      gsap.fromTo(words,
        { autoAlpha: 0, y: 80 },
        { autoAlpha: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.02,
          scrollTrigger: { trigger: para, start: 'top 90%', once: true } });
    });

    document.querySelectorAll('.title').forEach(function (title) {
      if (title.classList.contains('no-split') || title.querySelector('br') || title.children.length) {
        gsap.fromTo(title,
          { autoAlpha: 0, y: 60 },
          { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power2.inOut',
            scrollTrigger: { trigger: title, start: 'top 92%', once: true } });
        return;
      }
      var chars = splitText(title, 'chars').chars;
      gsap.fromTo(chars,
        { autoAlpha: 0, y: 80, rotate: 10 },
        { autoAlpha: 1, y: 0, rotate: 0, duration: 0.8, ease: 'power2.inOut', stagger: 0.03,
          scrollTrigger: { trigger: title, start: 'top 92%', once: true } });
    });
  }

  /* ---------------------------------------------------------
     Projetos: rolagem horizontal fixada
     --------------------------------------------------------- */
  function setWorkScroll() {
    if (!hasGsap || reduced || window.innerWidth <= 768) return;
    var flex = document.getElementById('workFlex');
    var section = document.querySelector('.work-section');
    if (!flex || !section) return;

    var distance = function () {
      var total = 0;
      Array.prototype.forEach.call(flex.children, function (box) {
        total += box.getBoundingClientRect().width;
      });
      return Math.max(0, total - window.innerWidth + 140);
    };

    gsap.to(flex, {
      x: function () { return -distance(); },
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: function () { return '+=' + distance(); },
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
        anticipatePin: 1
      }
    });
  }

  /* ---------------------------------------------------------
     Carreira: a linha do tempo cresce conforme a rolagem
     --------------------------------------------------------- */
  function setCareerTimeline() {
    if (!hasGsap || reduced) return;
    var section = document.querySelector('.career-section');
    if (!section) return;

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 55%',
        end: 'bottom 65%',
        scrub: 1.5,
        invalidateOnRefresh: true
      }
    });

    tl.fromTo('.career-timeline', { maxHeight: '0%' }, { maxHeight: '100%', duration: 1, ease: 'none' }, 0)
      .fromTo('.career-timeline', { opacity: 0 }, { opacity: 1, duration: 0.2 }, 0)
      .fromTo('.career-info-box', { opacity: 0 }, { opacity: 1, stagger: 0.1, duration: 0.5 }, 0);
  }

  /* ---------------------------------------------------------
     Tech stack: itens entram em cascata
     --------------------------------------------------------- */
  function setStackReveal() {
    if (!hasGsap || reduced) return;
    gsap.fromTo('.techstack-item',
      { opacity: 0, y: 30, scale: 0.9 },
      { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'power2.out', stagger: 0.02,
        scrollTrigger: { trigger: '.techstack-pyramid', start: 'top 80%' } });

    gsap.fromTo('.tool-card',
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', stagger: 0.05,
        scrollTrigger: { trigger: '.tools-grid', start: 'top 85%' } });

    gsap.fromTo('.work-box',
      { opacity: 0 },
      { opacity: 1, duration: 0.6, stagger: 0.08,
        scrollTrigger: { trigger: '.work-section', start: 'top 70%' } });
  }

  /* ---------------------------------------------------------
     Painéis "O que eu faço" — toque abre no mobile
     --------------------------------------------------------- */
  document.querySelectorAll('.what-content').forEach(function (panel) {
    panel.addEventListener('click', function () {
      var parent = panel.parentElement;
      parent.querySelectorAll('.what-content').forEach(function (p) {
        p.classList.toggle('what-content-active', p === panel);
        p.classList.toggle('what-sibling', p !== panel);
      });
    });
    panel.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); panel.click(); }
    });
  });

  /* ---------------------------------------------------------
     Boneco de neve
     --------------------------------------------------------- */
  var snowman = document.getElementById('snowman');
  var clicks = 0, busy = false;

  if (snowman && finePointer && !reduced) {
    var eyes = snowman.querySelectorAll('.sm-eye');
    var mx = 0, my = 0, pending = false;

    document.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      if (pending) return;
      pending = true;
      requestAnimationFrame(function () {
        pending = false;
        eyes.forEach(function (eye) {
          var pupil = eye.querySelector('.sm-pupil');
          if (!pupil) return;
          var box = eye.getBoundingClientRect();
          var dx = mx - (box.left + box.width / 2);
          var dy = my - (box.top + box.height / 2);
          var dist = Math.sqrt(dx * dx + dy * dy) || 1;
          var max = 2.1;
          pupil.style.transform = 'translate(' +
            (dx / dist) * Math.min(max, dist / 26) + 'px,' +
            (dy / dist) * Math.min(max, dist / 26) + 'px)';
        });
      });
    }, { passive: true });
  }

  function reactSnowman() {
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
    snowman.addEventListener('click', reactSnowman);
    snowman.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault(); reactSnowman();
      }
    });
  }

  /* companheiro no herói → mascote fixo no canto */
  var hero = document.getElementById('inicio');
  var narrow = window.matchMedia('(max-width: 768px)');
  if (hero && snowman && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (narrow.matches) { document.body.classList.remove('snowman-docked'); return; }
        document.body.classList.toggle('snowman-docked', !entry.isIntersecting);
      });
    }, { threshold: 0.15 }).observe(hero);
  }

  /* ---------------------------------------------------------
     Tela de entrada
     --------------------------------------------------------- */
  var loadingScreen = document.getElementById('loadingScreen');
  var loadingButton = document.getElementById('loadingButton');

  document.body.classList.add('is-locked');

  function enter() {
    if (!loadingScreen) return;
    loadingScreen.classList.add('is-out');
    window.setTimeout(function () { loadingScreen.style.display = 'none'; }, 800);
    initialFX();
    setWorkScroll();
    setSplitText();
    setCareerTimeline();
    setStackReveal();
    if (hasGsap && window.ScrollTrigger) {
      window.setTimeout(function () { ScrollTrigger.refresh(); }, 900);
    }
  }

  if (loadingButton) loadingButton.addEventListener('click', enter);

  /* se algo falhar no carregamento, entra sozinho depois de 6s */
  window.setTimeout(function () {
    if (loadingScreen && !loadingScreen.classList.contains('is-out')) enter();
  }, 6000);

  window.addEventListener('resize', function () {
    if (hasGsap && window.ScrollTrigger) ScrollTrigger.refresh();
  });
})();
