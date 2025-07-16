import { products, reviews } from './data.js';

// Renderizar productos
function renderProducts(category, gridElement = document.getElementById("productos-grid")) {
  if (!gridElement || typeof products === "undefined") {
    gridElement.innerHTML = "<p>Cargando productos...</p>";
    return;
  }

  const filteredProducts = products.filter((p) => p.category === category);

  if (filteredProducts.length === 0) {
    gridElement.innerHTML = "<p>No hay productos en esta categoría por el momento.</p>";
    return;
  }

  gridElement.innerHTML = filteredProducts
    .map(
      (product) => `
    <article class="productos-card">
      <img src="${product.image}" alt="${product.name}" onerror="this.src='assets/placeholder.jpg';this.alt='Imagen no disponible'"/>
      <h3>${product.name}</h3>
      <p class="precio">$${product.price.toLocaleString("es-AR")}</p>
      <p>${product.description}</p>
      <ul class="productos-features">${product.features.map((f) => `<li>${f}</li>`).join("")}</ul>
      <button class="btn btn-agregar" data-id="${product.id}">Agregar al Carrito</button>
      <a href="detalle.html?id=${product.id}" class="btn btn-detalle">Ver Detalle</a>
    </article>
  `
    )
    .join("");

  addEventListenersToProductButtons(gridElement);
}

// Renderizar reseñas
function renderReviews() {
  const reviewsGrid = document.getElementById("reseñas-grid");
  if (!reviewsGrid || typeof reviews === "undefined") {
    reviewsGrid.innerHTML = "<p>Cargando reseñas...</p>";
    return;
  }

  if (reviews.length === 0) {
    reviewsGrid.innerHTML = "<p>No hay reseñas disponibles por el momento.</p>";
    return;
  }

  reviewsGrid.innerHTML = reviews
    .map(
      (review) => `
    <article class="review-item">
      <h4>${review.author} <span class="stars">${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)}</span></h4>
      <p>${review.text}</p>
    </article>
  `
    )
    .join("");
}

// Renderizar detalle de producto
function renderProductDetail(productId) {
  const container = document.getElementById("product-detail-container");
  if (!container || typeof products === "undefined") {
    container.innerHTML = "<p>Cargando producto...</p>";
    return;
  }

  const product = products.find((p) => p.id === productId);
  if (!product) {
    container.innerHTML = "<p>Producto no encontrado.</p>";
    return;
  }

  container.innerHTML = `
    <div class="product-detail-card">
      <div class="product-detail-image">
        <img src="${product.image}" alt="${product.name}" onerror="this.src='assets/placeholder.jpg';this.alt='Imagen no disponible'"/>
      </div>
      <div class="product-detail-info">
        <h2>${product.name}</h2>
        <p class="precio">$${product.price.toLocaleString("es-AR")}</p>
        <p>${product.description}</p>
        <ul class="productos-features">${product.features.map((f) => `<li>${f}</li>`).join("")}</ul>
        <button class="btn btn-agregar" data-id="${product.id}">Agregar al Carrito</button>
      </div>
    </div>
  `;
  addEventListenersToProductButtons(container);
}

// Renderizar carrito
function renderCart() {
  const cartTableBody = document.getElementById("cartTable")?.querySelector("tbody");
  const totalAmountEl = document.getElementById("totalAmount");
  if (!cartTableBody || !totalAmountEl) {
    console.error("Elementos del carrito no encontrados:", { cartTableBody, totalAmountEl });
    return;
  }

  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  cartTableBody.innerHTML = "";

  if (cart.length === 0) {
    cartTableBody.innerHTML = "<tr><td colspan='5'>Tu carrito está vacío.</td></tr>";
    totalAmountEl.textContent = "Total: $0,00";
    return;
  }

  cart.forEach((item) => {
    const product = products.find((p) => p.id === item.id);
    if (product) {
      const subtotal = product.price * item.quantity;
      const row = cartTableBody.insertRow();
      row.innerHTML = `
        <td data-label="Producto">${product.name}</td>
        <td data-label="Precio">$${product.price.toLocaleString("es-AR")}</td>
        <td data-label="Cantidad">
          <button class="btn-quantity decrease" data-id="${item.id}">-</button>
          ${item.quantity}
          <button class="btn-quantity increase" data-id="${item.id}">+</button>
        </td>
        <td data-label="Subtotal">$${subtotal.toLocaleString("es-AR")}</td>
        <td data-label="Acciones"><button class="btn-remove" data-id="${item.id}">Eliminar</button></td>
      `;
    }
  });

  const total = cart.reduce((sum, item) => sum + (products.find((p) => p.id === item.id)?.price || 0) * item.quantity, 0);
  totalAmountEl.textContent = `Total: $${total.toLocaleString("es-AR")}`;
}

