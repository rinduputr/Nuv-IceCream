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
