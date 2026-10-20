
"use strict";

// GANTI dengan nomor WhatsApp Dapur Sambal Maumere
// Gunakan kode negara 62, tanpa tanda + atau angka 0 di depan.
const OWNER_PIN = "1111";
const WHATSAPP_RESTAURANT = "6281238836884";

const menu = [
  { id: "ayam-geprek", nama: "Ayam Geprek", kategori: "Ayam", harga: 25000 },
  { id: "ayam-sambal-tomat", nama: "Ayam Sambal Tomat", kategori: "Ayam", harga: 30000 },
  { id: "ayam-extra-pedas", nama: "Ayam Saus Extra Pedas", kategori: "Ayam", harga: 40000 },
  { id: "ayam-to-pagang", nama: "Ayam To Pagang", kategori: "Ayam", harga: 60000 },
  { id: "sambal-bungkus", nama: "Sambal Bungkus", kategori: "Nasi & Sambal", harga: 15000 },
  { id: "nasi-ikan", nama: "Nasi Ikan Biasa", kategori: "Nasi & Sambal", harga: 15000 },
  { id: "nasi-tahu-tempe", nama: "Nasi Tahu Tempe", kategori: "Nasi & Sambal", harga: 20000 },
  { id: "nasi-telur", nama: "Nasi Telur", kategori: "Nasi & Sambal", harga: 20000 },
  { id: "es-biasa", nama: "Es Biasa", kategori: "Minuman", harga: 2000 },
  { id: "es-kuku-bima", nama: "Es Kuku Bima", kategori: "Minuman", harga: 5000 },
  { id: "es-teler", nama: "Es Teler", kategori: "Minuman", harga: 7000 },
  { id: "es-teh", nama: "Es Teh", kategori: "Minuman", harga: 4000 },
  { id: "es-kelapa", nama: "Es Kelapa Muda", kategori: "Minuman", harga: 10000 }
];

const kategoriMenu = ["Ayam", "Nasi & Sambal", "Minuman"];
const statusPesanan = ["Baru", "Dimasak", "Diantar", "Selesai", "Batal"];

const keranjang = {};
const menuHabis = new Set();
const pesananSesi = [];

let kategoriAktif = "Ayam";
let nomorFokusSebelumModal = null;

const elemen = {
  customerPage: document.getElementById("customerPage"),
  ownerPage: document.getElementById("ownerPage"),
  menuTabs: document.getElementById("menuTabs"),
  menuGrid: document.getElementById("menuGrid"),
  cartCount: document.getElementById("cartCount"),
  cartTotal: document.getElementById("cartTotal"),
  openCart: document.getElementById("openCart"),
  cartModal: document.getElementById("cartModal"),
  cartLines: document.getElementById("cartLines"),
  checkoutForm: document.getElementById("checkoutForm"),
  ownerModal: document.getElementById("ownerModal"),
  ownerLoginForm: document.getElementById("ownerLoginForm"),
  ownerPin: document.getElementById("ownerPin"),
  ownerPinError: document.getElementById("ownerPinError"),
  statsGrid: document.getElementById("statsGrid"),
  soldSettings: document.getElementById("soldSettings"),
  ordersContainer: document.getElementById("ordersContainer")
};

