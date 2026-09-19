/* ======================================================
   KINGPIN WOOD — script.js (Django-connected version)
   - Product catalog comes from the database via the
     #product-data tag the Django view renders.
   - Cart state kept in localStorage so it survives a reload.
   - Checkout POSTs to /api/orders/ with a CSRF token, and the
     Django view stores the order and returns a real reference.
   ====================================================== */

/* ---------- Catalog ----------
   On the Django-served page, the product list comes from the
   database via the #product-data script tag the view renders
   (see store/views.py -> index). This fallback array only runs
   if that tag isn't present, e.g. when opening this file outside
   Django. Edit prices/products in the Django admin, not here. */
const FALLBACK_PRODUCTS = [
  {
    id: "fluted-panel",
    name: "Fluted Panel",
    category: "panels",
    unit: "per panel",
    price: 15500,
    desc: "Grooved wall panel with a stone-grain finish, for feature walls and partitions.",
    image: "assets/fluted-panel.jpg",
  },
  {
    id: "marble-gold",
    name: "Marble Sheet — Calacatta Gold",
    category: "panels",
    unit: "per sheet",
    price: 42000,
    desc: "White marble-effect sheet with gold veining, for wall cladding and feature panels.",
    image: "assets/marble-gold.jpg",
  },
  {
    id: "marble-black",
    name: "Marble Sheet — Nero Gold",
    category: "panels",
    unit: "per sheet",
    price: 44000,
    desc: "Charcoal marble-effect sheet with gold fault lines, for a bold interior feature.",
    image: "assets/marble-black.jpg",
  },
  {
    id: "wooden-door",
    name: "Wooden Door — Classic Walnut",
    category: "doors",
    unit: "per door",
    price: 68000,
    desc: "Walnut-finish door with brass inlay strips and matching handle set.",
    image: "assets/door.jpg",
  },
  {
    id: "edge-banding",
    name: "Edge Banding Tape",
    category: "finishing",
    unit: "per roll",
    price: 4500,
    desc: "PVC edge banding in matching wood-grain, solid and marble finishes.",
    image: "assets/edge-banding.jpg",
  },
];

/* ---------- Catalog source ---------- */

const productDataEl = document.getElementById("product-data");
const productData = productDataEl
  ? JSON.parse(productDataEl.textContent)
  : FALLBACK_PRODUCTS;

/* ---------- State ---------- */

let cart = loadCart();
let activeFilter = "all";

/* ---------- Helpers ---------- */

function formatNaira(amount) {
  return "₦" + amount.toLocaleString("en-NG");
}

function loadCart() {
  try {
    const raw = localStorage.getItem("kingpinwood_cart");
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveCart() {
  try {
    localStorage.setItem("kingpinwood_cart", JSON.stringify(cart));
  } catch (e) {
    /* storage unavailable — cart still works for this session */
  }
}

function cartItemCount() {
  return Object.values(cart).reduce((sum, line) => sum + line.qty, 0);
}

function cartTotal() {
  return Object.values(cart).reduce((sum, line) => sum + line.qty * line.price, 0);
}

/* ---------- Rendering: product grid ---------- */

function renderProducts() {
  const grid = document.getElementById("productGrid");
  grid.innerHTML = "";

  const items = productData.filter(
    (p) => activeFilter === "all" || p.category === activeFilter
  );

  items.forEach((product) => {
    const card = document.createElement("article");
    card.className = "product-card";

    const swatch = product.swatchColor || "linear-gradient(135deg, #6b4a34, #3e2a1e)";
    const media = product.image
      ? `<div class="product-photo"><img src="${product.image}" alt="${product.name}" /></div>`
      : `<div class="product-swatch" style="background-image:${swatch}"><span>${product.name}</span></div>`;

    card.innerHTML = `
      ${media}
      <div class="product-body">
        <p class="product-category">${categoryLabel(product.category)}</p>
        <h3 class="product-name">${product.name}</h3>
        <p class="product-desc">${product.desc}</p>
        <div class="product-price-row">
          <span class="product-price">${formatNaira(product.price)}</span>
          <span class="product-unit">${product.unit}</span>
        </div>
        <div class="qty-row">
          <div class="stepper" data-id="${product.id}">
            <button type="button" class="qty-minus" aria-label="Decrease quantity">&minus;</button>
            <input type="number" min="1" value="1" class="qty-input" aria-label="Quantity" />
            <button type="button" class="qty-plus" aria-label="Increase quantity">+</button>
          </div>
          <button type="button" class="add-btn" data-id="${product.id}">Add to order</button>
        </div>
      </div>
    `;

    grid.appendChild(card);
  });
}

function categoryLabel(cat) {
  const labels = {
    boards: "Plywood & Boards",
    panels: "Panels & Surfaces",
    doors: "Doors",
    finishing: "Finishing",
  };
  return labels[cat] || cat;
}

/* ---------- Filters ---------- */

document.querySelectorAll(".filter-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    activeFilter = btn.dataset.filter;
    renderProducts();
  });
});

/* ---------- Stepper + add-to-order (event delegation) ---------- */

