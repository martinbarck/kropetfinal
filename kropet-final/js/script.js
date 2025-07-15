document.addEventListener('DOMContentLoaded', () => {
  updateCartIcon();

  const menuToggle = document.getElementById('menu-toggle');
  const menu = document.querySelector('.menu');
  if (menuToggle && menu) {
    if (window.innerWidth <= 768) {
      menu.style.display = 'none';
    }

    menuToggle.addEventListener('click', () => {
      menu.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 768 && !menu.contains(e.target) && !menuToggle.contains(e.target)) {
        menu.classList.remove('active');
      }
    });
  }

  document.querySelectorAll('[data-category]').forEach(grid => {
    const category = grid.dataset.category;
    if (category) renderProducts(category, grid);
  });

  const reviewsGrid = document.getElementById('reseñas-grid');
  if (reviewsGrid) renderReviews();

  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const formData = new FormData(contactForm);
      fetch(contactForm.action, { method: 'POST', body: formData, headers: { 'Accept': 'application/json' } })
        .then(response => response.ok && contactForm.reset());
    });
  }

  const detailContainer = document.getElementById('product-detail-container');
  if (detailContainer) {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id'), 10);
    if (productId) {
      fetch('http://localhost:3000/products')
        .then(response => response.json())
        .then(data => {
          window.products = data;
          renderProductDetail(productId);
          updateCartIcon();
        })
        .catch(error => console.error('Error fetching product details:', error));
    }
  }

  const cartTable = document.getElementById('cartTable');
  if (cartTable) {
    fetch('http://localhost:3000/products')
      .then(response => response.json())
      .then(data => {
        window.products = data;
        renderCart();
        updateCartIcon();
        setupCartButtons();
      })
      .catch(error => console.error('Error fetching products for cart:', error));
  }
});

function renderProducts(category = 'all', gridElement = document.getElementById('productos-grid')) {
  if (!gridElement || typeof window.products === 'undefined') {
    gridElement.innerHTML = '<p>Cargando productos...</p>';
    return;
  }

  let filteredProducts;
  if (category === 'all') {
    // Muestra 3 productos de cada categoría en index.html
    const categories = ['perros', 'gatos', 'otras mascotas'];
    filteredProducts = [];
    categories.forEach(cat => {
      const catProducts = window.products.filter(p => p.category === cat).slice(0, 3);
      filteredProducts = filteredProducts.concat(catProducts);
    });
  } else {
    // Muestra todos los productos de la categoría en otras páginas
    filteredProducts = window.products.filter(p => p.category === category);
  }

  if (filteredProducts.length === 0) {
    gridElement.innerHTML = '<p>No hay productos en esta categoría por el momento.</p>';
    return;
  }

  gridElement.innerHTML = filteredProducts.map(product => `
    <article class="productos-card">
      <img src="${product.image}" alt="${product.name}" />
      <h3>${product.name}</h3>
      <p class="precio">$${product.price.toLocaleString('es-AR')}</p>
      <p>${product.description}</p>
      <ul class="productos-features">${product.features.map(f => `<li>${f}</li>`).join('')}</ul>
      <button class="btn btn-agregar" data-id="${product.id}">Agregar al Carrito</button>
      <a href="detalle.html?id=${product.id}" class="btn btn-detalle">Ver Detalle</a>
    </article>
  `).join('');

  addEventListenersToButtons(gridElement);
}

function renderReviews() {
  const reviewsGrid = document.getElementById('reseñas-grid');
  if (!reviewsGrid || typeof window.reviews === 'undefined') {
    reviewsGrid.innerHTML = '<p>Cargando reseñas...</p>';
    return;
  }

  reviewsGrid.innerHTML = window.reviews.map(review => `
    <article class="review-item">
      <h4>${review.author} <span class="stars">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</span></h4>
      <p>"${review.text}"</p>
    </article>
  `).join('');
}

function renderProductDetail(productId) {
  const detailContainer = document.getElementById('product-detail-container');
  if (!detailContainer || typeof window.products === 'undefined') {
    detailContainer.innerHTML = '<p>Producto no encontrado. <a href="index.html">Volver al inicio</a>.</p>';
    return;
  }

  const product = window.products.find(p => p.id === productId);
  if (!product) {
    detailContainer.innerHTML = '<p>Producto no encontrado. <a href="index.html">Volver al inicio</a>.</p>';
    return;
  }

  detailContainer.innerHTML = `
    <article class="product-detail-card">
      <div class="product-detail-image"><img src="${product.image}" alt="${product.name}"></div>
      <div class="product-detail-info">
        <h2>${product.name}</h2>
        <p class="precio">$${product.price.toLocaleString('es-AR')}</p>
        <p>${product.description}</p>
        <h3>Características:</h3>
        <ul class="productos-features">${product.features.map(f => `<li>${f}</li>`).join('')}</ul>
        <button class="btn btn-agregar" data-id="${product.id}">Agregar al Carrito</button>
      </div>
    </article>
  `;

  addEventListenersToButtons(detailContainer);
}

function addEventListenersToButtons(container = document) {
  const buttons = container.querySelectorAll('.btn-agregar');
  buttons.forEach(button => {
    button.removeEventListener('click', handleAddToCart); // Limpia antes de agregar
    button.addEventListener('click', handleAddToCart);
  });
}

function handleAddToCart(event) {
  event.stopPropagation();
  const productId = parseInt(event.target.dataset.id, 10);
  addToCart(productId);
}