// Funciones de carrito
function addToCart(productId) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  const product = products.find((p) => p.id === productId);
  if (product) {
    const existingItem = cart.find((item) => item.id === productId);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({ id: productId, quantity: 1 });
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartIcon();
    showNotification();
  } else {
    console.error("Producto no encontrado para agregar al carrito:", productId);
  }
}

function removeFromCart(productId) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  cart = cart.filter((item) => item.id !== productId);
  localStorage.setItem("cart", JSON.stringify(cart));
  renderCart();
}

function increaseQuantity(productId) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  const item = cart.find((item) => item.id === productId);
  if (item) item.quantity += 1;
  localStorage.setItem("cart", JSON.stringify(cart));
  renderCart();
}

function decreaseQuantity(productId) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  const item = cart.find((item) => item.id === productId);
  if (item && item.quantity > 1) item.quantity -= 1;
  else cart = cart.filter((item) => item.id !== productId);
  localStorage.setItem("cart", JSON.stringify(cart));
  renderCart();
}

function updateCartIcon() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const counter = document.getElementById("contador-carrito");
  if (counter) {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    counter.textContent = totalItems > 0 ? totalItems : "0";
    counter.style.display = totalItems > 0 ? "inline-block" : "none";
  }
}

// ✅ Previene agregar múltiples listeners
function addEventListenersToProductButtons(container = document) {
  container.querySelectorAll(".btn-agregar").forEach((button) => {
    if (!button.dataset.listenerAdded) {
      button.addEventListener("click", (e) => {
        e.preventDefault();
        const productId = parseInt(button.dataset.id);
        if (!isNaN(productId)) addToCart(productId);
      });
      button.dataset.listenerAdded = "true";
    }
  });
}

function setupCartPageEventListeners() {
  const cartTable = document.getElementById("cartTable");
  const clearCartBtn = document.getElementById("clearCartBtn");
  const buyNowBtn = document.getElementById("buyNowBtn");

  if (cartTable) {
    cartTable.addEventListener("click", (e) => {
      const target = e.target;
      const productId = parseInt(target.dataset.id);
      if (target.classList.contains("increase") && !isNaN(productId)) {
        increaseQuantity(productId);
      } else if (target.classList.contains("decrease") && !isNaN(productId)) {
        decreaseQuantity(productId);
      } else if (target.classList.contains("btn-remove") && !isNaN(productId)) {
        removeFromCart(productId);
      }
    });
  }

  if (clearCartBtn) {
    clearCartBtn.addEventListener("click", () => {
      if (confirm("¿Estás seguro de vaciar el carrito?")) {
        localStorage.removeItem("cart");
        renderCart();
        updateCartIcon();
      }
    });
  }

  if (buyNowBtn) {
  buyNowBtn.addEventListener("click", () => {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    if (cart.length > 0) {
      alert("🛍️ ¡Listo! Tu compra se realizó correctamente. ¡Esperamos que tu mascota lo disfrute!");
      localStorage.removeItem("cart");
      renderCart();
      updateCartIcon();
    }
  });
}
}

function showNotification() {
  const notification = document.getElementById("cart-notification");
  if (notification) {
    notification.classList.remove("hidden");
    setTimeout(() => notification.classList.add("hidden"), 3000);
    const goToCartBtn = notification.querySelector(".btn");
    const continueShoppingBtn = notification.querySelector(".btn-secondary");
    if (goToCartBtn) goToCartBtn.addEventListener("click", goToCart, { once: true });
    if (continueShoppingBtn) continueShoppingBtn.addEventListener("click", continueShopping, { once: true });
  }
}

function goToCart() {
  window.location.href = "carrito.html";
}

function continueShopping() {
  window.location.href = "index.html";
}

// Inicialización
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = parseInt(urlParams.get("id"));

  if (document.querySelector("[data-category]")) {
    document.querySelectorAll("[data-category]").forEach((grid) => {
      renderProducts(grid.dataset.category, grid);
    });
  } else if (document.getElementById("reseñas-grid")) {
    renderReviews();
  } else if (productId) {
    renderProductDetail(productId);
  } else if (document.getElementById("cartTable")) {
    renderCart();
    setupCartPageEventListeners();
  }

  updateCartIcon();
  addEventListenersToProductButtons(); // extra seguridad
});
