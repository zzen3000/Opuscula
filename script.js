(() => {
  "use strict";

  /* ========================================================================
     1. Cosmic Starfield & Shooting Stars Canvas (AstralGames Background)
     ======================================================================== */
  const canvas = document.getElementById("starfield");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduceMotion = reducedMotionQuery.matches;
    let isMobile = window.innerWidth < 768;
    let docHeight = 0;
    let frame = 0;
    let rafId = null;
    let running = false;

    const starCount = isMobile ? 90 : 200;
    const stars = [];

    const amberMeteor = { r: 255, g: 200, b: 150 };
    const astralMeteors = [
      { r: 81, g: 131, b: 225 },
      { r: 129, g: 87, b: 219 },
    ];
    let meteor = null;
    let meteorCooldown = 0;

    function syncCanvasSize() {
      isMobile = window.innerWidth < 768;
      const nextDocHeight = Math.max(document.documentElement.scrollHeight, window.innerHeight);
      const prevDocHeight = docHeight;
      docHeight = nextDocHeight;

      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }

      if (prevDocHeight > 0 && docHeight > prevDocHeight && stars.length > 0) {
        for (const s of stars) {
          if (Math.random() < (docHeight - prevDocHeight) / docHeight) {
            s.y = prevDocHeight + Math.random() * (docHeight - prevDocHeight);
          }
        }
      }
    }

    syncCanvasSize();
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * docHeight,
        size: 2 * Math.random() + 0.5,
        opacity: 0.6 * Math.random() + 0.2,
        speed: 0.15 * Math.random() + 0.02,
        twinkleSpeed: 0.02 * Math.random() + 0.005,
        twinklePhase: Math.random() * Math.PI * 2,
      });
    }

    function drawStaticStars() {
      if (!ctx) return;
      syncCanvasSize();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(0, -window.scrollY);
      for (const s of stars) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${s.opacity})`;
        ctx.fill();
      }
      ctx.restore();
    }

    function renderFrame() {
      if (!running || !ctx) return;
      frame++;
      syncCanvasSize();

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(0, -window.scrollY);

      for (const s of stars) {
        s.y += s.speed;
        if (s.y > docHeight) {
          s.y = -2;
          s.x = Math.random() * canvas.width;
        }
        const twinkle = 0.3 * Math.sin(frame * s.twinkleSpeed + s.twinklePhase) + 0.7;
        const alpha = s.opacity * twinkle;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fill();
      }

      if (meteor) {
        meteor.x += meteor.vx;
        meteor.y += meteor.vy;
        meteor.life--;

        const lifeAlpha = Math.min((meteor.life / meteor.maxLife) * 2, 1) * (meteor.life / meteor.maxLife);
        if (lifeAlpha > 0) {
          const speed = Math.hypot(meteor.vx, meteor.vy);
          const dx = meteor.vx / speed;
          const dy = meteor.vy / speed;
          const tailLength = 26 * meteor.size;
          const tailX = meteor.x - dx * tailLength;
          const tailY = meteor.y - dy * tailLength;

          const grad = ctx.createLinearGradient(tailX, tailY, meteor.x, meteor.y);
          grad.addColorStop(0, `rgba(${meteor.color.r}, ${meteor.color.g}, ${meteor.color.b}, 0)`);
          grad.addColorStop(1, `rgba(${meteor.color.r}, ${meteor.color.g}, ${meteor.color.b}, ${lifeAlpha})`);

          ctx.beginPath();
          ctx.moveTo(tailX, tailY);
          ctx.lineTo(meteor.x, meteor.y);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.4 * meteor.size;
          ctx.lineCap = "round";
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(meteor.x, meteor.y, 1.6 * meteor.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${meteor.color.r}, ${meteor.color.g}, ${meteor.color.b}, ${lifeAlpha})`;
          ctx.fill();
        }

        if (meteor.life <= 0) {
          meteor = null;
          meteorCooldown = Math.round((60 + 80 * Math.random()) / (isMobile ? 2 : 1));
        }
      } else if (meteorCooldown > 0) {
        meteorCooldown--;
      } else {
        const fromLeft = Math.random() < 0.5;
        const angle = fromLeft ? (Math.random() * Math.PI) / 6 : Math.PI - (Math.random() * Math.PI) / 6;
        const size = 0.4 + 2.1 * Math.random();
        const speed = 2.5 + 1.5 * Math.random() - 0.5 * size;
        const maxLife = 350 + 250 * Math.random();
        const useAstralColor = Math.random() < 0.25;

        meteor = {
          x: fromLeft ? -20 : canvas.width + 20,
          y: Math.random() * docHeight,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: maxLife,
          maxLife,
          size,
          color: useAstralColor
            ? astralMeteors[Math.floor(Math.random() * astralMeteors.length)]
            : amberMeteor,
        };
        meteorCooldown = Math.round((80 + 120 * Math.random()) / (isMobile ? 2 : 1));
      }

      ctx.restore();
      rafId = requestAnimationFrame(renderFrame);
    }

    function startStars() {
      if (running || reduceMotion) return;
      running = true;
      rafId = requestAnimationFrame(renderFrame);
    }

    function stopStars() {
      running = false;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }

    window.addEventListener("resize", () => {
      syncCanvasSize();
      if (reduceMotion) drawStaticStars();
    });

    reducedMotionQuery.addEventListener("change", (event) => {
      reduceMotion = event.matches;
      if (reduceMotion) {
        stopStars();
        drawStaticStars();
      } else {
        startStars();
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stopStars();
      else startStars();
    });

    if (reduceMotion) drawStaticStars();
    else startStars();
  }

  /* ========================================================================
     2. Sticky Header Scroll State, Progress Line & Back-to-Top Button
     ======================================================================== */
  const siteNav = document.getElementById("site-nav");
  const navProgress = document.getElementById("nav-progress");
  const backToTopBtn = document.getElementById("back-to-top");

  function updateScrollEffects() {
    const scrollY = window.scrollY;
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const ratio = Math.min(1, Math.max(0, scrollY / maxScroll));

    if (siteNav) {
      siteNav.setAttribute("data-scrolled", scrollY > 12 ? "true" : "false");
    }
    if (navProgress) {
      navProgress.style.transform = `scaleX(${ratio})`;
    }
    if (backToTopBtn) {
      backToTopBtn.classList.toggle("is-visible", scrollY > 260);
    }
  }

  window.addEventListener("scroll", updateScrollEffects, { passive: true });
  updateScrollEffects();

  if (backToTopBtn) {
    backToTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ========================================================================
     3. Sliding Navbar Pill Indicator (AstralGames Desktop Nav)
     ======================================================================== */
  const navLinksWrap = document.getElementById("nav-links");
  const navPill = document.getElementById("nav-pill");
  const navLinks = Array.from(document.querySelectorAll("[data-nav-link]"));

  function moveNavPill(target) {
    if (!navPill || !target) {
      if (navPill) navPill.style.opacity = "0";
      return;
    }
    navPill.style.width = `${target.offsetWidth}px`;
    navPill.style.transform = `translate3d(${target.offsetLeft}px, -50%, 0)`;
    navPill.style.opacity = "1";
  }

  if (navLinksWrap && navPill && navLinks.length > 0) {
    const activeLink = navLinks.find((link) => link.classList.contains("is-active")) || navLinks[0];
    requestAnimationFrame(() => moveNavPill(activeLink));

    for (const link of navLinks) {
      link.addEventListener("mouseenter", () => moveNavPill(link));
      link.addEventListener("click", () => {
        navLinks.forEach((l) => l.classList.remove("is-active"));
        link.classList.add("is-active");
        moveNavPill(link);
      });
    }

    navLinksWrap.addEventListener("mouseleave", () => {
      const current = navLinks.find((link) => link.classList.contains("is-active"));
      moveNavPill(current || null);
    });

    window.addEventListener("resize", () => {
      const current = navLinks.find((link) => link.classList.contains("is-active"));
      if (current) moveNavPill(current);
    });
  }

  /* ========================================================================
     4. Mobile Disclosure Menu
     ======================================================================== */
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener("click", () => {
      const isOpen = mobileMenu.getAttribute("data-open") === "true";
      mobileMenu.setAttribute("data-open", String(!isOpen));
      mobileMenuBtn.setAttribute("aria-expanded", String(!isOpen));
    });

    mobileMenu.querySelectorAll("a").forEach((anchor) => {
      anchor.addEventListener("click", () => {
        mobileMenu.setAttribute("data-open", "false");
        mobileMenuBtn.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ========================================================================
     5. Section Scroll Reveal & Active Nav Scrollspy
     ======================================================================== */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -20px 0px", threshold: 0.02 }
    );
    revealEls.forEach((el) => observer.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-revealed"));
  }

  const spyTargets = [
    { id: "showcase", link: navLinks.find((l) => l.getAttribute("href") === "#showcase") },
    { id: "about", link: navLinks.find((l) => l.getAttribute("href") === "#about") },
  ]
    .map((item) => {
      const el = document.getElementById(item.id);
      return el && item.link ? { link: item.link, el } : null;
    })
    .filter(Boolean);

  if (spyTargets.length > 0 && "IntersectionObserver" in window) {
    const spyObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length === 0) return;
        const match = spyTargets.find((item) => item.el === visible[0].target);
        if (!match) return;
        navLinks.forEach((l) => l.classList.remove("is-active"));
        match.link.classList.add("is-active");
        if (navLinksWrap && !navLinksWrap.matches(":hover")) {
          moveNavPill(match.link);
        }
      },
      { rootMargin: "-25% 0px -55% 0px", threshold: 0.01 }
    );
    spyTargets.forEach((item) => spyObserver.observe(item.el));
  }

  /* ========================================================================
     6. Fullscreen Artwork Lightbox
     ======================================================================== */
  const lightbox = document.getElementById("lightbox");
  const closeLightboxBtn = document.getElementById("close-lightbox-btn");
  const openTriggers = [
    document.getElementById("open-lightbox-btn"),
    document.getElementById("nav-inspect-btn"),
    document.getElementById("hero-inspect-btn"),
    document.getElementById("sidebar-inspect-btn"),
  ].filter(Boolean);

  let lastFocused = null;

  function openLightbox() {
    if (!lightbox) return;
    lastFocused = document.activeElement;
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
    if (closeLightboxBtn) closeLightboxBtn.focus();
  }

  function closeLightbox() {
    if (!lightbox || lightbox.hidden) return;
    lightbox.hidden = true;
    document.body.style.overflow = "";
    if (lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus();
    }
  }

  openTriggers.forEach((btn) => btn.addEventListener("click", openLightbox));
  if (closeLightboxBtn) closeLightboxBtn.addEventListener("click", closeLightbox);
  if (lightbox) {
    lightbox.querySelectorAll("[data-close-lightbox]").forEach((el) => {
      el.addEventListener("click", closeLightbox);
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeLightbox();
    }
  });
})();
