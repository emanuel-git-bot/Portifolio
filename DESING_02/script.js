(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;

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

  /* ---- do-card expand/collapse ---- */
  document.querySelectorAll(".do-card__toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".do-card");
      const open = card.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", String(open));
    });
  });


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

  /* ---- hero mark: scroll-linked parallax + settle-shrink ---- */
  const heroMark = document.getElementById("heroMark");
  const heroCopy = document.getElementById("heroCopy");
  if (heroMark && !reduceMotion) {
    const heroSection = document.getElementById("topo");
    const stackedLayout = window.matchMedia("(max-width: 900px)");
    let ticking = false;
    const updateParallax = () => {
      const rect = heroSection.getBoundingClientRect();
      const progress = Math.min(Math.max(-rect.top / (rect.height * 0.9), 0), 1);
      const scale = 1 - progress * 0.18;
      const translate = progress * 40;
      const base = stackedLayout.matches ? "" : "translateY(-50%) ";
      heroMark.style.transform = `${base}translateY(${translate}px) scale(${scale})`;
      if (heroCopy) {
        heroCopy.style.opacity = String(1 - progress * 0.7);
        heroCopy.style.transform = `translateY(${progress * -24}px)`;
      }
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