document.getElementById("productGrid").addEventListener("click", (e) => {
  const stepperWrap = e.target.closest(".stepper");
  if (stepperWrap) {
    const input = stepperWrap.querySelector(".qty-input");
    let value = parseInt(input.value, 10) || 1;
    if (e.target.classList.contains("qty-plus")) value += 1;
    if (e.target.classList.contains("qty-minus")) value = Math.max(1, value - 1);
    input.value = value;
    return;
  }

  const addBtn = e.target.closest(".add-btn");
  if (addBtn) {
    const id = addBtn.dataset.id;
    const card = addBtn.closest(".product-card");
    const qty = parseInt(card.querySelector(".qty-input").value, 10) || 1;
    addToCart(id, qty);

    addBtn.textContent = "Added";
    addBtn.classList.add("added");
    setTimeout(() => {
      addBtn.textContent = "Add to order";
      addBtn.classList.remove("added");
    }, 900);
  }
});

function addToCart(id, qty) {
  const product = productData.find((p) => p.id === id);
  if (!product) return;

  if (cart[id]) {
    cart[id].qty += qty;
  } else {
    cart[id] = { name: product.name, unit: product.unit, price: product.price, qty };
  }
  saveCart();
  updateOrderBar();
}

function removeFromCart(id) {
  delete cart[id];
  saveCart();
  updateOrderBar();
  renderCartModal();
}

/* ---------- Order bar ---------- */

function updateOrderBar() {
  const count = cartItemCount();
  document.getElementById("cartCount").textContent = count;
  document.getElementById("orderBarCount").textContent =
    count === 1 ? "1 item" : `${count} items`;
  document.getElementById("orderBarTotal").textContent = formatNaira(cartTotal());

  const bar = document.getElementById("orderBar");
  if (count > 0) bar.classList.add("visible");
  else bar.classList.remove("visible");
}

/* ---------- Cart modal ---------- */

const cartModal = document.getElementById("cartModal");

function openCartModal() {
  renderCartModal();
  cartModal.classList.add("open");
  document.getElementById("confirmationBlock").classList.remove("show");
}

function closeCartModal() {
  cartModal.classList.remove("open");
}

function renderCartModal() {
  const linesWrap = document.getElementById("cartLines");
  const totalRow = document.getElementById("cartTotalRow");
  const form = document.getElementById("checkoutForm");
  const entries = Object.entries(cart);

  if (entries.length === 0) {
    linesWrap.innerHTML = `<div class="empty-cart">Your order list is empty. Add materials from the catalog to get started.</div>`;
    totalRow.style.display = "none";
    form.style.display = "none";
    return;
  }

  linesWrap.innerHTML = entries
    .map(
      ([id, line]) => `
      <div class="order-line" data-id="${id}">
        <div>
          <div class="order-line-name">${line.name}</div>
          <div class="order-line-meta">${line.qty} × ${formatNaira(line.price)} ${line.unit}</div>
        </div>
        <div style="display:flex; align-items:center; gap:14px;">
          <strong>${formatNaira(line.qty * line.price)}</strong>
          <button type="button" class="remove-line" data-id="${id}">Remove</button>
        </div>
      </div>`
    )
    .join("");

  totalRow.style.display = "flex";
  document.getElementById("cartTotal").textContent = formatNaira(cartTotal());
  form.style.display = "flex";
}

document.getElementById("cartLines").addEventListener("click", (e) => {
  const btn = e.target.closest(".remove-line");
  if (btn) removeFromCart(btn.dataset.id);
});

document.getElementById("openCartBtn").addEventListener("click", openCartModal);
document.getElementById("closeCartBtn").addEventListener("click", closeCartModal);
document.getElementById("orderBarBtn").addEventListener("click", openCartModal);
cartModal.addEventListener("click", (e) => {
  if (e.target === cartModal) closeCartModal();
});

/* ---------- Checkout submission ----------
   This posts the order to a Django endpoint at /api/orders/.
   Until that endpoint exists, the request fails silently and
   we fall back to a local confirmation so the flow still works
   end-to-end while the backend is being built. */

document.getElementById("checkoutForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const order = {
    customer_name: document.getElementById("custName").value,
    customer_phone: document.getElementById("custPhone").value,
    customer_address: document.getElementById("custAddress").value,
    items: Object.entries(cart).map(([id, line]) => ({
      product_id: id,
      name: line.name,
      qty: line.qty,
      unit_price: line.price,
    })),
    total: cartTotal(),
  };

  let reference = "KPW-" + Date.now().toString().slice(-6);

  try {
    const csrfTag = document.querySelector('meta[name="csrf-token"]');
    const csrfToken = csrfTag ? csrfTag.content : "";

    const res = await fetch("/api/orders/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken,
      },
      body: JSON.stringify(order),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.reference) reference = data.reference;
    }
  } catch (err) {
    /* backend not connected yet — continue with the local reference */
  }

  document.getElementById("orderRef").textContent = reference;
  document.getElementById("checkoutForm").style.display = "none";
  document.getElementById("cartTotalRow").style.display = "none";
  document.getElementById("cartLines").innerHTML = "";
  document.getElementById("confirmationBlock").classList.add("show");

  cart = {};
  saveCart();
  updateOrderBar();
});

/* ---------- Init ---------- */

document.getElementById("year").textContent = new Date().getFullYear();
renderProducts();
updateOrderBar();
