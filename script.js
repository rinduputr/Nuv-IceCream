const menuBtn=document.getElementById("menuBtn"),nav=document.getElementById("nav");
menuBtn.addEventListener("click",()=>nav.classList.toggle("open"));
nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>nav.classList.remove("open")));

const filters=document.querySelectorAll(".filter");
const cards=document.querySelectorAll(".flavor-card");
filters.forEach(btn=>btn.addEventListener("click",()=>{
  filters.forEach(x=>x.classList.remove("active")); btn.classList.add("active");
  const filter=btn.dataset.filter;
  cards.forEach(card=>card.classList.toggle("hidden",filter!=="all"&&card.dataset.category!==filter));
}));

let cart=[];
const cartBtn=document.getElementById("cartBtn"),drawer=document.getElementById("cartDrawer"),backdrop=document.getElementById("backdrop");
const cartItems=document.getElementById("cartItems"),cartCount=document.getElementById("cartCount"),cartTotal=document.getElementById("cartTotal"),checkout=document.getElementById("checkout");
function openCart(){drawer.classList.add("open");backdrop.classList.add("open")}
function closeCart(){drawer.classList.remove("open");backdrop.classList.remove("open")}
cartBtn.addEventListener("click",openCart); backdrop.addEventListener("click",closeCart); document.getElementById("closeCart").addEventListener("click",closeCart);

document.querySelectorAll(".quick-add").forEach(btn=>btn.addEventListener("click",()=>{
  const name=btn.dataset.name; cart.push(name); renderCart(); openCart();
}));
function renderCart(){
  cartCount.textContent=cart.length;
  if(!cart.length){
    cartItems.innerHTML='<p class="empty">Belum ada scoop. Pilih rasa favoritmu 🍦</p>';
  }else{
    const counts={}; cart.forEach(x=>counts[x]=(counts[x]||0)+1);
    cartItems.innerHTML=Object.entries(counts).map(([name,count])=>`<div class="cart-item"><span>${name} × ${count}</span><b>Rp ${count*20}K</b></div>`).join("");
  }
  cartTotal.textContent=`Rp ${cart.length*20}K`;
  const detail=cart.length?cart.join(", "):"menu favorit";
  checkout.href=`https://wa.me/6281210719902?text=${encodeURIComponent("Halo kak rindu aku cek di website kamu keren, mau dong pesan menu "+detail)}`;
}
renderCart();

/* ================================
   AUTO SCROLL — Nuvé Ice Cream
   Aktif setelah 2 detik tanpa aktivitas user.
   Aktivitas user akan menghentikan auto-scroll
   dan timer akan dimulai ulang.
================================ */
(() => {
  const IDLE_DELAY = 2000;
  const SCROLL_STEP = 0.55;
  const TOP_RESET_DURATION = 450;
  const BOTTOM_THRESHOLD = 4;

  let idleTimer = null;
  let autoScrolling = false;
  let resettingToTop = false;
  let animationId = null;

  const stopAutoScroll = () => {
    autoScrolling = false;
    resettingToTop = false;
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  };

  const startAutoScroll = () => {
    if (autoScrolling || resettingToTop) return;
    autoScrolling = true;
    animationId = requestAnimationFrame(scrollDown);
  };

  const scrollDown = () => {
    if (!autoScrolling || resettingToTop) return;

    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const currentScroll = window.scrollY;

    if (maxScroll <= 0) {
      autoScrolling = false;
      return;
    }

    if (currentScroll >= maxScroll - BOTTOM_THRESHOLD) {
      autoScrolling = false;
      resetToTop();
      return;
    }

    window.scrollBy(0, SCROLL_STEP);
    animationId = requestAnimationFrame(scrollDown);
  };

  const resetToTop = () => {
    if (resettingToTop) return;
    resettingToTop = true;

    const start = window.scrollY;
    const startTime = performance.now();

    const animateTop = (now) => {
      const progress = Math.min((now - startTime) / TOP_RESET_DURATION, 1);
      // Ease-out: cepat di awal lalu melambat saat mendekati atas.
      const eased = 1 - Math.pow(1 - progress, 3);
      window.scrollTo(0, start * (1 - eased));

      if (progress < 1) {
        animationId = requestAnimationFrame(animateTop);
      } else {
        window.scrollTo(0, 0);
        resettingToTop = false;
        autoScrolling = false;
        scheduleAutoScroll();
      }
    };

    animationId = requestAnimationFrame(animateTop);
  };

  const scheduleAutoScroll = () => {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (!document.hidden) startAutoScroll();
    }, IDLE_DELAY);
  };

  const registerActivity = () => {
    stopAutoScroll();
    scheduleAutoScroll();
  };

  // Aktivitas yang dianggap sebagai interaksi user.
  [
    'wheel',
    'touchstart',
    'touchmove',
    'pointerdown',
    'keydown',
    'mousemove'
  ].forEach(eventName => {
    window.addEventListener(eventName, registerActivity, { passive: true });
  });

  // Klik juga dihitung sebagai aktivitas, tetapi tetap memberi waktu
  // agar tombol/link dapat menjalankan aksinya terlebih dahulu.
  window.addEventListener('click', registerActivity, { passive: true });

  // Jika tab ditinggalkan, hentikan auto-scroll. Saat kembali, timer mulai lagi.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopAutoScroll();
      clearTimeout(idleTimer);
    } else {
      scheduleAutoScroll();
    }
  });

  scheduleAutoScroll();
})();
