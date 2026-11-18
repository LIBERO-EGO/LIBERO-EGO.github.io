(function () {
  "use strict";

  const SUITES = [
    { id: "libero_spatial", name: "LIBERO-Spatial", icon: "fa-table-cells", preview: 4,
      text: "Two identical black bowls; the instruction names the one to move by where it is." },
    { id: "libero_object", name: "LIBERO-Object", icon: "fa-basket-shopping", preview: 5,
      text: "One layout with many groceries; pick up the named one and place it in the basket." },
    { id: "libero_goal", name: "LIBERO-Goal", icon: "fa-bullseye", preview: 3,
      text: "One scene and one set of objects, ten different goals." },
    { id: "libero_10", name: "LIBERO-Long", icon: "fa-route", preview: 9,
      text: "Long-horizon tasks, most of them in two steps, across kitchen, living-room and study scenes." },
  ];

  const TASKS = {
    libero_spatial: [
      "pick up the black bowl between the plate and the ramekin and place it on the plate",
      "pick up the black bowl next to the ramekin and place it on the plate",
      "pick up the black bowl from table center and place it on the plate",
      "pick up the black bowl on the cookie box and place it on the plate",
      "pick up the black bowl in the top drawer of the wooden cabinet and place it on the plate",
      "pick up the black bowl on the ramekin and place it on the plate",
      "pick up the black bowl next to the cookie box and place it on the plate",
      "pick up the black bowl on the stove and place it on the plate",
      "pick up the black bowl next to the plate and place it on the plate",
      "pick up the black bowl on the wooden cabinet and place it on the plate",
    ],
    libero_object: [
      "pick up the alphabet soup and place it in the basket",
      "pick up the cream cheese and place it in the basket",
      "pick up the salad dressing and place it in the basket",
      "pick up the bbq sauce and place it in the basket",
      "pick up the ketchup and place it in the basket",
      "pick up the tomato sauce and place it in the basket",
      "pick up the butter and place it in the basket",
      "pick up the milk and place it in the basket",
      "pick up the chocolate pudding and place it in the basket",
      "pick up the orange juice and place it in the basket",
    ],
    libero_goal: [
      "open the middle drawer of the cabinet",
      "put the bowl on the stove",
      "put the wine bottle on top of the cabinet",
      "open the top drawer and put the bowl inside",
      "put the bowl on top of the cabinet",
      "push the plate to the front of the stove",
      "put the cream cheese in the bowl",
      "turn on the stove",
      "put the bowl on the plate",
      "put the wine bottle on the rack",
    ],
    libero_10: [
      "put both the alphabet soup and the tomato sauce in the basket",
      "put both the cream cheese box and the butter in the basket",
      "turn on the stove and put the moka pot on it",
      "put the black bowl in the bottom drawer of the cabinet and close it",
      "put the white mug on the left plate and put the yellow and white mug on the right plate",
      "pick up the book and place it in the back compartment of the caddy",
      "put the white mug on the plate and put the chocolate pudding to the right of the plate",
      "put both the alphabet soup and the cream cheese box in the basket",
      "put both moka pots on the stove",
      "put the yellow and white mug in the microwave and close it",
    ],
  };

  const pad = (n) => String(n).padStart(2, "0");
  const media = (suite, task, kind, ext) => `static/videos/${suite}_task${pad(task)}_${kind}.${ext}`;
  const suiteName = (id) => SUITES.find((s) => s.id === id).name;
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- lazy, visibility-driven playback ---------- */
  const paused = { hero: reduceMotion, gallery: reduceMotion };
  const visible = new Set();
  const groupOf = (v) => v.dataset.group || "gallery";

  function load(v) {
    if (v.dataset.src && v.getAttribute("src") !== v.dataset.src) v.setAttribute("src", v.dataset.src);
  }
  function sync(v) {
    if (visible.has(v) && !paused[groupOf(v)]) {
      load(v);
      const p = v.play();
      if (p && p.catch) p.catch(() => {});
    } else if (!v.paused) {
      v.pause();
    }
  }
  const io = "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target); else visible.delete(e.target);
          sync(e.target);
        }
      }, { threshold: 0.2 })
    : null;
  function watch(v) {
    if (io) io.observe(v); else { visible.add(v); sync(v); }
  }
  function setSource(v, suite, task, kind) {
    v.classList.toggle("is-human", kind === "human");
    v.poster = media(suite, task, kind, "jpg");
    v.dataset.src = media(suite, task, kind, "mp4");
    if (v.getAttribute("src")) { v.setAttribute("src", v.dataset.src); }
    sync(v);
  }
  function lazyVideo(suite, task, kind, group) {
    const v = document.createElement("video");
    v.muted = true; v.loop = true; v.playsInline = true; v.preload = "none";
    v.setAttribute("muted", ""); v.setAttribute("playsinline", "");
    v.dataset.group = group || "gallery";
    v.dataset.suite = suite; v.dataset.task = task;
    v.classList.toggle("is-human", kind === "human");
    v.poster = media(suite, task, kind, "jpg");
    v.dataset.src = media(suite, task, kind, "mp4");
    watch(v);
    return v;
  }

  function bindToggle(button, group, label) {
    if (!button) return;
    const render = () => {
      button.innerHTML = paused[group] ? '<i class="fa-solid fa-play"></i>' : '<i class="fa-solid fa-pause"></i>';
      button.setAttribute("aria-label", (paused[group] ? "Play " : "Pause ") + label);
    };
    button.addEventListener("click", () => {
      paused[group] = !paused[group];
      render();
      if (group === "hero") {
        const hv = document.getElementById("hero-video");
        if (paused.hero) hv.pause(); else hv.play().catch(() => {});
      } else {
        document.querySelectorAll("video[data-group='" + group + "']").forEach(sync);
      }
    });
    render();
  }

  /* ---------- hero ---------- */
  const hero = document.getElementById("hero-video");
  if (hero && reduceMotion) { hero.removeAttribute("autoplay"); hero.pause(); }
  bindToggle(document.getElementById("hero-toggle"), "hero", "background video");

  /* ---------- gallery ---------- */
  let mode = "human";
  let activeSuite = SUITES[0].id;
  const grid = document.getElementById("suite-grid");
  const track = document.getElementById("car-track");
  const detailTitle = document.getElementById("detail-title");

  SUITES.forEach((s) => {
    const card = document.createElement("article");
    card.className = "suite-card";
    card.dataset.suite = s.id;
    card.appendChild(lazyVideo(s.id, s.preview, mode));
    const body = document.createElement("div");
    body.className = "body";
    body.innerHTML = `<h3><i class="fa-solid ${s.icon}"></i>${s.name}</h3><p>${s.text}</p>` +
      `<button class="action" type="button">View all 10 tasks</button>`;
    card.appendChild(body);
    body.querySelector(".action").addEventListener("click", () => showSuite(s.id, true));
    grid.appendChild(card);
  });

  function showSuite(id, scroll) {
    activeSuite = id;
    grid.querySelectorAll(".suite-card").forEach((c) => c.classList.toggle("is-active", c.dataset.suite === id));
    detailTitle.textContent = suiteName(id) + ": all 10 tasks";
    track.querySelectorAll("video").forEach((v) => { if (io) io.unobserve(v); visible.delete(v); });
    track.innerHTML = "";
    TASKS[id].forEach((lang, t) => {
      const fig = document.createElement("figure");
      fig.className = "car-item";
      fig.appendChild(lazyVideo(id, t, mode));
      const cap = document.createElement("figcaption");
      cap.innerHTML = `<b>Task ${t}</b>${lang}`;
      fig.appendChild(cap);
      track.appendChild(fig);
    });
    track.scrollLeft = 0;
    updateCarousel();
    if (scroll) document.getElementById("suite-detail").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
  }

  const prev = document.querySelector(".car-btn.prev");
  const next = document.querySelector(".car-btn.next");
  function step() {
    const item = track.querySelector(".car-item");
    return item ? item.getBoundingClientRect().width + 14 : track.clientWidth;
  }
  function updateCarousel() {
    prev.disabled = track.scrollLeft <= 4;
    next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
  }
  prev.addEventListener("click", () => track.scrollBy({ left: -step() }));
  next.addEventListener("click", () => track.scrollBy({ left: step() }));
  track.addEventListener("scroll", updateCarousel, { passive: true });
  window.addEventListener("resize", updateCarousel);

  document.querySelectorAll(".segmented button").forEach((b) => {
    b.addEventListener("click", () => {
      mode = b.dataset.mode;
      document.querySelectorAll(".segmented button").forEach((x) => x.classList.toggle("is-active", x === b));
      document.querySelectorAll("#gallery video").forEach((v) => setSource(v, v.dataset.suite, +v.dataset.task, mode));
    });
  });
  bindToggle(document.getElementById("gallery-toggle"), "gallery", "gallery videos");
  showSuite(activeSuite, false);

  /* ---------- certification feature ---------- */
  const fHuman = document.getElementById("feature-human");
  const fRobot = document.getElementById("feature-robot");
  const fSuite = document.getElementById("feature-suite");
  const fTask = document.getElementById("feature-task");
  const strip = document.getElementById("strip-track");
  [fHuman, fRobot].forEach((v) => { v.dataset.group = "gallery"; watch(v); });

  function feature(suite, task, thumb) {
    fSuite.textContent = suiteName(suite) + ", task " + task;
    fTask.textContent = TASKS[suite][task];
    setSource(fHuman, suite, task, "human");
    setSource(fRobot, suite, task, "robot");
    fHuman.currentTime = 0; fRobot.currentTime = 0;
    strip.querySelectorAll(".thumb").forEach((x) => x.classList.toggle("is-active", x === thumb));
  }
  let first = null;
  SUITES.forEach((s) => {
    TASKS[s.id].forEach((lang, t) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "thumb";
      b.title = lang;
      b.innerHTML = `<img src="${media(s.id, t, "robot", "jpg")}" alt="" loading="lazy"><span>${s.name.replace("LIBERO-", "")} ${t}</span>`;
      b.addEventListener("click", () => feature(s.id, t, b));
      strip.appendChild(b);
      if (s.id === "libero_10" && t === 9) first = b;
    });
  });
  feature("libero_10", 9, first);

  const sPrev = document.querySelector(".strip-btn.prev");
  const sNext = document.querySelector(".strip-btn.next");
  function updateStrip() {
    sPrev.disabled = strip.scrollLeft <= 4;
    sNext.disabled = strip.scrollLeft + strip.clientWidth >= strip.scrollWidth - 4;
  }
  sPrev.addEventListener("click", () => strip.scrollBy({ left: -strip.clientWidth * 0.8 }));
  sNext.addEventListener("click", () => strip.scrollBy({ left: strip.clientWidth * 0.8 }));
  strip.addEventListener("scroll", updateStrip, { passive: true });
  window.addEventListener("resize", updateStrip);
  if (first) strip.scrollLeft = first.offsetLeft - strip.clientWidth / 2 + first.clientWidth / 2;
  updateStrip();

  /* ---------- navigation ---------- */
  const nav = document.getElementById("topnav");
  const links = Array.from(document.querySelectorAll(".section-nav a"));
  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > window.innerHeight * 0.5);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  if ("IntersectionObserver" in window) {
    const spy = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        links.forEach((a) => a.classList.toggle("is-current", a.getAttribute("href") === "#" + e.target.id));
      }
    }, { rootMargin: "-45% 0px -50% 0px" });
    links.forEach((a) => { const s = document.querySelector(a.getAttribute("href")); if (s) spy.observe(s); });
  }
})();