function escapeHTML(nilai) {
  return String(nilai).replace(/[&<>"']/g, karakter => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[karakter]);
}

function formatRupiah(nilai) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(nilai);
}

function hitungJumlah() {
  return Object.values(keranjang)
    .reduce((jumlah, angka) => jumlah + angka, 0);
}

function hitungTotal() {
  return menu.reduce(
    (total, item) =>
      total + item.harga * (keranjang[item.id] || 0),
    0
  );
}

function buatTabs() {
  elemen.menuTabs.innerHTML = kategoriMenu.map(kategori => `
    <button
      class="tab ${kategori === kategoriAktif ? "active" : ""}"
      type="button"
      role="tab"
      aria-selected="${kategori === kategoriAktif}"
      data-category="${escapeHTML(kategori)}">
      ${escapeHTML(kategori)}
    </button>
  `).join("");
}

function buatKartuMenu() {
  const menuKategori = menu.filter(
    item => item.kategori === kategoriAktif
  );

  elemen.menuGrid.innerHTML = menuKategori.map(item => {
    const jumlah = keranjang[item.id] || 0;
    const habis = menuHabis.has(item.id);

    return `
      <article class="menu-card ${habis ? "sold" : ""}">
        <div class="menu-card-top">
          <div>
            <h3>${escapeHTML(item.nama)}</h3>
            <div class="category-label">
              ${escapeHTML(item.kategori)}
            </div>
          </div>
          ${habis ? '<span class="sold-tag">Habis</span>' : ""}
        </div>

        <p class="price">${formatRupiah(item.harga)}</p>

        <div class="menu-controls">
          ${habis ? `
            <span class="muted">Belum tersedia</span>
          ` : `
            <button
              class="add-button"
              type="button"
              data-add="${escapeHTML(item.id)}"
              ${jumlah > 0 ? "hidden" : ""}>
              Tambah
            </button>

            <div class="stepper ${jumlah > 0 ? "visible" : ""}">
              <button
                class="step-button"
                type="button"
                data-minus="${escapeHTML(item.id)}">−</button>

              <span class="qty-number">${jumlah}</span>

              <button
                class="step-button"
                type="button"
                data-plus="${escapeHTML(item.id)}">+</button>
            </div>
          `}
        </div>
      </article>
    `;
  }).join("");
}

function perbaruiKeranjang() {
  const jumlah = hitungJumlah();

  elemen.cartCount.textContent = jumlah === 0
    ? "Keranjang kosong"
    : `${jumlah} item di keranjang`;

  elemen.cartTotal.textContent = jumlah === 0
    ? "Tambahkan menu untuk mulai memesan"
    : `Total sementara ${formatRupiah(hitungTotal())}`;

  elemen.openCart.disabled = jumlah === 12;
}

function buatRincianKeranjang() {
  const itemDipilih = menu.filter(
    item => (keranjang[item.id] || 0) > 0
  );

  elemen.cartLines.innerHTML = `
    ${itemDipilih.map(item => `
      <div class="order-line">
        <span>
          ${escapeHTML(item.nama)} × ${keranjang[item.id]}
        </span>
        <span>
          ${formatRupiah(item.harga * keranjang[item.id])}
        </span>
      </div>
    `).join("")}

    <div class="order-total">
      <span>Total makanan</span>
      <span>${formatRupiah(hitungTotal())}</span>
    </div>
  `;
}

function ubahJumlah(id, perubahan) {
  const item = menu.find(menuItem => menuItem.id === id);

  if (!item || menuHabis.has(id)) return;

  const jumlahBaru = Math.max(
    0,
    (keranjang[id] || 0) + perubahan
  );

  if (jumlahBaru === 0) {
    delete keranjang[id];
  } else {
    keranjang[id] = jumlahBaru;
  }

  buatKartuMenu();
  perbaruiKeranjang();

  if (elemen.cartModal && !elemen.cartModal.hidden) {
    buatRincianKeranjang();
  }
}

function buatKodePesanan() {
  const karakter = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let kode = "";

  for (let i = 0; i < 4; i++) {
    kode += karakter[
      Math.floor(Math.random() * karakter.length)
    ];
  }

  return kode;
}

function waktuPesanan() {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Makassar"
  }).format(new Date()) + " WITA";
}

