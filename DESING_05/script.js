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
     Lightbox das telas de projeto — reaproveita o src que o próprio
     thumbnail já carregou (sem precisar de outro atributo/arquivo, já que
     o build-arquivo-unico.py só embute imagens referenciadas pelo atributo
     src, não href)
     --------------------------------------------------------- */
  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightboxImg');
  var lightboxClose = document.getElementById('lightboxClose');
  if (lightbox && lightboxImg) {
    var closeLightbox = function () {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
    };
    document.querySelectorAll('.work-gallery__thumb').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var img = btn.querySelector('img');
        if (!img) return;
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;
        lightbox.classList.add('is-open');
        lightbox.setAttribute('aria-hidden', 'false');
      });
    });
    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeLightbox();
    });
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
    /* smoothWheel:false makes wheel scroll fully native/instant — no
       easing curve sitting between the wheel and the page moving. Lenis
       stays active only for its .scrollTo() calls (nav-link clicks), so
       those still ease nicely without the constant wheel lag. */
    lenis = new Lenis({ duration: 0.7, smoothWheel: false });

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
     Cursor (ported from DESING_02) — rAF-driven lerp toward the pointer
     instead of a fixed-duration CSS transition per mousemove.
     --------------------------------------------------------- */
  var cursorDot = document.getElementById('cursorDot');
  if (cursorDot && !reduced && finePointer) {
    document.body.classList.add('has-custom-cursor');
    var cdTargetX = window.innerWidth / 2;
    var cdTargetY = window.innerHeight / 2;
    var cdX = cdTargetX;
    var cdY = cdTargetY;
    var cdRaf = null;

    var cdTick = function () {
      cdX += (cdTargetX - cdX) * 0.18;
      cdY += (cdTargetY - cdY) * 0.18;
      cursorDot.style.transform = 'translate(' + cdX + 'px, ' + cdY + 'px) translate(-50%, -50%) scale(' + (cursorDot.classList.contains('is-active') ? 2.4 : 1) + ')';
      cdRaf = requestAnimationFrame(cdTick);
    };

    document.addEventListener('mousemove', function (e) {
      cdTargetX = e.clientX;
      cdTargetY = e.clientY;
    }, { passive: true });

    var cdInteractiveSelector = "a, button, [data-link], .what-content, .tile--icon, #snowman";
    document.addEventListener('mouseover', function (e) {
      if (e.target.closest && e.target.closest(cdInteractiveSelector)) cursorDot.classList.add('is-active');
    });
    document.addEventListener('mouseout', function (e) {
      if (e.target.closest && e.target.closest(cdInteractiveSelector)) cursorDot.classList.remove('is-active');
    });

    cdRaf = requestAnimationFrame(cdTick);
  }

  /* ---------------------------------------------------------
     Sequência de entrada
     --------------------------------------------------------- */
  function initialFX() {
    var mainEl = document.getElementsByTagName('main')[0];
    if (mainEl) {
      /* driven directly instead of via the .main-active CSS keyframe —
         that animation's own timeline wasn't reliably completing (main
         stayed stuck at opacity:0 well after it should have finished),
         so this sets the end state directly and lets a plain transition
         (not a keyframe animation) handle the visual softness */
      mainEl.style.opacity = '1';
    }
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
    gsap.fromTo('.tile--icon',
      { opacity: 0, y: 30, scale: 0.9 },
      { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'power2.out', stagger: 0.02,
        scrollTrigger: { trigger: '.tile-grid--stack', start: 'top 80%' } });

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
     Boneco de neve (ported from DESING_02) — eyes track cursor, idles,
     jumps on click, disassembles/reassembles every 3rd click, and
     switches from hero companion to fixed floating mascot on scroll.
     --------------------------------------------------------- */
  var snowman = document.getElementById('snowman');
  if (snowman) {
    var pupils = snowman.querySelectorAll('.snowman__pupil');
    var eyes = snowman.querySelectorAll('.snowman__eye');
    var body = snowman.querySelector('.snowman__body');
    var stackedLayout = window.matchMedia('(max-width: 900px)');

    if (!reduced && finePointer) {
      document.addEventListener('mousemove', function (e) {
        eyes.forEach(function (eye, i) {
          var r = eye.getBoundingClientRect();
          var cx = r.left + r.width / 2;
          var cy = r.top + r.height / 2;
          var angle = Math.atan2(e.clientY - cy, e.clientX - cx);
          var dist = Math.min(2, Math.hypot(e.clientX - cx, e.clientY - cy) / 40);
          pupils[i].style.transform = 'translate(' + Math.cos(angle) * dist + 'px,' + Math.sin(angle) * dist + 'px)';
        });
      }, { passive: true });
    }

    var heroSectionEl = document.getElementById('inicio');
    if (heroSectionEl && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!stackedLayout.matches) {
            snowman.classList.toggle('is-floating', !entry.isIntersecting && entry.boundingClientRect.top < 0);
          }
        });
      }, { threshold: 0, rootMargin: '-40px 0px 0px 0px' }).observe(heroSectionEl);
    }

    var clickCount = 0;
    var play = function () {
      if (reduced) return;
      clickCount += 1;
      if (clickCount % 3 === 0) {
        snowman.classList.add('is-breaking');
        window.setTimeout(function () { snowman.classList.remove('is-breaking'); }, 1650);
      } else if (body) {
        body.classList.remove('is-jumping');
        void body.offsetWidth;
        body.classList.add('is-jumping');
        window.setTimeout(function () { body.classList.remove('is-jumping'); }, 650);
      }
    };
    snowman.addEventListener('click', play);
    snowman.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); play(); }
    });
  }

  /* ---------------------------------------------------------
     Boneco de neve 2 ("Sobre mim") — mesmos truques do herói: os olhos
     seguem o cursor, pula ao clicar, desmonta a cada 3º clique, e ainda
     inclina um pouco em direção ao mouse quando ele passa perto (o
     "buzinar" do nariz e o "piscar" do olho já são hover puro em CSS).
     Ele vive dentro de uma cena aria-hidden (é decoração, não repete
     conteúdo do herói), então não ganha tabindex/keydown — só clique.
     --------------------------------------------------------- */
  var coderSnowman = document.getElementById('coderSnowman');
  if (coderSnowman) {
    var coderPupils = coderSnowman.querySelectorAll('.coder-snowman__pupil');
    var coderEyes = coderSnowman.querySelectorAll('.coder-snowman__eye');

    if (!reduced && finePointer) {
      var coderTiltTarget = 0;
      var coderTiltCurrent = 0;
      var coderTiltTick = function () {
        coderTiltCurrent += (coderTiltTarget - coderTiltCurrent) * 0.12;
        coderSnowman.style.setProperty('--coder-tilt', coderTiltCurrent.toFixed(2) + 'deg');
        requestAnimationFrame(coderTiltTick);
      };
      requestAnimationFrame(coderTiltTick);

      document.addEventListener('mousemove', function (e) {
        coderEyes.forEach(function (eye, i) {
          var r = eye.getBoundingClientRect();
          var cx = r.left + r.width / 2;
          var cy = r.top + r.height / 2;
          var angle = Math.atan2(e.clientY - cy, e.clientX - cx);
          var dist = Math.min(4, Math.hypot(e.clientX - cx, e.clientY - cy) / 40);
          coderPupils[i].style.transform = 'translate(' + Math.cos(angle) * dist + 'px,' + Math.sin(angle) * dist + 'px)';
        });

        /* inclina na direção do mouse só quando ele está perto — longe
           disso, volta devagar (via lerp) pro -7deg de base */
        var sr = coderSnowman.getBoundingClientRect();
        var scx = sr.left + sr.width / 2;
        var scy = sr.top + sr.height / 2;
        var sdx = e.clientX - scx;
        var proximity = 420;
        var sdist = Math.hypot(sdx, e.clientY - scy);
        coderTiltTarget = sdist < proximity ? Math.max(-6, Math.min(6, (sdx / proximity) * 6)) : 0;
      }, { passive: true });
    }

    var coderClickCount = 0;
    var playCoder = function () {
      if (reduced) return;
      coderClickCount += 1;
      if (coderClickCount % 3 === 0) {
        coderSnowman.classList.add('is-melting');
        window.setTimeout(function () { coderSnowman.classList.remove('is-melting'); }, 2200);
      } else {
        coderSnowman.classList.remove('is-jumping');
        void coderSnowman.offsetWidth;
        coderSnowman.classList.add('is-jumping');
        window.setTimeout(function () { coderSnowman.classList.remove('is-jumping'); }, 650);
      }
    };
    coderSnowman.addEventListener('click', playCoder);
  }

  /* ---------------------------------------------------------
     Foto do herói: inclina em direção ao cursor, como um cartão
     flutuante (ported from DESING_02 — a mesma animação de mouse que já
     existia lá, mas nunca tinha vindo junto com o resto da hero).
     --------------------------------------------------------- */
  var heroPhoto = document.querySelector('.hero__mark-photo');
  if (heroPhoto && !reduced && finePointer) {
    var photoRaf = null;
    var photoTargetRX = 0;
    var photoTargetRY = 0;
    var photoRX = 0;
    var photoRY = 0;
    var photoSettle = function () {
      photoRX += (photoTargetRX - photoRX) * 0.12;
      photoRY += (photoTargetRY - photoRY) * 0.12;
      heroPhoto.style.transform = 'perspective(1000px) rotateX(' + photoRX + 'deg) rotateY(' + photoRY + 'deg)';
      if (Math.abs(photoTargetRX - photoRX) > 0.01 || Math.abs(photoTargetRY - photoRY) > 0.01) {
        photoRaf = requestAnimationFrame(photoSettle);
      } else {
        photoRaf = null;
      }
    };
    var photoKick = function () {
      if (!photoRaf) photoRaf = requestAnimationFrame(photoSettle);
    };
    window.addEventListener('pointermove', function (e) {
      var rect = heroPhoto.getBoundingClientRect();
      var px = (e.clientX - rect.left) / rect.width - 0.5;
      var py = (e.clientY - rect.top) / rect.height - 0.5;
      var inBounds = e.clientX >= rect.left - 120 && e.clientX <= rect.right + 120 && e.clientY >= rect.top - 120 && e.clientY <= rect.bottom + 120;
      photoTargetRX = inBounds ? py * -10 : 0;
      photoTargetRY = inBounds ? px * 10 : 0;
      photoKick();
    }, { passive: true });
  }

  /* ---------------------------------------------------------
     Marca do herói (foto): paralaxe ao rolar (ported from DESING_02).
     Driven by ScrollTrigger's own progress tracking rather than a
     separate native `scroll` listener + getBoundingClientRect() read —
     a duplicate read/write cycle like that fought Lenis/ScrollTrigger's
     own rAF pipeline for the same frame and caused visible stutter when
     tried that way on DESING_02; this avoids it from the start.
     --------------------------------------------------------- */
  function setHeroParallax() {
    var heroMark = document.getElementById('heroMark');
    var heroCopyEl = document.getElementById('heroCopy');
    if (!heroMark || reduced) return;
    var heroSectionEl = document.getElementById('inicio');
    var stackedLayoutMark = window.matchMedia('(max-width: 900px)');
    var apply = function (progress) {
      var scale = 1 - progress * 0.18;
      var translate = progress * 40;
      var base = stackedLayoutMark.matches ? '' : 'translateY(-50%) ';
      heroMark.style.transform = base + 'translateY(' + translate + 'px) scale(' + scale + ')';
      if (heroCopyEl) {
        heroCopyEl.style.opacity = String(1 - progress * 0.7);
        heroCopyEl.style.transform = 'translateY(' + (progress * -24) + 'px)';
      }
    };
    if (hasGsap && window.ScrollTrigger) {
      ScrollTrigger.create({
        trigger: heroSectionEl,
        start: 'top top',
        end: '+=90%',
        scrub: true,
        onUpdate: function (self) { apply(self.progress); },
      });
    } else {
      var ticking = false;
      var update = function () {
        var rect = heroSectionEl.getBoundingClientRect();
        apply(Math.min(Math.max(-rect.top / (rect.height * 0.9), 0), 1));
        ticking = false;
      };
      window.addEventListener('scroll', function () {
        if (!ticking) { ticking = true; requestAnimationFrame(update); }
      }, { passive: true });
      update();
    }
  }

  /* ---------------------------------------------------------
     Inicialização — roda direto, sem tela de entrada
     --------------------------------------------------------- */
  initialFX();
  setWorkScroll();
  setSplitText();
  setCareerTimeline();
  setStackReveal();
  setHeroParallax();
  if (hasGsap && window.ScrollTrigger) {
    window.setTimeout(function () { ScrollTrigger.refresh(); }, 900);
  }

  window.addEventListener('resize', function () {
    if (hasGsap && window.ScrollTrigger) ScrollTrigger.refresh();
  });
})();
