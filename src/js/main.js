(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  /* ---------- Webfonts erst nach dem Laden der Seite ---------- */
  const loadFonts = () => {
    [["Fredoka", "fredoka", "300 700"], ["Nunito", "nunito", "200 1000"]].forEach(([name, file, weight]) => {
      const face = new FontFace(name, `url(/fonts/${file}.woff2) format("woff2")`, { weight, display: "swap" });
      document.fonts.add(face);
      face.load().catch(() => {});
    });
  };
  if ("FontFace" in window) {
    if (document.readyState === "complete") loadFonts();
    else addEventListener("load", loadFonts, { once: true });
  }

  /* ---------- Mobile-Menü ---------- */
  const burger = $("[data-burger]");
  const mnav = $("[data-mnav]");
  const setMenu = (open) => {
    if (open) mnav.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => mnav.classList.toggle("ist-offen", open)));
    document.body.classList.toggle("menu-offen", open);
    burger.setAttribute("aria-expanded", open);
    burger.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
    if (!open) setTimeout(() => { if (!mnav.classList.contains("ist-offen")) mnav.hidden = true; }, 350);
  };
  burger.addEventListener("click", () => setMenu(burger.getAttribute("aria-expanded") !== "true"));
  $$("a", mnav).forEach((a) => a.addEventListener("click", () => setMenu(false)));
  addEventListener("keydown", (e) => { if (e.key === "Escape" && burger.getAttribute("aria-expanded") === "true") { setMenu(false); burger.focus(); } });

  /* ---------- Einhüpfen ---------- */
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (!en.isIntersecting) return;
    en.target.classList.add("ist-da");
    io.unobserve(en.target);
  }), { threshold: 0.12 });
  $$("[data-pop]").forEach((el) => io.observe(el));

  /* ---------- Konfetti ---------- */
  const farben = ["#D6483A", "#D95A24", "#EAAD18", "#376C88", "#7C8252"];
  const konfetti = (x, y) => {
    if (reduced) return;
    for (let i = 0; i < 44; i++) {
      const el = document.createElement("span");
      el.className = "konfetti";
      el.style.cssText = `left:${x}px;top:${y}px;background:${farben[i % 5]};border-radius:${i % 2 ? "50%" : "3px"}`;
      document.body.append(el);
      const a = Math.random() * Math.PI * 2, r = 70 + Math.random() * 230;
      el.animate([
        { transform: "translate(0,0) rotate(0)", opacity: 1 },
        { transform: `translate(${Math.cos(a) * r}px,${Math.sin(a) * r - 80}px) rotate(${Math.random() * 720}deg)`, opacity: 1, offset: .55 },
        { transform: `translate(${Math.cos(a) * r * 1.2}px,${Math.sin(a) * r + 240}px) rotate(${Math.random() * 1080}deg)`, opacity: 0 },
      ], { duration: 1300 + Math.random() * 700, easing: "cubic-bezier(.2,.7,.3,1)" }).onfinish = () => el.remove();
    }
  };
  $$("[data-konfetti]").forEach((b) => b.addEventListener("click", () => {
    const r = b.getBoundingClientRect();
    konfetti(r.left + r.width / 2, r.top + r.height / 2);
  }));

  /* ---------- Anmeldung: Mail mit fertigem Text öffnen ---------- */
  const form = $("[data-formular]");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const zeilen = [...new FormData(form)].filter(([k, v]) => v && k !== "Datenschutz").map(([k, v]) => `${k}: ${v}`);
    const betreff = encodeURIComponent("Anmeldung ReBest Fitness Kids Club");
    location.href = `mailto:${form.dataset.mail}?subject=${betreff}&body=${encodeURIComponent(zeilen.join("\n"))}`;
    const b = $("button", form).getBoundingClientRect();
    konfetti(b.left + b.width / 2, b.top);
    $("[data-hinweis]", form).textContent = "Danke! Euer E-Mail-Programm öffnet sich jetzt. Bitte die Nachricht dort noch absenden.";
  });

  /* ---------- Scroll-Effekte ---------- */
  const panels = $$("[data-panel]");
  const anker = $$(".anker[id]");
  const links = $$(".nav__links a");
  const quer = $("[data-quer]");
  const querSpur = $("[data-quer-spur]");
  const querPin = $("[data-quer-pin]");
  const wippe = $("[data-wippe]");
  const stapeln = () => !reduced && innerWidth > 860;
  // Zusätzlicher Scrollweg am Ende jeder Karte (Anteil der Bildschirmhöhe).
  // Die nächste Karte legt erst diese Strecke zurück, dann beginnt die Unschärfe.
  const AUSLAUF = .3;
  let querWeg = 0;

  const messen = () => {
    const vh = innerHeight;
    const auslauf = stapeln() ? vh * AUSLAUF : 0;
    document.documentElement.style.setProperty("--auslauf", `${auslauf}px`);
    document.documentElement.style.setProperty("--karte-min", stapeln() ? `${vh + auslauf}px` : "0px");
    querWeg = 0;
    if (stapeln()) {
      querWeg = Math.max(0, querSpur.scrollWidth - innerWidth);
      querPin.style.cssText = `position:sticky;top:0;height:${vh}px;display:flex;align-items:center`;
      quer.style.height = `${vh + querWeg + auslauf}px`;
    } else {
      querPin.style.cssText = "";
      quer.style.height = "";
      querSpur.style.transform = "";
    }
    panels.forEach((p, i) => {
      p.style.zIndex = i + 1;
      const stick = Math.min(0, vh - p.offsetHeight);
      p.style.setProperty("--stick", `${stick}px`);
      p.style.setProperty("--oben", `${-stick}px`);
    });
    update();
  };

  let ticking = false;
  const update = () => {
    ticking = false;
    const vh = innerHeight;

    if (querWeg) {
      const r = quer.getBoundingClientRect();
      querSpur.style.transform = `translate3d(${-clamp(-r.top / querWeg) * querWeg}px,0,0)`;
    }

    if (!reduced) {
      const stapel = stapeln();
      panels.forEach((p, i) => {
        const next = panels[i + 1];
        // Am Anker messen: die Karte selbst ist skaliert und liefert eine verfälschte Position.
        const f = stapel && next ? clamp(1 - next.previousElementSibling.getBoundingClientRect().top / vh) : 0;
        p.classList.toggle("ist-hinten", f > 0 && f < 1);
        p.classList.toggle("ist-weg", f >= 1);
        p.style.setProperty("--f", f.toFixed(3));
        p.style.setProperty("--u", clamp((f - AUSLAUF) / (1 - AUSLAUF)).toFixed(3));
        p.style.transform = f ? `scale(${(1 - f * .07).toFixed(4)})` : "";
      });
      const w = wippe.getBoundingClientRect();
      const fortschritt = clamp((vh - w.top) / (vh + w.height));
      wippe.style.setProperty("--kipp", `${(Math.sin(fortschritt * Math.PI * 2) * 5).toFixed(2)}deg`);
    }

    let aktiv = anker[0];
    anker.forEach((a) => { if (a.getBoundingClientRect().top <= vh * .45) aktiv = a; });
    links.forEach((l) => {
      if (l.hash === `#${aktiv.id}`) l.setAttribute("aria-current", "true");
      else l.removeAttribute("aria-current");
    });
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", messen);
  new ResizeObserver(messen).observe($("main"));
  messen();

  // Tastatur: Der Knopf am Ende der Spur muss beim Fokussieren sichtbar werden.
  querSpur.addEventListener("focusin", (e) => {
    if (querWeg && e.target !== querSpur) scrollTo(0, scrollY + quer.getBoundingClientRect().top + querWeg);
  });
})();