// Membuat isi pesan WhatsApp
function buatPesananWhatsApp(data, kode) {
  const barisMenu = menu
    .filter(item => (keranjang[item.id] || 0) > 0)
    .map(item => {
      const jumlah = keranjang[item.id];

      return `• ${item.nama} × ${jumlah} — ${
        formatRupiah(item.harga * jumlah)
      }`;
    });

  return [
    "Halo Dapur Sambal Maumere, saya ingin memesan:",
    "",
    `Kode pesanan: ${kode}`,
    ...barisMenu,
    "",
    `Total makanan: ${formatRupiah(hitungTotal())}`,
    "Ongkos kirim: Mohon dikonfirmasi lewat chat",
    "",
    `Nama: ${data.nama}`,
    `Nomor WhatsApp: ${data.whatsapp}`,
    `Alamat pengantaran: ${data.alamat}`,
    `Catatan: ${data.catatan || "-"}`,
    "",
    "Mohon konfirmasi pesanan dan metode pembayaran. Terima kasih."
  ].join("\n");
}

function catatPesananSementara(kode) {
  const rincian = menu
    .filter(item => (keranjang[item.id] || 0) > 0)
    .map(item => ({
      nama: item.nama,
      jumlah: keranjang[item.id],
      subtotal: item.harga * keranjang[item.id]
    }));

  pesananSesi.unshift({
    kode,
    item: rincian,
    total: hitungTotal(),
    waktu: waktuPesanan(),
    status: "Baru",
    waktuPembuatan: new Date()
  });

  gambarDasbor();
}

function bukaModal(modal) {
  nomorFokusSebelumModal = document.activeElement;
  modal.hidden = false;
  document.body.style.overflow = "hidden";

  const fokusPertama = modal.querySelector(
    "input, button, textarea, select"
  );

  if (fokusPertama) fokusPertama.focus();
}

function tutupModal(modal) {
  modal.hidden = true;
  document.body.style.overflow = "";

  if (
    nomorFokusSebelumModal &&
    typeof nomorFokusSebelumModal.focus === "function"
  ) {
    nomorFokusSebelumModal.focus();
  }
}

function hitungStatistik() {
  const sekarang = new Date();

  const pesananHariIni = pesananSesi.filter(pesanan => {
    const dibuat = pesanan.waktuPembuatan;

    return dibuat.getDate() === sekarang.getDate()
      && dibuat.getMonth() === sekarang.getMonth()
      && dibuat.getFullYear() === sekarang.getFullYear();
  });

  const pesananAktif = pesananHariIni.filter(pesanan =>
    ["Baru", "Dimasak", "Diantar"].includes(pesanan.status)
  );

  const pesananDihitung = pesananHariIni.filter(
    pesanan => pesanan.status !== "Batal"
  );

  const pendapatan = pesananDihitung.reduce(
    (jumlah, pesanan) => jumlah + pesanan.total,
    0
  );

  const totalPerMenu = {};

  pesananDihitung.forEach(pesanan => {
    pesanan.item.forEach(item => {
      totalPerMenu[item.nama] =
        (totalPerMenu[item.nama] || 0) + item.jumlah;
    });
  });

  const menuTerlaris = Object.entries(totalPerMenu)
    .sort((a, b) => b[1] - a[1])[0];

  return {
    jumlahPesanan: pesananHariIni.length,
    pendapatan,
    terlaris: menuTerlaris
      ? `${menuTerlaris[0]} (${menuTerlaris[1]})`
      : "Belum ada",
    perluDiproses: pesananAktif.length
  };
}

function gambarStatistik() {
  const statistik = hitungStatistik();

  elemen.statsGrid.innerHTML = `
    <article class="stat-card">
      <span>Pesanan hari ini</span>
      <strong>${statistik.jumlahPesanan}</strong>
    </article>

    <article class="stat-card">
      <span>Pendapatan hari ini</span>
      <strong>${formatRupiah(statistik.pendapatan)}</strong>
    </article>

    <article class="stat-card">
      <span>Menu terlaris</span>
      <strong class="stat-menu">
        ${escapeHTML(statistik.terlaris)}
      </strong>
    </article>

    <article class="stat-card">
      <span>Perlu diproses</span>
      <strong>${statistik.perluDiproses}</strong>
    </article>
  `;
}

