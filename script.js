/* ══════════════════════════════
   BURBUJAS ANIMADAS
══════════════════════════════ */
(function () {
  const canvas = document.getElementById('bubblesCanvas');
  const ctx    = canvas.getContext('2d');

  const COLORS = [
    'rgba(160,80,255,',
    'rgba(0,200,255,',
    'rgba(255,106,0,',
    'rgba(255,216,20,',
    'rgba(37,211,102,',
  ];

  let bubbles = [];

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function randBetween(a, b) { return a + Math.random() * (b - a); }

  function createBubble() {
    const r     = randBetween(3, 10);
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    return {
      x:       randBetween(r, canvas.width - r),
      y:       canvas.height + r + randBetween(0, canvas.height),
      r,
      speed:   randBetween(0.3, 0.8),
      drift:   randBetween(-0.2, 0.2),
      opacity: randBetween(0.06, 0.18),
      color,
      wobble:  randBetween(0, Math.PI * 2),
      wobbleSpeed: randBetween(0.008, 0.02),
    };
  }

  function initBubbles() {
    bubbles = [];
    const count = Math.min(25, Math.floor((canvas.width * canvas.height) / 28000));
    for (let i = 0; i < count; i++) {
      const b = createBubble();
      b.y = randBetween(0, canvas.height);
      bubbles.push(b);
    }
  }

  function drawBubble(b) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);

    // relleno suave
    const grad = ctx.createRadialGradient(
      b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.1,
      b.x, b.y, b.r
    );
    grad.addColorStop(0,   b.color + (b.opacity * 0.6) + ')');
    grad.addColorStop(0.6, b.color + (b.opacity * 0.3) + ')');
    grad.addColorStop(1,   b.color + '0)');
    ctx.fillStyle = grad;
    ctx.fill();

    // borde brillante
    ctx.strokeStyle = b.color + (b.opacity + 0.2) + ')';
    ctx.lineWidth   = 1.2;
    ctx.stroke();

    // brillo interior (punto de luz)
    ctx.beginPath();
    ctx.arc(b.x - b.r * 0.32, b.y - b.r * 0.32, b.r * 0.22, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,' + (b.opacity * 0.6) + ')';
    ctx.fill();
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    bubbles.forEach((b, i) => {
      b.wobble += b.wobbleSpeed;
      b.x      += b.drift + Math.sin(b.wobble) * 0.5;
      b.y      -= b.speed;

      drawBubble(b);

      // si sale por arriba, renace por abajo
      if (b.y + b.r < 0) {
        bubbles[i] = createBubble();
      }
    });

    requestAnimationFrame(animate);
  }

  window.addEventListener('resize', () => { resize(); initBubbles(); });
  resize();
  initBubbles();
  animate();
})();

/* ══════════════════════════════
   PRODUCTOS & CARRITO
══════════════════════════════ */
const products = [
  {
    id: 1,
    name: 'F9 Auriculares Bluetooth',
    image: 'F9.png',
    price: 30.00,
  },
  {
    id: 2,
    name: 'M90 PRO Auriculares Gaming',
    image: 'M90 PRO.png',
    price: 40.00,
  },
  {
    id: 3,
    name: 'OWS PRO Auriculares Inalámbricos',
    image: 'OWS PRO.png',
    price: 35.00,
  },
  {
    id: 4,
    name: 'Sound Earcuffs Auriculares Abiertos',
    image: 'sound earcuffs.png',
    price: 45.00,
  }
];

// cart: { id, qty }[]
let cart = [];

/* ── HELPERS ── */
function formatPriceParts(price) {
  const [whole, cents] = price.toFixed(2).split('.');
  return { whole, cents };
}

function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  let s = '★'.repeat(full);
  if (half) s += '½';
  s += '☆'.repeat(5 - full - (half ? 1 : 0));
  return s;
}

function getCartCount() {
  return cart.reduce((sum, i) => sum + i.qty, 0);
}

function getCartTotal() {
  return cart.reduce((sum, i) => {
    const p = products.find(x => x.id === i.id);
    return sum + (p ? p.price * i.qty : 0);
  }, 0);
}

