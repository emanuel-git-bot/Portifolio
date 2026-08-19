(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const hasGsap = typeof window.gsap !== "undefined";
  if (hasGsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  /* ---- Lenis: smooth scroll driving GSAP ScrollTrigger. Lenis animates
     the real document scroll position (not a transformed wrapper), so the
     rest of this file's native scroll/IntersectionObserver code below
     keeps working unmodified alongside it. ---- */
  let lenis = null;
  if (typeof window.Lenis !== "undefined" && !reduceMotion) {
    /* smoothWheel:false makes wheel scroll fully native/instant — no
       easing curve sitting between the wheel and the page moving. Lenis
       stays active only for its .scrollTo() calls (nav-link clicks), so
       those still ease nicely without the constant wheel lag. */
    lenis = new Lenis({ duration: 0.7, smoothWheel: false });
    if (hasGsap) {
      lenis.on("scroll", () => {
        if (window.ScrollTrigger) ScrollTrigger.update();
      });
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => {
        lenis.raf(t);
        requestAnimationFrame(raf);
      };
      requestAnimationFrame(raf);
    }
  }

  /* ---- anchor nav routed through lenis so header/footer links animate
     with the same easing as wheel scroll ---- */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const target = document.querySelector(a.getAttribute("href"));
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -10 });
      else target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    });
  });

  /* ---- custom cursor ---- */
  if (!reduceMotion && finePointer) {
    const dot = document.getElementById("cursorDot");
    if (dot) {
      document.body.classList.add("has-custom-cursor");
      let targetX = window.innerWidth / 2;
      let targetY = window.innerHeight / 2;
      let x = targetX;
      let y = targetY;
      let raf = null;

      const tick = () => {
        x += (targetX - x) * 0.18;
        y += (targetY - y) * 0.18;
        dot.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${dot.classList.contains("is-active") ? 2.4 : 1})`;
        raf = requestAnimationFrame(tick);
      };

      window.addEventListener(
        "pointermove",
        (e) => {
          targetX = e.clientX;
          targetY = e.clientY;
        },
        { passive: true }
      );

      const interactiveSelector = "a, button, input, textarea, [data-cursor='grow']";
      document.addEventListener("pointerover", (e) => {
        if (e.target.closest && e.target.closest(interactiveSelector)) {
          dot.classList.add("is-active");
        }
      });
      document.addEventListener("pointerout", (e) => {
        if (e.target.closest && e.target.closest(interactiveSelector)) {
          dot.classList.remove("is-active");
        }
      });

      raf = requestAnimationFrame(tick);
      window.addEventListener("pointerdown", () => cancelAnimationFrame(raf) || (raf = requestAnimationFrame(tick)), { passive: true });
    }
  }

  /* ---- "O que eu faço" panels: hover expands on desktop (pure CSS);
     click/tap toggles the same expanded state for touch, since touch has
     no hover ---- */
  document.querySelectorAll(".what-content").forEach((panel) => {
    panel.addEventListener("click", () => {
      const parent = panel.parentElement;
      parent.querySelectorAll(".what-content").forEach((p) => {
        p.classList.toggle("what-content-active", p === panel);
        p.classList.toggle("what-sibling", p !== panel);
      });
    });
    panel.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        panel.click();
      }
    });
  });

  /* ---- "Meu Trabalho": horizontal scroll pinned to the viewport while
     the section scrubs past. Falls back to a plain vertical stack (see
     the .no-scroll-pin CSS) under reduced motion, narrow viewports, or if
     GSAP/ScrollTrigger failed to load. ---- */
  function setWorkScroll() {
    const flex = document.getElementById("workFlex");
    const section = document.querySelector(".work-section");
    if (!flex || !section) return;
    if (!hasGsap || !window.ScrollTrigger || reduceMotion || window.innerWidth <= 768) {
      document.body.classList.add("no-scroll-pin");
      return;
    }

    const distance = () => {
      let total = 0;
      Array.prototype.forEach.call(flex.children, (box) => {
        total += box.getBoundingClientRect().width;
      });
      return Math.max(0, total - window.innerWidth + 140);
    };

    gsap.to(flex, {
      x: () => -distance(),
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: () => "+=" + distance(),
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
        anticipatePin: 1,
      },
    });
  }

  /* ---- "Minha Carreira": the vertical line grows from 0 to full height
     as the section scrolls through view ---- */
  function setCareerTimeline() {
    const section = document.querySelector(".career-section");
    const line = document.querySelector(".career-timeline");
    if (!section || !line) return;
    if (!hasGsap || !window.ScrollTrigger || reduceMotion) {
      line.style.maxHeight = "100%";
      return;
    }

    const tl = gsap.timeline({
      scrollTrigger: { trigger: section, start: "top 55%", end: "bottom 65%", scrub: 1.5, invalidateOnRefresh: true },
    });
    tl.fromTo(line, { maxHeight: "0%" }, { maxHeight: "100%", duration: 1, ease: "none" }, 0)
      .fromTo(line, { opacity: 0 }, { opacity: 1, duration: 0.2 }, 0)
      .fromTo(".career-info-box", { opacity: 0 }, { opacity: 1, stagger: 0.1, duration: 0.5 }, 0);
  }

  setWorkScroll();
  setCareerTimeline();
  if (hasGsap && window.ScrollTrigger) {
    window.addEventListener("load", () => {
      window.setTimeout(() => ScrollTrigger.refresh(), 400);
    });
    window.addEventListener("resize", () => ScrollTrigger.refresh());
  }


  /* ---- hero photo: tilt toward the cursor, like a floating card ---- */
  const heroPhoto = document.querySelector(".hero__mark-photo");
  if (heroPhoto && !reduceMotion && finePointer) {
    let raf = null;
    let targetRX = 0;
    let targetRY = 0;
    let rx = 0;
    let ry = 0;
    const settle = () => {
      rx += (targetRX - rx) * 0.12;
      ry += (targetRY - ry) * 0.12;
      heroPhoto.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      if (Math.abs(targetRX - rx) > 0.01 || Math.abs(targetRY - ry) > 0.01) {
        raf = requestAnimationFrame(settle);
      } else {
        raf = null;
      }
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(settle);
    };
    window.addEventListener(
      "pointermove",
      (e) => {
        const rect = heroPhoto.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        const inBounds = e.clientX >= rect.left - 120 && e.clientX <= rect.right + 120 && e.clientY >= rect.top - 120 && e.clientY <= rect.bottom + 120;
        targetRX = inBounds ? py * -10 : 0;
        targetRY = inBounds ? px * 10 : 0;
        kick();
      },
      { passive: true }
    );
  }

  /* ---- snowman mascot: eyes follow cursor, idles, jumps, comes apart ---- */
  const snowman = document.getElementById("snowman");
  if (snowman) {
    const pupils = snowman.querySelectorAll(".snowman__pupil");
    const eyes = snowman.querySelectorAll(".snowman__eye");
    const body = snowman.querySelector(".snowman__body");
    const stackedLayout = window.matchMedia("(max-width: 900px)");

    // eyes track the cursor (skipped on touch — no persistent cursor to track)
    if (!reduceMotion && finePointer) {
      window.addEventListener(
        "pointermove",
        (e) => {
          eyes.forEach((eye, i) => {
            const r = eye.getBoundingClientRect();
            const cx = r.left + r.width / 2;
            const cy = r.top + r.height / 2;
            const angle = Math.atan2(e.clientY - cy, e.clientX - cx);
            const dist = Math.min(2, Math.hypot(e.clientX - cx, e.clientY - cy) / 40);
            pupils[i].style.transform = `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px)`;
          });
        },
        { passive: true }
      );
    }

    // hero companion -> fixed floating mascot once the hero scrolls past
    const heroSectionEl = document.getElementById("topo");
    if (heroSectionEl && "IntersectionObserver" in window) {
      const floatObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!stackedLayout.matches) {
              snowman.classList.toggle("is-floating", !entry.isIntersecting && entry.boundingClientRect.top < 0);
            }
          });
        },
        { threshold: 0, rootMargin: "-40px 0px 0px 0px" }
      );
      floatObserver.observe(heroSectionEl);
    }

    // click/tap: jump normally, come apart and rebuild every third time
    let clickCount = 0;
    const play = () => {
      if (reduceMotion) return;
      clickCount += 1;
      if (clickCount % 3 === 0) {
        snowman.classList.add("is-breaking");
        window.setTimeout(() => snowman.classList.remove("is-breaking"), 1650);
      } else if (body) {
        body.classList.remove("is-jumping");
        void body.offsetWidth; // restart the animation even on rapid re-clicks
        body.classList.add("is-jumping");
        window.setTimeout(() => body.classList.remove("is-jumping"), 650);
      }
    };
    snowman.addEventListener("click", play);
    snowman.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        play();
      }
    });
  }

  /* ---- hero mark: scroll-linked parallax + settle-shrink ----
     Driven by ScrollTrigger (when available) instead of its own native
     `scroll` listener + getBoundingClientRect() read on every frame — that
     duplicate, uncoordinated read/write cycle was fighting Lenis/
     ScrollTrigger's own rAF pipeline for the same frame budget and was the
     actual source of scroll stutter, not Lenis's duration alone. Falls
     back to the old listener only if GSAP isn't available. */
  const heroMark = document.getElementById("heroMark");
  const heroCopy = document.getElementById("heroCopy");
  if (heroMark && !reduceMotion) {
    const heroSection = document.getElementById("topo");
    const stackedLayout = window.matchMedia("(max-width: 900px)");
    const applyParallax = (progress) => {
      const scale = 1 - progress * 0.18;
      const translate = progress * 40;
      const base = stackedLayout.matches ? "" : "translateY(-50%) ";
      heroMark.style.transform = `${base}translateY(${translate}px) scale(${scale})`;
      if (heroCopy) {
        heroCopy.style.opacity = String(1 - progress * 0.7);
        heroCopy.style.transform = `translateY(${progress * -24}px)`;
      }
    };
    if (hasGsap && window.ScrollTrigger) {
      ScrollTrigger.create({
        trigger: heroSection,
        start: "top top",
        end: "+=90%",
        scrub: true,
        onUpdate: (self) => applyParallax(self.progress),
      });
    } else {
      let ticking = false;
      const updateParallax = () => {
        const rect = heroSection.getBoundingClientRect();
        applyParallax(Math.min(Math.max(-rect.top / (rect.height * 0.9), 0), 1));
        ticking = false;
      };
      window.addEventListener(
        "scroll",
        () => {
          if (!ticking) {
            ticking = true;
            requestAnimationFrame(updateParallax);
          }
        },
        { passive: true }
      );
      updateParallax();
    }
  }

  /* ---- reveal-on-scroll (delay set inline per element via --reveal-delay) ---- */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length && !reduceMotion) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }
})();
