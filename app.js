/* Nuvé Café - Menu Website */

let MENU_DATA = { categories: [], menu: [], videos: [], gallery: [] };

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initHeaderScroll();
  loadData();
  initStats();
  initOrderForm();
});

function initNav() {
  const toggle = document.getElementById('nav-toggle');
  const menu = document.getElementById('nav-menu');
  const links = document.querySelectorAll('.nav-link');

  toggle?.addEventListener('click', () => {
    toggle.classList.toggle('active');
    menu.classList.toggle('open');
  });

  links.forEach(link => {
    link.addEventListener('click', () => {
      toggle.classList.remove('active');
      menu.classList.remove('open');
      links.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  });
}

function initHeaderScroll() {
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  });
}

async function loadData() {
  try {
    const res = await fetch('data.json');
    MENU_DATA = await res.json();
  } catch (err) {
    console.error('Failed to load data.json', err);
    MENU_DATA = fallbackData();
  }
  renderFilters();
  renderMenu('all');
  renderVideos(MENU_DATA.videos);
  renderGallery(MENU_DATA.gallery);
}

function renderFilters() {
  const wrap = document.getElementById('menu-filters');
  if (!wrap) return;
  const cats = MENU_DATA.categories || [];
  wrap.innerHTML = [
    `<button type="button" class="filter-btn active" data-cat="all">Semua</button>`,
    ...cats.map(c => `<button type="button" class="filter-btn" data-cat="${c.id}">${c.icon} ${c.name}</button>`)
  ].join('');

  wrap.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      wrap.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderMenu(btn.dataset.cat);
    });
  });
}

function renderMenu(category) {
  const grid = document.getElementById('menu-grid');
  if (!grid) return;
  const items = (MENU_DATA.menu || []).filter(i => category === 'all' || i.category === category);
  grid.innerHTML = items.map(t => `
    <article class="learn-card">
      <div class="learn-card-icon">${iconFor(t.category)}</div>
      <h3>${escapeHtml(t.name)}</h3>
      <p>${escapeHtml(t.desc)}</p>
      <div class="menu-card-foot">
        <span class="tag">${escapeHtml(t.tag)}</span>
        <span class="menu-price">Rp ${escapeHtml(t.price)}</span>
      </div>
    </article>
  `).join('');
}

function iconFor(cat) {
  const map = { kopi: '☕', nonkopi: '🍵', signature: '✨', pastry: '🥐', makanan: '🥗' };
  return map[cat] || '☕';
}

function renderVideos(videos) {
  const carousel = document.getElementById('video-carousel');
  const dots = document.getElementById('carousel-dots');
  if (!carousel) return;
  videos = videos || [];

  carousel.innerHTML = videos.map((v, i) => `
    <article class="video-card" data-id="${v.id}" data-index="${i}">
      <div class="video-thumb">
        <img src="${v.thumb}" alt="${escapeHtml(v.title)}" loading="lazy">
        <div class="video-play"><span>▶</span></div>
      </div>
      <div class="video-info">
        <h3>${escapeHtml(v.title)}</h3>
        <p>${escapeHtml(v.channel)}</p>
      </div>
    </article>
  `).join('');

  dots.innerHTML = videos.map((_, i) =>
    `<button type="button" data-index="${i}" aria-label="Video ${i + 1}"></button>`
  ).join('');

  const prev = document.getElementById('carousel-prev');
  const next = document.getElementById('carousel-next');
  const cardWidth = () => (carousel.querySelector('.video-card')?.offsetWidth || 340) + 20;

  prev?.addEventListener('click', () => carousel.scrollBy({ left: -cardWidth(), behavior: 'smooth' }));
  next?.addEventListener('click', () => carousel.scrollBy({ left: cardWidth(), behavior: 'smooth' }));

  const updateDots = () => {
    const w = cardWidth();
    const index = Math.round(carousel.scrollLeft / w);
    dots.querySelectorAll('button').forEach((btn, i) => btn.classList.toggle('active', i === index));
  };
  carousel.addEventListener('scroll', updateDots);
  updateDots();

  dots.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      carousel.scrollTo({ left: parseInt(btn.dataset.index, 10) * cardWidth(), behavior: 'smooth' });
    });
  });

  carousel.querySelectorAll('.video-card').forEach(card => {
    card.addEventListener('click', () => openVideoModal(card.dataset.id));
  });
}

function renderGallery(items) {
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;
  grid.innerHTML = (items || []).map(item => `
    <div class="gallery-item">
      <img src="${item.src}" alt="${escapeHtml(item.alt)}" loading="lazy">
    </div>
  `).join('');
}

function openVideoModal(videoId) {
  const modal = document.getElementById('video-modal');
  const container = document.getElementById('modal-video');
  container.innerHTML = `
    <iframe
      src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0"
      title="YouTube video"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen>
    </iframe>`;
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeVideoModal() {
  const modal = document.getElementById('video-modal');
  document.getElementById('modal-video').innerHTML = '';
  modal.hidden = true;
  document.body.style.overflow = '';
}

document.getElementById('modal-close')?.addEventListener('click', closeVideoModal);
document.getElementById('modal-backdrop')?.addEventListener('click', closeVideoModal);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeVideoModal(); });

function initStats() {
  const nums = document.querySelectorAll('.stat-num');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  nums.forEach(el => observer.observe(el));
}

function animateCount(el) {
  const target = parseInt(el.dataset.target, 10);
  const start = performance.now();
  const duration = 1200;
  function update(now) {
    const progress = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(ease * target);
    if (progress < 1) requestAnimationFrame(update);
    else el.textContent = target;
  }
  requestAnimationFrame(update);
}

function initOrderForm() {
  const form = document.getElementById('order-form');
  form?.addEventListener('submit', e => {
    e.preventDefault();
    form.hidden = true;
    document.getElementById('order-success').hidden = false;
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = String(str ?? '');
  return div.innerHTML;
}

function fallbackData() {
  return {
    categories: [
      { id: 'kopi', name: 'Kopi', icon: '☕' },
      { id: 'signature', name: 'Signature', icon: '✨' }
    ],
    menu: [
      { category: 'kopi', name: 'Latte', desc: 'Espresso dan susu steamed.', price: '32.000', tag: 'Hot / Ice' },
      { category: 'signature', name: 'Nuvé Cloud', desc: 'Signature house drink.', price: '42.000', tag: 'Best Seller' }
    ],
    videos: [
      { id: 'wfAiFpdw1co', title: 'Suasana Cafe', channel: 'Featured', thumb: 'https://img.youtube.com/vi/wfAiFpdw1co/hqdefault.jpg' }
    ],
    gallery: []
  };
}
