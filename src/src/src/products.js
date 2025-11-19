import { DB } from "./db.js";

export function formatProductList() {
  const prods = DB.getProducts();
  if (!prods.length) return "Belum ada produk. Admin bisa menambahkan dengan: !addproduk <nama>|<harga>|<deskripsi>";
  let out = "📦 Daftar Produk:\n\n";
  prods.forEach(p => {
    out += `• ${p.id}\n  ${p.name}\n  Harga: ${p.price}\n  Stok: ${p.stock ?? 'N/A'}\n  ${p.desc ?? ''}\n\n`;
  });
  return out;
}
