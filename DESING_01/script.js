(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const root = document.documentElement;

  /* ---- scanfield: cursor-tracked glow over the background grid ---- */
  if (!reduceMotion && finePointer) {
    let scheduled = false;
    let lastX = window.innerWidth / 2;
    let lastY = window.innerHeight * 0.2;
    const applyGlow = () => {
      root.style.setProperty("--mx", lastX + "px");
      root.style.setProperty("--my", lastY + "px");
      scheduled = false;
    };
    window.addEventListener(
      "pointermove",
      (e) => {
        lastX = e.clientX;
        lastY = e.clientY;
        if (!scheduled) {
          scheduled = true;
          requestAnimationFrame(applyGlow);
        }
      },
      { passive: true }
    );
  }

  /* ---- panel tilt + local flashlight glow (Terminal Geral cards) ---- */
  if (!reduceMotion && finePointer) {
    document.querySelectorAll(".panel").forEach((card) => {
      let raf = null;
      let px = 0;
      let py = 0;
      const apply = () => {
        const rect = card.getBoundingClientRect();
        const rx = ((py - rect.height / 2) / rect.height) * -8;
        const ry = ((px - rect.width / 2) / rect.width) * 8;
        card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-3px)`;
        card.style.setProperty("--lx", px + "px");
        card.style.setProperty("--ly", py + "px");
        raf = null;
      };
      card.addEventListener("pointermove", (e) => {
        const rect = card.getBoundingClientRect();
        px = e.clientX - rect.left;
        py = e.clientY - rect.top;
        card.classList.add("is-tilting");
        if (!raf) raf = requestAnimationFrame(apply);
      });
      card.addEventListener("pointerleave", () => {
        card.classList.remove("is-tilting");
        card.style.transform = "";
      });
    });
  }

  /* ---- scroll progress bar + topbar scrolled state ---- */
  const progressBar = document.getElementById("progressBar");
  const topbar = document.querySelector(".topbar");
  if (progressBar || topbar) {
    let ticking = false;
    const updateScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const pct = max > 0 ? (doc.scrollTop / max) * 100 : 0;
      if (progressBar) progressBar.style.width = pct + "%";
      if (topbar) topbar.classList.toggle("is-scrolled", doc.scrollTop > 40);
      ticking = false;
    };
    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(updateScroll);
        }
      },
      { passive: true }
    );
    updateScroll();
  }

  /* ---- mobile nav ---- */
  const navToggle = document.getElementById("navToggle");
  const gateNav = document.getElementById("gateNav");
  if (navToggle && gateNav) {
    navToggle.addEventListener("click", () => {
      const open = gateNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(open));
    });
    gateNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        gateNav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---- split-flap protocol numbers: the signature motion ---- */
  const DIGITS = "0123456789";

  function flapTo(el, finalValue) {
    if (reduceMotion) {
      el.textContent = finalValue;
      return;
    }
    const chars = finalValue.split("");
    const spans = chars.map(() => {
      const s = document.createElement("span");
      s.className = "flap__digit";
      return s;
    });
    el.textContent = "";
    spans.forEach((s) => el.appendChild(s));

    spans.forEach((span, i) => {
      const target = chars[i];
      let ticks = 6 + i * 2;
      let count = 0;
      const interval = setInterval(() => {
        span.textContent = DIGITS[Math.floor(Math.random() * DIGITS.length)];
        count += 1;
        if (count >= ticks) {
          clearInterval(interval);
          span.textContent = target;
          span.classList.add("flap__digit--settled");
        }
      }, 45);
    });
  }

  const flapTargets = document.querySelectorAll("[data-flap-target]");
  if ("IntersectionObserver" in window && flapTargets.length) {
    const flapObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const final = el.textContent.trim();
            flapTo(el, final);
            flapObserver.unobserve(el);
          }
        });
      },
      { threshold: 0.6 }
    );
    flapTargets.forEach((el) => flapObserver.observe(el));
  }

  /* ---- reveal-on-scroll ---- */
  const revealEls = document.querySelectorAll(".reveal");
  document.querySelectorAll(".grid-terminal .reveal, .study-list .reveal").forEach((el, i) => {
    el.style.setProperty("--reveal-delay", Math.min(i % 3, 2) * 70 + "ms");
  });
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
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }
})();
