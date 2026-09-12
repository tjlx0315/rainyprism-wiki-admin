const panels = [...document.querySelectorAll('.panel')];
const navLinks = [...document.querySelectorAll('nav a')];
const counter = document.querySelector('.section-count span');
const spectrum = document.querySelector('.spectrum');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const lightPanels = new Set(['encyclopedia', 'multimedia']);

async function loadHomeFeaturedWorks() {
  const cards = [...document.querySelectorAll('.art-card')];
  if (!cards.length) return;
  try {
    let dataPath = 'exhibition/exhibition-data.json';
    let response = await fetch(`${dataPath}?v=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) {
      dataPath = 'exhibition-data.json';
      response = await fetch(`${dataPath}?v=${Date.now()}`, { cache: 'no-store' });
    }
    if (!response.ok) return;
    const data = await response.json();
    const works = (data.series || []).flatMap((series) => series.works || []).filter((work) => work.image);
    const byId = new Map(works.map((work) => [work.id, work]));
    const requested = Array.isArray(data.site?.homeFeaturedWorkIds) ? data.site.homeFeaturedWorkIds : [];
    const featured = [...new Set([...requested, ...works.map((work) => work.id)])].map((id) => byId.get(id)).filter(Boolean).slice(0, 6);
    cards.forEach((card, index) => {
      const work = featured[index];
      if (!work) return;
      const imagePrefix = dataPath.startsWith('exhibition/') ? 'exhibition/' : '';
      const cover = card.querySelector('.art-card__cover');
      if (!cover) return;
      cover.style.backgroundImage = `url("${imagePrefix}${String(work.image).replaceAll('"', '%22')}")`;
      card.classList.add('has-artwork');
      card.setAttribute('aria-label', work.title || `作品 ${index + 1}`);
      const role = work.roles?.[0];
      card.setAttribute('href', role ? `exhibition/?view=roles&role=${encodeURIComponent(role)}` : 'exhibition/');
    });
  } catch {}
}

loadHomeFeaturedWorks();

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const id = entry.target.id;
    const index = entry.target.dataset.index;
    counter.textContent = index;
    entry.target.classList.add('is-revealed');
    panels.forEach((panel) => panel.classList.toggle('is-current', panel === entry.target));
    document.body.classList.toggle('header-on-light', lightPanels.has(id));
    navLinks.forEach((link) => {
      link.classList.toggle('is-active', link.getAttribute('href') === `#${id}`);
    });
  });
}, { threshold: 0.58 });

panels.forEach((panel) => observer.observe(panel));
panels[0]?.classList.add('is-revealed', 'is-current');

if (!prefersReducedMotion && spectrum) {
  let pointerFrame = 0;
  window.addEventListener('pointermove', (event) => {
    if (pointerFrame) return;
    pointerFrame = requestAnimationFrame(() => {
      spectrum.style.setProperty('--mx', `${(event.clientX / innerWidth) * 100}%`);
      spectrum.style.setProperty('--my', `${(event.clientY / innerHeight) * 100}%`);
      pointerFrame = 0;
    });
  }, { passive: true });
}