function addToCart(productId) {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  const product = window.products.find(p => p.id === productId);
  if (!product) return;

  const existingProduct = cart.find(item => item.id === productId);
  if (existingProduct) {
    existingProduct.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartIcon();
  showCartNotification();
}

function updateCartIcon() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const cartCounter = document.getElementById('contador-carrito');
  if (cartCounter) {
    cartCounter.textContent = totalItems;
    cartCounter.style.display = totalItems > 0 ? 'inline-block' : 'none';
  }
}

function goToCart() {
  window.location.href = 'carrito.html';
}

function continueShopping() {
  const notification = document.getElementById('cart-notification');
  if (notification) notification.classList.add('hidden');
}

function showCartNotification() {
  const notification = document.getElementById('cart-notification');
  if (notification) {
    notification.innerHTML = '<p>✅ Producto agregado al carrito.</p><button class="btn btn-sm" onclick="goToCart()">Ir al Carrito</button><button class="btn btn-sm btn-secondary" onclick="continueShopping()">Seguir Comprando</button>';
    notification.classList.remove('hidden');
    setTimeout(() => notification.classList.add('hidden'), 6000);
  }
}

function renderCart() {
  const cartTableBody = document.querySelector('#cartTable tbody');
  const totalAmountEl = document.getElementById('totalAmount');
  const buyNowBtn = document.getElementById('buyNowBtn');
  const clearCartBtn = document.getElementById('clearCartBtn');
  let cart = JSON.parse(localStorage.getItem('cart')) || [];

  if (cart.length === 0) {
    cartTableBody.innerHTML = '<tr><td colspan="5">Tu carrito está vacío.</td></tr>';
    totalAmountEl.textContent = 'Total: $0,00';
    buyNowBtn.style.display = 'none';
    clearCartBtn.style.display = 'none';
    return;
  }

  cartTableBody.innerHTML = cart.map(item => `
    <tr>
      <td data-label="Producto">${item.name}</td>
      <td data-label="Precio">$${item.price.toLocaleString('es-AR')}</td>
      <td data-label="Cantidad"><button class="btn-quantity" data-id="${item.id}" data-change="-1">-</button>${item.quantity}<button class="btn-quantity" data-id="${item.id}" data-change="1">+</button></td>
      <td data-label="Subtotal">$${(item.price * item.quantity).toLocaleString('es-AR')}</td>
      <td data-label="Acciones"><button class="btn-remove" data-id="${item.id}">Eliminar</button></td>
    </tr>
  `).join('');

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  totalAmountEl.textContent = `Total: $${total.toLocaleString('es-AR')}`;
  buyNowBtn.style.display = 'inline-block';
  clearCartBtn.style.display = 'inline-block';
}

function setupCartButtons() {
  const cartTableBody = document.querySelector('#cartTable tbody');
  const buyNowBtn = document.getElementById('buyNowBtn');
  const clearCartBtn = document.getElementById('clearCartBtn');

  cartTableBody.addEventListener('click', (event) => {
    const target = event.target;
    const productId = parseInt(target.dataset.id, 10);

    if (target.classList.contains('btn-quantity')) {
      const change = parseInt(target.dataset.change, 10);
      updateQuantity(productId, change);
    }
    if (target.classList.contains('btn-remove')) {
      removeItem(productId);
    }
  });

  if (clearCartBtn) {
    clearCartBtn.addEventListener('click', () => {
      if (JSON.parse(localStorage.getItem('cart'))?.length > 0) {
        showConfirmationModal('¿Estás seguro de que quieres vaciar el carrito?', () => {
          localStorage.removeItem('cart');
          renderCart();
          updateCartIcon();
        });
      }
    });
  }

  if (buyNowBtn) {
    buyNowBtn.addEventListener('click', () => {
      const cart = JSON.parse(localStorage.getItem('cart')) || [];
      if (cart.length > 0) {
        showConfirmationModal('¿Quieres finalizar tu compra?', () => {
          showPaymentNotification();
          localStorage.removeItem('cart');
          renderCart();
          updateCartIcon();
        });
      } else {
        alert('Tu carrito está vacío.');
      }
    });
  }
}

function updateQuantity(productId, change) {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  const item = cart.find(item => item.id === productId);
  if (item) {
    item.quantity += change;
    if (item.quantity <= 0) cart = cart.filter(i => i.id !== productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
    updateCartIcon();
  }
}

function removeItem(productId) {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  cart = cart.filter(item => item.id !== productId);
  localStorage.setItem('cart', JSON.stringify(cart));
  renderCart();
  updateCartIcon();
}

function showConfirmationModal(message, onConfirm) {
  const modal = document.getElementById('confirmation-modal');
  const modalMessage = document.getElementById('modal-message');
  const confirmBtn = document.getElementById('modal-confirm-btn');
  const cancelBtn = document.getElementById('modal-cancel-btn');

  modalMessage.textContent = message;
  modal.classList.remove('hidden');

  confirmBtn.addEventListener('click', () => { onConfirm(); hideModal(); }, { once: true });
  cancelBtn.addEventListener('click', hideModal, { once: true });
  modal.addEventListener('click', (e) => e.target === modal && hideModal(), { once: true });

  function hideModal() {
    modal.classList.add('hidden');
  }
}

function showPaymentNotification() {
  const notification = document.getElementById('cart-notification');
  if (notification) {
    notification.innerHTML = '<p>¡Gracias por tu compra! (Funcionalidad de pago no implementada)</p><button class="btn btn-sm" onclick="goToCart()">Ir al Carrito</button><button class="btn btn-sm btn-secondary" onclick="continueShopping()">Seguir Comprando</button>';
    notification.classList.remove('hidden');
    setTimeout(() => notification.classList.add('hidden'), 3000);
  }
}