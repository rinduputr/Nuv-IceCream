/* Integrasi checkout ke Apps Script.
   Tempelkan kode ini di script.js SETELAH fungsi renderCart() dan pemanggilan renderCart(). */
(() => {
  const form = document.getElementById("orderForm");
  if (!form) return;

  const summary = document.getElementById("orderSummary");
  const message = document.getElementById("orderMessage");
  const submit = document.getElementById("submitOrder");
  const apiUrl = window.NUVE_CONFIG && window.NUVE_CONFIG.API_URL;

  // Harga disamakan dengan daftar menu yang tampil di website.
  const prices = {
    "Vanilla Cloud": 18000,
    "Berry Bliss": 20000,
    "Matcha Mist": 20000,
    "Strawberry Dream": 20000,
    "Chocolate Noir": 19000,
    "Minty Blue": 21000
  };

  const rupiah = value => "Rp " + Number(value || 0).toLocaleString("id-ID");

  function getItems() {
    const counts = {};
    cart.forEach(name => counts[name] = (counts[name] || 0) + 1);
    return Object.entries(counts).map(([name, qty]) => ({
      name, qty, price: prices[name] || 20000
    }));
  }

  function updateSummary() {
    const items = getItems();
    const total = items.reduce((sum, item) => sum + item.qty * item.price, 0);
    summary.textContent = items.length
      ? items.map(item => `${item.name} × ${item.qty}`).join(", ") + " — Total " + rupiah(total)
      : "Pilih rasa melalui tombol + pada menu terlebih dahulu.";
  }

  updateSummary();
  const originalRenderCart = renderCart;
  // Perbarui ringkasan setelah keranjang berubah.
  document.addEventListener("click", () => setTimeout(updateSummary, 0));

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const items = getItems();

    if (!items.length) {
      message.textContent = "Keranjang masih kosong. Pilih rasa terlebih dahulu.";
      message.className = "order-message error";
      return;
    }
    if (!apiUrl || apiUrl.includes("PASTE_APPS_SCRIPT")) {
      message.textContent = "Alamat database belum dipasang.";
      message.className = "order-message error";
      return;
    }

    const order = {
      customerName: form.elements.customerName.value.trim(),
      customerWhatsApp: form.elements.customerWhatsApp.value.trim(),
      notes: form.elements.notes.value.trim(),
      items
    };

    submit.disabled = true;
    submit.textContent = "Mengirim pesanan...";
    message.textContent = "Sedang menyimpan pesanan...";
    message.className = "order-message";

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "createOrder", order })
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Pesanan belum berhasil disimpan.");
      }

      message.textContent = "Pesanan berhasil tersimpan! Nomor pesanan: " + result.data.orderId;
      message.className = "order-message success";
      cart.length = 0;
      renderCart();
      updateSummary();
      form.reset();
    } catch (error) {
      console.error("Gagal mengirim pesanan:", error);
      message.textContent = "Belum berhasil terhubung ke database. Coba lagi. Jika tetap gagal, kemungkinan akses lintas situs Apps Script dibatasi browser.";
      message.className = "order-message error";
    } finally {
      submit.disabled = false;
      submit.textContent = "Kirim pesanan ke Nuvé →";
    }
  });
})();
