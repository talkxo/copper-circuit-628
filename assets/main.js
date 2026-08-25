/*
  TalkXO Case Studies — shared behaviour
  Nav scroll state, scroll-reveal, animated stat counters,
  scroll progress bar. Include once per page, after the DOM.
  Opt in per-element with classes: .rv (reveal), [data-count] (counter).
*/
(function(){
  "use strict";

  /* ---------- nav scroll shadow + progress bar ---------- */
  var nav = document.querySelector(".site-nav");
  var progress = document.getElementById("progress");
  function onScroll(){
    if (nav) nav.classList.toggle("scrolled", window.scrollY > 30);
    if (progress){
      var h = document.documentElement;
      var max = h.scrollHeight - window.innerHeight;
      progress.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + "%";
    }
  }
  addEventListener("scroll", onScroll, {passive:true});
  onScroll();

  /* ---------- active section highlight for doc-nav TOC + floating side-nav ---------- */
  function wireSectionTracker(linkSelector){
    var links = document.querySelectorAll(linkSelector);
    if (!links.length) return;
    var sections = [].map.call(links, function(a){
      return document.getElementById(a.getAttribute("href").slice(1));
    }).filter(Boolean);
    if (!sections.length) return;
    var obs = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (!entry.isIntersecting) return;
        links.forEach(function(a){ a.classList.remove("on"); });
        var match = document.querySelector(linkSelector + "[href='#" + entry.target.id + "']");
        if (match) match.classList.add("on");
      });
    }, {rootMargin:"-40% 0px -50% 0px"});
    sections.forEach(function(s){ obs.observe(s); });
    return sections;
  }
  wireSectionTracker(".doc-toc a[href^='#']");
  var sideNavSections = wireSectionTracker(".side-nav .sn-list a[href^='#']");

  /* ---------- floating side-nav: prev/next jump buttons ---------- */
  var sideNav = document.querySelector(".side-nav");
  if (sideNav && sideNavSections && sideNavSections.length){
    var jumpPrev = sideNav.querySelector("[data-jump='prev']");
    var jumpNext = sideNav.querySelector("[data-jump='next']");
    function currentIndex(){
      var i = 0;
      sideNavSections.forEach(function(s, idx){
        if (s.getBoundingClientRect().top - 120 <= 0) i = idx;
      });
      return i;
    }
    function jumpTo(idx){
      idx = Math.max(0, Math.min(sideNavSections.length - 1, idx));
      sideNavSections[idx].scrollIntoView({behavior:"smooth", block:"start"});
    }
    if (jumpPrev) jumpPrev.addEventListener("click", function(){ jumpTo(currentIndex() - 1); });
    if (jumpNext) jumpNext.addEventListener("click", function(){ jumpTo(currentIndex() + 1); });
  }

  /* ---------- case menu dropdown (nav) ---------- */
  document.querySelectorAll(".case-menu").forEach(function(menu){
    var btn = menu.querySelector(".case-menu-btn");
    if (!btn) return;
    btn.addEventListener("click", function(e){
      e.stopPropagation();
      menu.classList.toggle("open");
    });
    document.addEventListener("click", function(){ menu.classList.remove("open"); });
    menu.querySelector(".case-menu-panel").addEventListener("click", function(e){ e.stopPropagation(); });
  });

  /* ---------- scroll reveal ---------- */
  var revealEls = document.querySelectorAll(".rv");
  if (revealEls.length){
    var revealObserver = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting){
          entry.target.classList.add("in");
          revealObserver.unobserve(entry.target);
        }
      });
    }, {threshold:.15});
    revealEls.forEach(function(el){ revealObserver.observe(el); });
  }

  /* ---------- animated stat counters ----------
     <span data-count="51" data-suffix="%" data-from="34">34</span>
     Counts from data-from (default 0) to data-count when it scrolls into view. */
  var counters = document.querySelectorAll("[data-count]");
  if (counters.length){
    var counterObserver = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (!entry.isIntersecting) return;
        counterObserver.unobserve(entry.target);
        var el = entry.target;
        var to = parseFloat(el.dataset.count);
        var from = parseFloat(el.dataset.from || 0);
        var suffix = el.dataset.suffix || "";
        var prefix = el.dataset.prefix || "";
        var decimals = (el.dataset.count.split(".")[1] || "").length;
        var dur = 1100, t0 = null;
        function tick(t){
          if (t0 === null) t0 = t;
          var k = Math.min((t - t0) / dur, 1);
          var eased = 1 - Math.pow(1 - k, 3);
          var val = from + (to - from) * eased;
          el.textContent = prefix + val.toFixed(decimals) + suffix;
          if (k < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    }, {threshold:.5});
    counters.forEach(function(el){ counterObserver.observe(el); });
  }

  /* ---------- journey diagram: light up steps in sequence on view ---------- */
  document.querySelectorAll(".journey").forEach(function(journey){
    var rows = journey.querySelectorAll(".journey-row");
    if (!rows.length) return;
    var jo = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (!entry.isIntersecting) return;
        jo.unobserve(entry.target);
        var steps = entry.target.querySelectorAll(".journey-step");
        steps.forEach(function(step, i){
          setTimeout(function(){ step.classList.add("blue"); }, i * 140);
        });
      });
    }, {threshold:.4});
    rows.forEach(function(row){ jo.observe(row); });
  });

  /* ---------- WhatsApp / chat mockup: type-in effect ---------- */
  document.querySelectorAll(".mockup-chat[data-animate]").forEach(function(box){
    var bubbles = box.querySelectorAll(".chat-msg");
    bubbles.forEach(function(b){ b.style.opacity = 0; b.style.transform = "translateY(8px)"; b.style.transition = "opacity .5s var(--ease,ease), transform .5s var(--ease,ease)"; });
    var co = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (!entry.isIntersecting) return;
        co.unobserve(entry.target);
        bubbles.forEach(function(b, i){
          setTimeout(function(){ b.style.opacity = 1; b.style.transform = "none"; }, i * 420);
        });
      });
    }, {threshold:.4});
    co.observe(box);
  });

  /* ---------- "load more" index rows (index.html only; no-op if the button isn't present) ---------- */
  var loadMoreBtn = document.querySelector("[data-load-more]");
  if (loadMoreBtn){
    loadMoreBtn.addEventListener("click", function(){
      var hidden = document.querySelectorAll(".index-row.more");
      hidden.forEach(function(row){
        row.classList.remove("more");
        row.classList.add("rv");
      });
      void document.body.offsetHeight; // force reflow so the .rv -> .in transition is visible
      requestAnimationFrame(function(){
        hidden.forEach(function(row){ row.classList.add("in"); });
      });
      var wrap = loadMoreBtn.closest(".load-more-wrap");
      if (wrap) wrap.remove();
    });
  }

  /* ---------- confetti burst: fires once when a .result-highlight scrolls into view ---------- */
  var CONFETTI_EMOJI = ["🎉","🎊","✨","🥳","🙌","⭐️"];
  function burstConfetti(el){
    var layer = document.createElement("div");
    layer.className = "confetti-layer";
    var count = 16;
    for (var i = 0; i < count; i++){
      var span = document.createElement("span");
      span.className = "confetti-emoji";
      span.textContent = CONFETTI_EMOJI[Math.floor(Math.random() * CONFETTI_EMOJI.length)];
      var fromLeft = i % 2 === 0;
      var cx = fromLeft ? (Math.random() * 8) + "%" : (92 - Math.random() * 8) + "%";
      var dir = fromLeft ? 1 : -1;
      var tx = dir * (60 + Math.random() * 90) + "px";
      var ty = (Math.random() * 90 - 70) + "px";
      var rot = (dir * (30 + Math.random() * 90)) + "deg";
      var size = (16 + Math.random() * 14) + "px";
      var dur = (800 + Math.random() * 500) + "ms";
      var delay = (Math.random() * 260) + "ms";
      span.style.setProperty("--cx", cx);
      span.style.setProperty("--tx", tx);
      span.style.setProperty("--ty", ty);
      span.style.setProperty("--rot", rot);
      span.style.setProperty("--csize", size);
      span.style.setProperty("--cdur", dur);
      span.style.setProperty("--cdelay", delay);
      layer.appendChild(span);
    }
    el.appendChild(layer);
    setTimeout(function(){ layer.remove(); }, 1900);
  }
  var resultHighlights = document.querySelectorAll(".result-highlight");
  if (resultHighlights.length){
    var confettiObserver = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (!entry.isIntersecting) return;
        confettiObserver.unobserve(entry.target);
        burstConfetti(entry.target);
      });
    }, {threshold:.5});
    resultHighlights.forEach(function(el){ confettiObserver.observe(el); });
  }
})();
