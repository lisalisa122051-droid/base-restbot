import fs from "fs";
import { CONFIG } from "./config.js";

function loadDB() {
  try {
    const raw = fs.readFileSync(CONFIG.DB_FILE, "utf8");
    return JSON.parse(raw);
  } catch (e) {
    return { products: [], orders: [], settings: {} };
  }
}

function saveDB(db) {
  fs.writeFileSync(CONFIG.DB_FILE, JSON.stringify(db, null, 2));
}

export const DB = {
  read() { return loadDB(); },
  write(db) { saveDB(db); },
  getProducts() { return loadDB().products; },
  addProduct(product) {
    const db = loadDB();
    product.id = `P${Date.now()}`;
    db.products.push(product);
    saveDB(db);
    return product;
  },
  removeProduct(id) {
    const db = loadDB();
    db.products = db.products.filter(p => p.id !== id);
    saveDB(db);
  },
  getProduct(id) {
    const db = loadDB();
    return db.products.find(p => p.id === id);
  },
  addOrder(order) {
    const db = loadDB();
    order.id = `O${Date.now()}`;
    order.status = "pending";
    db.orders.push(order);
    saveDB(db);
    return order;
  },
  updateOrderStatus(id, status) {
    const db = loadDB();
    const ord = db.orders.find(o => o.id === id);
    if (ord) ord.status = status;
    saveDB(db);
    return ord;
  },
  listOrders() {
    return loadDB().orders;
  }
};