function gambarPengaturanMenu() {
  elemen.soldSettings.innerHTML = menu.map(item => `
    <label class="sold-setting">
      <input
        type="checkbox"
        data-sold="${escapeHTML(item.id)}"
        ${menuHabis.has(item.id) ? "checked" : ""}>
      <span>${escapeHTML(item.nama)} — tandai habis</span>
    </label>
  `).join("");
}

function gambarDaftarPesanan() {
  if (pesananSesi.length === 0) {
    elemen.ordersContainer.innerHTML =
      '<p class="empty-orders">Belum ada pesanan pada sesi halaman ini.</p>';
    return;
  }

  elemen.ordersContainer.innerHTML = `
    <div class="orders-wrap">
      <table class="orders-table">
        <thead>
          <tr>
            <th>Kode</th>
            <th>Item</th>
            <th>Total</th>
            <th>Jam</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${pesananSesi.map((pesanan, indeks) => `
            <tr>
              <td><strong>${escapeHTML(pesanan.kode)}</strong></td>
              <td>
                ${pesanan.item.map(item =>
                  `${escapeHTML(item.nama)} × ${item.jumlah}`
                ).join("<br>")}
              </td>
              <td>${formatRupiah(pesanan.total)}</td>
              <td>${escapeHTML(pesanan.waktu)}</td>
              <td>
                <select
                  class="status-select"
                  data-order-index="${indeks}">
                  ${statusPesanan.map(status => `
                    <option
                      value="${escapeHTML(status)}"
                      ${pesanan.status === status ? "selected" : ""}>
                      ${escapeHTML(status)}
                    </option>
                  `).join("")}
                </select>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function gambarDasbor() {
  gambarStatistik();
  gambarPengaturanMenu();
  gambarDaftarPesanan();
}

function tampilkanDasbor() {
  elemen.customerPage.hidden = true;
  document.getElementById("cartBar").hidden = true;
  document.querySelector(".footer").hidden = true;
  elemen.ownerPage.hidden = false;
  gambarDasbor();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function tampilkanHalamanPelanggan() {
  elemen.ownerPage.hidden = true;
  elemen.customerPage.hidden = false;
  document.getElementById("cartBar").hidden = false;
  document.querySelector(".footer").hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Navigasi kategori menu
elemen.menuTabs.addEventListener("click", event => {
  const tombol = event.target.closest("[data-category]");
  if (!tombol) return;

  kategoriAktif = tombol.dataset.category;
  buatTabs();
  buatKartuMenu();
});

// Tombol tambah, tambah jumlah, dan kurangi jumlah
elemen.menuGrid.addEventListener("click", event => {
  const tambah = event.target.closest("[data-add]");
  const plus = event.target.closest("[data-plus]");
  const minus = event.target.closest("[data-minus]");

  if (tambah) ubahJumlah(tambah.dataset.add, 1);
  if (plus) ubahJumlah(plus.dataset.plus, 1);
  if (minus) ubahJumlah(minus.dataset.minus, -1);
});

// Pengaturan menu habis
elemen.soldSettings.addEventListener("change", event => {
  const kotak = event.target.closest("[data-sold]");
  if (!kotak) return;

  if (kotak.checked) {
    menuHabis.add(kotak.dataset.sold);
    delete keranjang[kotak.dataset.sold];
  } else {
    menuHabis.delete(kotak.dataset.sold);
  }

  buatKartuMenu();
  perbaruiKeranjang();
  gambarPengaturanMenu();
  gambarStatistik();
});

// Mengubah status pesanan di dasbor
elemen.ordersContainer.addEventListener("change", event => {
  const pilihan = event.target.closest("[data-order-index]");
  if (!pilihan) return;

  const pesanan = pesananSesi[Number(pilihan.dataset.orderIndex)];

  if (!pesanan || !statusPesanan.includes(pilihan.value)) return;

  pesanan.status = pilihan.value;
  gambarStatistik();
  gambarDaftarPesanan();
});

// Buka keranjang
elemen.openCart.addEventListener("click", () => {
  buatRincianKeranjang();
  bukaModal(elemen.cartModal);
});

// Tutup modal melalui tombol
document.addEventListener("click", event => {
  const tombolTutup = event.target.closest("[data-close]");
  if (!tombolTutup) return;

  const modal = document.getElementById(tombolTutup.dataset.close);
  if (modal) tutupModal(modal);
});

// Tutup modal melalui klik luar atau tombol Escape
document.querySelectorAll(".modal-backdrop").forEach(modal => {
  modal.addEventListener("click", event => {
    if (event.target === modal) tutupModal(modal);
  });
});

document.addEventListener("keydown", event => {
  if (event.key !== "Escape") return;

  document.querySelectorAll(".modal-backdrop:not([hidden])")
    .forEach(modal => tutupModal(modal));
});

// PROSES PEMESANAN WHATSAPP
elemen.checkoutForm.addEventListener("submit", event => {
  event.preventDefault();

  if (hitungJumlah() === 0) {
    alert("Keranjang masih kosong. Silakan pilih menu terlebih dahulu.");
    return;
  }

  const dataForm = new FormData(elemen.checkoutForm);

  const dataPelanggan = {
    nama: String(dataForm.get("nama") || "").trim(),
    whatsapp: String(dataForm.get("whatsapp") || "").trim(),
    alamat: String(dataForm.get("alamat") || "").trim(),
    catatan: String(dataForm.get("catatan") || "").trim()
  };

  if (
    !dataPelanggan.nama ||
    !dataPelanggan.whatsapp ||
    !dataPelanggan.alamat
  ) {
    alert("Mohon isi nama, nomor WhatsApp, dan alamat pengantaran.");
    return;
  }

  if (
    !/^\d{10,15}$/.test(WHATSAPP_RESTAURANT) ||
    WHATSAPP_RESTAURANT === "62812XXXXXXXX"
  ) {
    return;
  }

  const kode = buatKodePesanan();
  const pesan = buatPesananWhatsApp(dataPelanggan, kode);

  const tautanWhatsApp =
    `https://wa.me/${WHATSAPP_RESTAURANT}?text=${encodeURIComponent(pesan)}`;

  // Buka WhatsApp langsung dari aksi pelanggan.
  // Jika browser memblokir tab baru, gunakan tab yang sama.
  const jendelaWhatsApp = window.open(tautanWhatsApp, "_blank");

  if (!jendelaWhatsApp) {
    window.location.href = tautanWhatsApp;
    return;
  }

  catatPesananSementara(kode);
  tutupModal(elemen.cartModal);
  elemen.checkoutForm.reset();

  Object.keys(keranjang).forEach(id => delete keranjang[id]);

  buatKartuMenu();
  perbaruiKeranjang();
});

// Login pemilik
document.getElementById("ownerOpen").addEventListener("click", () => {
  elemen.ownerPinError.textContent = "";
  elemen.ownerPin.value = "";
  bukaModal(elemen.ownerModal);
});

elemen.ownerLoginForm.addEventListener("submit", event => {
  event.preventDefault();

  if (elemen.ownerPin.value === OWNER_PIN) {
    tutupModal(elemen.ownerModal);
    tampilkanDasbor();
  } else {
    elemen.ownerPinError.textContent =
      "PIN tidak sesuai. Silakan coba lagi.";
    elemen.ownerPin.select();
  }
});

document.getElementById("backToCustomer")
  .addEventListener("click", tampilkanHalamanPelanggan);

// Tampilan awal
buatTabs();
buatKartuMenu();
perbaruiKeranjang();
