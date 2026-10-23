// Altech Electrical: minimal enhancements (no libraries)
(function () {
  "use strict";

  // Sticky header: shadow once scrolled
  var header = document.querySelector(".site-header");
  function onScroll() {
    header.classList.toggle("scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Mobile navigation
  var nav = document.getElementById("main-nav");
  var toggle = document.querySelector(".nav-toggle");
  function setNav(open) {
    nav.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  toggle.addEventListener("click", function () {
    setNav(!nav.classList.contains("open"));
  });
  nav.addEventListener("click", function (e) {
    if (e.target.closest("a")) setNav(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && nav.classList.contains("open")) {
      setNav(false);
      toggle.focus();
    }
  });

  // Quote buttons: scroll to the on-page form and focus the first field
  var firstField = document.getElementById("f-name");
  document.querySelectorAll("[data-quote]").forEach(function (link) {
    link.addEventListener("click", function (e) {
      if (!firstField) return;
      e.preventDefault();
      setNav(false);
      document.getElementById("quote-form").scrollIntoView({ block: "start" });
      firstField.focus({ preventScroll: true });
      history.replaceState(null, "", "#quote");
    });
  });

  // Carousels: arrows step one card; tracks also scroll/snap without JS
  function stepTrack(track, dir) {
    var card = track.firstElementChild;
    var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    var step = card ? card.getBoundingClientRect().width + gap : track.clientWidth;
    var atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
    if (dir > 0) track.scrollBy({ left: atEnd ? -track.scrollWidth : step });
    else track.scrollBy({ left: track.scrollLeft <= 2 ? track.scrollWidth : -step });
  }
  document.querySelectorAll(".car-btn").forEach(function (btn) {
    var track = document.getElementById(btn.getAttribute("aria-controls"));
    if (!track) return;
    btn.addEventListener("click", function () {
      stepTrack(track, btn.classList.contains("car-next") ? 1 : -1);
    });
  });

  // Auto-advance every 4s; pauses on hover, focus, touch, when off screen or the tab is hidden.
  // Off for visitors who prefer reduced motion. The pause button satisfies WCAG 2.2.2.
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll(".carousel").forEach(function (car) {
    var track = car.querySelector("[id$='-track']");
    if (!track || reduceMotion) return;
    var hovering = false, focused = false, touched = false, visible = false, stopped = false;
    var toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "car-pause";
    toggle.setAttribute("aria-controls", track.id);
    function label() {
      toggle.setAttribute("aria-label", stopped ? "Play automatic scrolling" : "Pause automatic scrolling");
      toggle.innerHTML = stopped ? '<span aria-hidden="true">&#x25B6;</span>' : '<span aria-hidden="true">&#x275A;&#x275A;</span>';
    }
    label();
    toggle.addEventListener("click", function () { stopped = !stopped; label(); });
    car.appendChild(toggle);
    car.addEventListener("mouseenter", function () { hovering = true; });
    car.addEventListener("mouseleave", function () { hovering = false; });
    car.addEventListener("focusin", function () { focused = true; });
    car.addEventListener("focusout", function () { focused = false; });
    track.addEventListener("touchstart", function () { touched = true; }, { passive: true });
    track.addEventListener("touchend", function () { setTimeout(function () { touched = false; }, 4000); }, { passive: true });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }, { threshold: 0.4 }).observe(track);
    } else { visible = true; }
    setInterval(function () {
      var fits = track.scrollWidth <= track.clientWidth + 2;
      if (stopped || hovering || focused || touched || !visible || fits || document.hidden) return;
      stepTrack(track, 1);
    }, 4000);
  });

  // Hide carousel arrows when every card already fits
  function syncArrows() {
    document.querySelectorAll(".carousel").forEach(function (car) {
      var track = car.querySelector("[id$='-track']");
      if (!track) return;
      var fits = track.scrollWidth <= track.clientWidth + 2;
      car.querySelectorAll(".car-btn, .car-pause").forEach(function (b) { b.hidden = fits; });
    });
  }
  syncArrows();
  window.addEventListener("resize", syncArrows);
  window.addEventListener("load", syncArrows);

  // "We're Open Now" live clock (Sydney time)
  var clocks = document.querySelectorAll("[data-live-time]");
  if (clocks.length) {
    var fmt = new Intl.DateTimeFormat("en-AU", {
      timeZone: "Australia/Sydney", hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true
    });
    var tick = function () {
      var now = fmt.format(new Date()).toUpperCase();
      clocks.forEach(function (c) { c.textContent = now; });
    };
    tick();
    setInterval(tick, 1000);
  }

  // Offers heading: current month name (Sydney time)
  var month = document.querySelector("[data-month]");
  if (month) {
    month.textContent = new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Sydney", month: "long" }).format(new Date());
  }

  // Footer year
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // Quote form: validation and AJAX submit (falls back to a normal POST)
  var form = document.getElementById("quote-form");
  if (!form) return;
  var status = document.getElementById("form-status");
  var button = form.querySelector('button[type="submit"]');
  var PHONE_RE = /^[0-9 +\(\)\-]{8,}$/;
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function setError(field, message) {
    var err = document.getElementById("e-" + field.id.replace("f-", ""));
    if (err) err.textContent = message;
    if (message) field.setAttribute("aria-invalid", "true");
    else field.removeAttribute("aria-invalid");
    return !message;
  }

  function check(field) {
    var v = field.value.trim();
    if (field.id === "f-name") return setError(field, v ? "" : "Please enter your name.");
    if (field.id === "f-phone") return setError(field, PHONE_RE.test(v) ? "" : "Please enter a valid phone number.");
    if (field.id === "f-suburb") return setError(field, v ? "" : "Please enter your suburb.");
    if (field.id === "f-type") return setError(field, v ? "" : "Please choose a property type.");
    if (field.id === "f-service") return setError(field, v ? "" : "Please choose the service needed.");
    if (field.id === "f-email") return setError(field, !v || EMAIL_RE.test(v) ? "" : "Please enter a valid email address.");
    return true;
  }

  var fields = form.querySelectorAll("input[id], select[id]");
  var pressing = false;
  button.addEventListener("pointerdown", function () { pressing = true; });
  document.addEventListener("pointerup", function () { pressing = false; });
  fields.forEach(function (f) {
    f.addEventListener("blur", function () {
      if (!pressing && f.getAttribute("aria-invalid") === "true") check(f);
    });
    f.addEventListener("input", function () {
      if (f.getAttribute("aria-invalid") === "true") check(f);
    });
  });

  function show(kind, message) {
    status.className = "form-status " + kind;
    status.textContent = message;
    status.focus();
  }

  function addHidden(name, value) {
    var i = document.createElement("input");
    i.type = "hidden";
    i.name = name;
    i.value = value;
    form.appendChild(i);
    return i;
  }

  function stamp() {
    var parts = {};
    new Intl.DateTimeFormat("en-AU", {
      timeZone: "Australia/Sydney", day: "numeric", month: "short",
      hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true
    }).formatToParts(new Date()).forEach(function (p) { parts[p.type] = p.value; });
    return parts.day + " " + parts.month + " " + parts.hour + ":" + parts.minute + ":" + parts.second + String(parts.dayPeriod || "").toLowerCase();
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var firstBad = null;
    fields.forEach(function (f) {
      if (!check(f) && !firstBad) firstBad = f;
    });
    if (firstBad) {
      show("err", "Please fix the highlighted fields and try again.");
      firstBad.focus();
      return;
    }

    // Unique subject per enquiry, plus source details (added last so they end the email)
    var when = stamp();
    form.elements._subject.value = "New quote request from the Altech Electrical website - " +
      form.elements.service.value + " - " + form.elements.suburb.value.trim() + " - " + when;
    addHidden("Source page URL", location.href);
    addHidden("Time submitted", when);

    button.disabled = true;
    var label = button.textContent;
    button.textContent = "SENDING...";
    status.className = "form-status";
    status.textContent = "";

    fetch("https://formsubmit.co/ajax/altechelectrical@live.com.au", {
      method: "POST",
      headers: { Accept: "application/json" },
      body: new FormData(form)
    }).then(function (r) {
      return r.json().then(function (j) { return r.ok && String(j.success) !== "false"; });
    }).then(function (ok) {
      if (!ok) throw new Error("send failed");
      form.reset();
      show("ok", "Thank you. Your quote request has been sent.");
    }).catch(function () {
      show("err", "Sorry, that didn't send. Please try again or call 0413 064 474.");
    }).then(function () {
      button.disabled = false;
      button.textContent = label;
    });
  });
})();