/* ── RENDER PRODUCTS ── */
function renderProducts() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  grid.innerHTML = products.map(p => {
    const { whole, cents } = formatPriceParts(p.price);
    return `
      <div class="product-card" data-id="${p.id}">
        <div class="card-img-wrap" data-img="${p.image}" data-name="${p.name}">
          <img src="${p.image}" alt="${p.name}"
            onerror="this.src='https://via.placeholder.com/300x300?text=Sin+imagen'" />
          <span class="zoom-hint">🔍 Ver</span>
        </div>
        <p class="product-name">${p.name}</p>
        <div class="product-price">
          <span class="price-currency">PEN</span>
          <span class="price-whole">${whole}</span>
          <span class="price-cents">${cents}</span>
        </div>
        <button class="btn-add-cart" data-id="${p.id}">🛒 Agregar al carrito</button>
      </div>
    `;
  }).join('');

  grid.querySelectorAll('.btn-add-cart').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      addToCart(parseInt(btn.dataset.id));
      renderCartItems();
      document.getElementById('cartModal').classList.add('open');
    });
  });

  grid.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width  - 0.5) * 18;
      const y = ((e.clientY - r.top)  / r.height - 0.5) * -18;
      card.style.transform = `perspective(600px) rotateY(${x}deg) rotateX(${y}deg) scale(1.04)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });

  grid.querySelectorAll('.card-img-wrap').forEach(wrap => {
    wrap.addEventListener('click', e => {
      e.stopPropagation();
      openLightbox(wrap.dataset.img, wrap.dataset.name);
    });
  });
}

/* ── CART LOGIC ── */
function addToCart(id) {
  const existing = cart.find(i => i.id === id);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ id, qty: 1 });
  }
  updateCartUI();
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  updateCartUI();
  renderCartItems();
}

function changeQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter(i => i.id !== id);
  }
  updateCartUI();
  renderCartItems();
}

function updateCartUI() {
  const count = getCartCount();
  document.getElementById('cartCount').textContent = count;
}

/* ── RENDER CART MODAL ── */
function renderCartItems() {
  const container = document.getElementById('cartItems');
  const emptyMsg  = document.getElementById('cartEmpty');
  const footer    = document.getElementById('cartFooter');
  const totalEl   = document.getElementById('cartTotal');

  if (cart.length === 0) {
    container.innerHTML = '';
    emptyMsg.style.display = 'block';
    footer.style.display = 'none';
    return;
  }

  emptyMsg.style.display = 'none';
  footer.style.display = 'flex';

  container.innerHTML = cart.map(item => {
    const p = products.find(x => x.id === item.id);
    if (!p) return '';
    return `
      <div class="cart-item">
        <img src="${p.image}" alt="${p.name}"
          onerror="this.src='https://via.placeholder.com/64x64?text=?'" />
        <div class="cart-item-info">
          <p class="cart-item-name">${p.name}</p>
          <p class="cart-item-price">PEN ${(p.price * item.qty).toFixed(2)}</p>
          <div class="qty-control">
            <button class="qty-btn" data-id="${p.id}" data-delta="-1">−</button>
            <span class="qty-num">${item.qty}</span>
            <button class="qty-btn" data-id="${p.id}" data-delta="1">+</button>
          </div>
          <button class="btn-remove" data-id="${p.id}">Eliminar</button>
        </div>
      </div>
    `;
  }).join('');

  totalEl.textContent = `PEN ${getCartTotal().toFixed(2)}`;

  // qty buttons
  container.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', () =>
      changeQty(parseInt(btn.dataset.id), parseInt(btn.dataset.delta))
    );
  });

  // remove buttons
  container.querySelectorAll('.btn-remove').forEach(btn => {
    btn.addEventListener('click', () => removeFromCart(parseInt(btn.dataset.id)));
  });
}

/* ── CHECKOUT → WHATSAPP ── */
function buildWhatsAppMessage() {
  const lines = cart.map(item => {
    const p = products.find(x => x.id === item.id);
    return `• ${p.name} x${item.qty} = PEN ${(p.price * item.qty).toFixed(2)}`;
  });
  lines.push(`\nTotal: PEN ${getCartTotal().toFixed(2)}`);
  return encodeURIComponent('Hola, quiero realizar este pedido:\n\n' + lines.join('\n'));
}

/* ── LIGHTBOX ── */
function openLightbox(src, name) {
  document.getElementById('lightboxImg').src = src;
  document.getElementById('lightboxName').textContent = name;
  document.getElementById('lightbox').classList.add('open');
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
}

document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
document.getElementById('lightbox').addEventListener('click', function(e) {
  if (e.target === this) closeLightbox();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeLightbox();
});

/* ── EVENTS ── */
document.getElementById('cartBtn').addEventListener('click', () => {
  renderCartItems();
  document.getElementById('cartModal').classList.add('open');
});

document.getElementById('closeCart').addEventListener('click', () => {
  document.getElementById('cartModal').classList.remove('open');
});

document.getElementById('cartModal').addEventListener('click', function (e) {
  if (e.target === this) this.classList.remove('open');
});

/* ── INIT ── */
renderProducts();
