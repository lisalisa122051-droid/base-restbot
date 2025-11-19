import { DB } from "./db.js";
import { formatProductList } from "./products.js";
import { CONFIG } from "./config.js";

export async function handleCommand(conn, message, from, isAdmin) {
  const text = (message?.conversation || message?.extendedTextMessage?.text || "").trim();
  const parts = text.split(" ");
  const cmd = parts[0].toLowerCase();

  if (cmd === `${CONFIG.PREFIX}help` || cmd === `${CONFIG.PREFIX}menu`) {
    const reply = `Halo! Selamat datang di *${CONFIG.STORE_NAME}*\n\nPerintah umum:\n!menu / !help - Tampilkan menu\n!produk - Lihat daftar produk\n!order <productId>|<qty>|<nama>|<alamat> - Buat order\n!cekpesanan <orderId> - Cek status order\n\nAdmin:\n!addproduk <nama>|<harga>|<deskripsi>|<stok>\n!hapusproduk <productId>\n!orders - list semua orders\n!setstatus <orderId>|<status>\n!broadcast <pesan>\n`;
    await conn.sendMessage(from, { text: reply });
    return;
  }

  if (cmd === `${CONFIG.PREFIX}produk` || cmd === "produk") {
    await conn.sendMessage(from, { text: formatProductList() });
    return;
  }

  if (cmd === `${CONFIG.PREFIX}addproduk` && isAdmin) {
    // format: !addproduk nama|harga|desc|stok
    const args = text.substring((CONFIG.PREFIX+"addproduk").length).trim();
    const [name, price, desc="", stock=""] = args.split("|").map(s => s?.trim());
    if (!name || !price) {
      await conn.sendMessage(from, { text: "Format salah. Contoh: !addproduk Baju|75000|Baju katun|10" });
      return;
    }
    const p = DB.addProduct({ name, price, desc, stock });
    await conn.sendMessage(from, { text: `✅ Produk ditambahkan:\n${p.id} - ${p.name} (${p.price})` });
    return;
  }

  if ((cmd === `${CONFIG.PREFIX}hapusproduk` || cmd === "hapusproduk") && isAdmin) {
    const id = text.split(" ")[1];
    if (!id) return conn.sendMessage(from, { text: "Kirim: !hapusproduk <productId>" });
    DB.removeProduct(id);
    await conn.sendMessage(from, { text: `✅ Produk ${id} dihapus (jika ada).` });
    return;
  }

  if (cmd === `${CONFIG.PREFIX}order` || cmd === "order") {
    // order format: !order P123|2|Nama Pembeli|Alamat lengkap
    const args = text.substring((CONFIG.PREFIX+"order").length).trim();
    const [pid, qtyRaw, buyer, address] = args.split("|").map(s => s?.trim());
    const qty = parseInt(qtyRaw || "1");
    if (!pid || !buyer || !address) {
      await conn.sendMessage(from, { text: "Format order salah. Contoh: !order P123|2|Nama|Alamat lengkap" });
      return;
    }
    const product = DB.getProduct(pid);
    if (!product) {
      await conn.sendMessage(from, { text: "Produk tidak ditemukan. Cek dengan !produk" });
      return;
    }
    const order = DB.addOrder({
      productId: pid,
      qty,
      buyer,
      address,
      buyerWa: from
    });
    await conn.sendMessage(from, { text: `✅ Order diterima!\nID: ${order.id}\nProduk: ${product.name}\nQty: ${qty}\nTotal: ${product.price} x ${qty}\nSilakan transfer ke rekening ... dan konfirmasi.` });
    // notify admin
    for (const a of CONFIG.ADMINS) {
      await conn.sendMessage(a, { text: `🛒 New order:\nID: ${order.id}\nFrom: ${buyer}\nProduk: ${product.name}\nQty: ${qty}\nAlamat: ${address}\nNomor buyer: ${from}` });
    }
    return;
  }

  if (cmd === `${CONFIG.PREFIX}cekpesanan` || cmd === "cekpesanan") {
    const orderId = text.split(" ")[1];
    if (!orderId) return conn.sendMessage(from, { text: "Gunakan: !cekpesanan <orderId>" });
    const orders = DB.listOrders();
    const ord = orders.find(o => o.id === orderId);
    if (!ord) return conn.sendMessage(from, { text: "Order tidak ditemukan." });
    await conn.sendMessage(from, { text: `Status pesanan ${ord.id}: ${ord.status}\nProduk: ${ord.productId}\nQty: ${ord.qty}` });
    return;
  }

  if ((cmd === `${CONFIG.PREFIX}orders` || cmd === "orders") && isAdmin) {
    const orders = DB.listOrders();
    if (!orders.length) return conn.sendMessage(from, { text: "Belum ada orders." });
    let out = "📋 Semua Orders:\n\n";
    orders.forEach(o => {
      out += `${o.id} - ${o.productId} - ${o.qty} - ${o.status} - ${o.buyer}\n`;
    });
    await conn.sendMessage(from, { text: out });
    return;
  }

  if ((cmd === `${CONFIG.PREFIX}setstatus` || cmd === "setstatus") && isAdmin) {
    const args = text.split(" ")[1] || "";
    const [orderId, status] = args.split("|").map(s => s?.trim());
    if (!orderId || !status) return conn.sendMessage(from, { text: "Gunakan: !setstatus <orderId>|<status>" });
    const ord = DB.updateOrderStatus(orderId, status);
    if (!ord) return conn.sendMessage(from, { text: "Order tidak ditemukan." });
    // notify buyer
    await conn.sendMessage(ord.buyerWa, { text: `Update pesanan ${ord.id}: status -> ${status}` });
    await conn.sendMessage(from, { text: `✅ Status order ${orderId} diubah jadi ${status}` });
    return;
  }

  if ((cmd === `${CONFIG.PREFIX}broadcast` || cmd === "broadcast") && isAdmin) {
    const msg = text.substring((CONFIG.PREFIX+"broadcast").length).trim();
    if (!msg) return conn.sendMessage(from, { text: "Gunakan: !broadcast <pesan>" });
    const db = DB.read();
    // broadcast to all buyers in orders
    const recipients = Array.from(new Set(db.orders.map(o => o.buyerWa)));
    for (const r of recipients) {
      await conn.sendMessage(r, { text: `📢 Broadcast dari ${CONFIG.STORE_NAME}:\n\n${msg}` });
    }
    await conn.sendMessage(from, { text: `✅ Broadcast terkirim ke ${recipients.length} penerima (berdasarkan orders).` });
    return;
  }

  // fallback auto-reply
  if (text.toLowerCase().includes("halo") || text.toLowerCase().includes("hi")) {
    await conn.sendMessage(from, { text: `Halo! ini ${CONFIG.STORE_NAME}. Ketik !menu untuk daftar perintah.` });
    return;
  }
}
