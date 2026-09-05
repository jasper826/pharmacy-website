/**
 * Kana Drug Store - Frontend Application Logic
 * Integrates UI with Express + MongoDB REST APIs.
 * Location: Arba Minch, Ethiopia (In front of Arba Minch General Hospital)
 * Operating Hours: 24 Hours / 7 Days a Week
 */

// 1. CONFIGURATION
// Configurable API base URL (empty string uses current origin; set window.API_BASE_URL for custom domain)
const API_BASE_URL = window.API_BASE_URL || '';

const API = {
  AUTH_LOGIN: `${API_BASE_URL}/api/auth/login`,
  AUTH_REGISTER: `${API_BASE_URL}/api/auth/register`,
  AUTH_ME: `${API_BASE_URL}/api/auth/me`,
  MEDICINES: `${API_BASE_URL}/api/medicines`,
  ORDERS: `${API_BASE_URL}/api/orders`,
  PRESCRIPTIONS: `${API_BASE_URL}/api/prescriptions`,
  PRESCRIPTION_UPLOAD: `${API_BASE_URL}/api/prescriptions/upload`,
};

// 2. STATE MANAGEMENT
let cart = JSON.parse(localStorage.getItem('kana_cart') || localStorage.getItem('careplus_cart') || '[]');
let currentUser = JSON.parse(localStorage.getItem('kana_user') || localStorage.getItem('careplus_user') || 'null');
let authToken = localStorage.getItem('kana_token') || localStorage.getItem('careplus_token') || null;
let currentSelectedCategory = 'All';

// Helper: Show toast notification
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast-msg ${type}`;
  
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4500);
}

// ==========================================
// 3. MEDICINES CATALOG & SEARCH
// ==========================================

async function fetchMedicines(searchTerm = '', category = currentSelectedCategory) {
  const grid = document.getElementById('medicine-grid');
  if (!grid) return;

  try {
    grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 2rem;">Loading live pharmaceutical catalog...</p>';

    let url = API.MEDICINES;
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (category && category !== 'All') params.append('category', category);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to load medicines: HTTP ${res.status}`);
    }

    const data = await res.json();
    const medicines = Array.isArray(data) ? data : (data.data || data.medicines || []);

    if (!medicines || medicines.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 2rem; background: #f8fafc; border-radius: 8px; border: 1px dashed #cbd5e1;">
          <p style="color: #64748b; font-size: 1.1rem; margin-bottom: 0.5rem;">No medicines found matching "<strong>${searchTerm || category}</strong>".</p>
          <p style="color: #94a3b8; font-size: 0.9rem;">Need this specific medicine urgently? Call Kana Drug Store 24/7 at <a href="tel:0922142311" style="color: #0056b3; font-weight: bold;">0922142311</a>.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = medicines.map(med => {
      const price = med.price || 0;
      const name = escapeHtml(med.name || 'Medicine');
      const generic = med.genericName ? `<span class="generic-name">(${escapeHtml(med.genericName)})</span>` : '';
      const categoryLabel = med.category ? `<span style="font-size: 0.75rem; background: #e0f2fe; color: #0284c7; padding: 2px 8px; border-radius: 12px; font-weight: 600;">${escapeHtml(med.category)}</span>` : '';
      const image = med.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop';
      const desc = med.description ? `<p>${escapeHtml(med.description)}</p>` : '';
      const notes = med.counselingNotes ? `<p style="font-size: 0.78rem; color: #059669; margin-top: 4px;">💡 ${escapeHtml(med.counselingNotes)}</p>` : '';

      return `
        <div class="med-card">
          <img src="${image}" alt="${name}" onerror="this.src='https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop'">
          <div style="margin-bottom: 0.5rem;">${categoryLabel}</div>
          <h4>${name}</h4>
          ${generic}
          <p class="price">${price} ETB</p>
          ${desc}
          ${notes}
          <button class="cart-btn" onclick="addToCart('${name.replace(/'/g, "\\'")}', ${price})">Add to Cart 🛒</button>
        </div>
      `;
    }).join('');

  } catch (error) {
    console.warn('API fetch medicines error:', error.message);
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 1.5rem; background: #f8fafc; border-radius: 8px;">
        <p style="color: #64748b;">Browse our permanent categories below, or call our 24/7 pharmacist at <a href="tel:0922142311" style="color: #28a745; font-weight: bold;">0922142311</a> for instant availability.</p>
      </div>
    `;
  }
}

function filterByCategory(category) {
  currentSelectedCategory = category;
  
  // Update UI pill active states
  const pills = document.querySelectorAll('.category-pills .pill');
  pills.forEach(pill => {
    if (pill.textContent.trim().toLowerCase() === category.toLowerCase() || 
       (category === 'All' && pill.textContent.trim() === 'All') ||
       (category === 'Analgesics & Pain Relief' && pill.textContent.includes('Pain')) ||
       (category === 'Stroke & Cardiovascular' && pill.textContent.includes('Cardio')) ||
       (category === 'Tuberculosis (TB) Care' && pill.textContent.includes('TB')) ||
       (category === 'HIV Management (ART)' && pill.textContent.includes('HIV')) ||
       (category === 'Oncology & Cancer Support' && pill.textContent.includes('Oncology'))) {
      pill.classList.add('active');
    } else {
      pill.classList.remove('active');
    }
  });

  const searchInput = document.getElementById('search-med');
  const term = searchInput ? searchInput.value.trim() : '';
  fetchMedicines(term, category);
}

function clearSearch() {
  const searchInput = document.getElementById('search-med');
  if (searchInput) {
    searchInput.value = '';
  }
  filterByCategory('All');
}

// Debounced live search
function setupSearchListener() {
  const searchInput = document.getElementById('search-med');
  if (!searchInput) return;

  let debounceTimer;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const term = e.target.value.trim();
      fetchMedicines(term, currentSelectedCategory);
    }, 300);
  });
}

// ==========================================
// 4. SHOPPING CART MANAGEMENT
// ==========================================

function addToCart(name, price) {
  const existingItem = cart.find(item => item.name === name);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ name, price, quantity: 1 });
  }

  saveCart();
  renderCart();
  updateCartBadge();
  showToast(`Added "${name}" to your cart! 🛒`, 'success');
}

function changeQuantity(index, delta) {
  if (!cart[index]) return;
  cart[index].quantity += delta;
  if (cart[index].quantity <= 0) {
    cart.splice(index, 1);
  }
  saveCart();
  renderCart();
  updateCartBadge();
}

function removeFromCart(index) {
  if (!cart[index]) return;
  const removedName = cart[index].name;
  cart.splice(index, 1);
  saveCart();
  renderCart();
  updateCartBadge();
  showToast(`Removed "${removedName}" from cart.`, 'info');
}

function saveCart() {
  localStorage.setItem('kana_cart', JSON.stringify(cart));
}

function updateCartBadge() {
  const countSpan = document.getElementById('cart-count');
  if (!countSpan) return;
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  countSpan.textContent = totalCount;
}

function renderCart() {
  const cartList = document.getElementById('cart-items');
  const cartTotal = document.getElementById('cart-total');
  const checkoutBtn = document.getElementById('open-checkout-btn');

  if (!cartList || !cartTotal) return;

  if (cart.length === 0) {
    cartList.innerHTML = '<li class="empty-msg" style="color: #64748b; text-align: center; padding: 1.5rem;">Your cart is currently empty. Browse our medicines catalog above!</li>';
    cartTotal.textContent = '0';
    if (checkoutBtn) checkoutBtn.disabled = true;
    return;
  }

  if (checkoutBtn) checkoutBtn.disabled = false;

  let total = 0;
  cartList.innerHTML = cart.map((item, index) => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    return `
      <li style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
        <div style="flex: 1;">
          <strong style="color: #0f172a;">${escapeHtml(item.name)}</strong>
          <div style="color: #64748b; font-size: 0.85rem;">${item.price} ETB each</div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px; margin: 0 15px;">
          <button type="button" onclick="changeQuantity(${index}, -1)" style="width: 28px; height: 28px; border-radius: 4px; border: 1px solid #cbd5e1; background: white; cursor: pointer; font-weight: bold;">-</button>
          <span style="font-weight: 700; min-width: 20px; text-align: center;">${item.quantity}</span>
          <button type="button" onclick="changeQuantity(${index}, 1)" style="width: 28px; height: 28px; border-radius: 4px; border: 1px solid #cbd5e1; background: white; cursor: pointer; font-weight: bold;">+</button>
        </div>
        <div style="text-align: right; min-width: 80px;">
          <div style="font-weight: 700; color: #0056b3;">${itemTotal} ETB</div>
          <button type="button" onclick="removeFromCart(${index})" style="background: none; border: none; color: #ef4444; font-size: 0.8rem; cursor: pointer; text-decoration: underline; padding: 0;">Remove</button>
        </div>
      </li>
    `;
  }).join('');

  cartTotal.textContent = total;
}

// ==========================================
// 5. CHECKOUT & ORDER CREATION
// ==========================================

function openCheckoutModal() {
  if (cart.length === 0) {
    showToast('Your shopping cart is empty.', 'error');
    return;
  }

  const modal = document.getElementById('checkout-modal');
  if (!modal) return;

  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const modalCount = document.getElementById('modal-order-count');
  const modalTotal = document.getElementById('modal-order-total');
  if (modalCount) modalCount.textContent = totalCount;
  if (modalTotal) modalTotal.textContent = totalPrice;

  // Pre-fill user details if logged in
  if (currentUser) {
    const nameInput = document.getElementById('order-name');
    const phoneInput = document.getElementById('order-phone');
    if (nameInput && !nameInput.value) nameInput.value = currentUser.fullName || '';
    if (phoneInput && !phoneInput.value) phoneInput.value = currentUser.phone || '';
  }

  modal.style.display = 'flex';
}

function closeCheckoutModal() {
  const modal = document.getElementById('checkout-modal');
  if (modal) modal.style.display = 'none';
}

function setupCheckoutForm() {
  const form = document.getElementById('checkout-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      showToast('Your cart is empty.', 'error');
      closeCheckoutModal();
      return;
    }

    const customerName = document.getElementById('order-name').value.trim();
    const phone = document.getElementById('order-phone').value.trim();
    const deliveryAddress = document.getElementById('order-address').value.trim();
    const paymentMethod = document.getElementById('order-payment').value;

    const orderPayload = {
      customerName,
      phone,
      deliveryAddress,
      paymentMethod,
      items: cart
    };

    const submitBtn = document.getElementById('confirm-order-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Processing Order...';
    }

    try {
      const response = await fetch(API.ORDERS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify(orderPayload)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showToast('Order placed successfully! We will coordinate delivery shortly.', 'success');
        cart = [];
        saveCart();
        renderCart();
        updateCartBadge();
        form.reset();
        closeCheckoutModal();
      } else {
        showToast(data.message || 'Failed to place order. Please check details.', 'error');
      }
    } catch (error) {
      console.error('Order checkout error:', error);
      showToast('Network error while placing order. Please call 0922142311 for urgent delivery.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Confirm & Place Order 🚀';
      }
    }
  });
}

// ==========================================
// 6. PRESCRIPTION MULTIPART UPLOAD
// ==========================================

function setupPrescriptionForm() {
  const form = document.querySelector('.prescription-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fileInput = document.getElementById('rx-file');
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      showToast('Please select a prescription photo or PDF file.', 'error');
      return;
    }

    const formData = new FormData(form);
    const submitBtn = document.getElementById('rx-submit-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Uploading Prescription...';
    }

    try {
      const response = await fetch(API.PRESCRIPTION_UPLOAD, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showToast('Prescription uploaded successfully! Our pharmacist will review it immediately.', 'success');
        form.reset();
        fetchPharmacistPrescriptions();
      } else {
        showToast(data.message || 'Prescription upload failed.', 'error');
      }
    } catch (error) {
      console.error('Prescription upload error:', error);
      showToast('Network error during upload. Please call 0922142311 directly.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Prescription 📤';
      }
    }
  });
}

// ==========================================
// 7. PHARMACIST DASHBOARD
// ==========================================

async function fetchPharmacistPrescriptions() {
  const list = document.getElementById('rx-dashboard-list');
  if (!list) return;

  try {
    list.innerHTML = '<p style="grid-column: 1/-1; color: #64748b;">Fetching submissions...</p>';

    const res = await fetch(API.PRESCRIPTIONS);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const prescriptions = Array.isArray(data) ? data : (data.data || data.prescriptions || []);

    if (!prescriptions || prescriptions.length === 0) {
      list.innerHTML = '<p style="grid-column: 1/-1; color: #64748b;">No prescription uploads recorded yet.</p>';
      return;
    }

    list.innerHTML = prescriptions.map(rx => {
      const id = rx._id || rx.id;
      const patient = escapeHtml(rx.patientName || 'Anonymous Patient');
      const phone = escapeHtml(rx.phone || 'N/A');
      const notes = rx.notes ? `<p><strong>Notes:</strong> ${escapeHtml(rx.notes)}</p>` : '';
      const date = rx.createdAt ? new Date(rx.createdAt).toLocaleString() : 'Recent';
      const status = rx.status || 'Pending';
      const statusClass = status.toLowerCase();

      // Web path for previewing document
      let fileUrl = '#';
      if (rx.filePath) {
        fileUrl = rx.filePath.startsWith('http') ? rx.filePath : `${API_BASE_URL}/${rx.filePath}`;
      }

      return `
        <div class="rx-card" id="rx-card-${id}">
          <div class="rx-card-header">
            <strong>${patient}</strong>
            <span class="rx-status-badge ${statusClass}">${status}</span>
          </div>
          <div class="rx-card-body">
            <p><strong>📞 Phone:</strong> <a href="tel:${phone}" style="color: #0056b3;">${phone}</a></p>
            <p><strong>📅 Submitted:</strong> ${date}</p>
            ${notes}
          </div>
          <div class="rx-actions">
            ${fileUrl !== '#' ? `<a href="${fileUrl}" target="_blank" class="btn-sm btn-outline">📄 View Document</a>` : ''}
            <select onchange="updatePrescriptionStatus('${id}', this.value)">
              <option value="Pending" ${status === 'Pending' ? 'selected' : ''}>Pending</option>
              <option value="Reviewed" ${status === 'Reviewed' ? 'selected' : ''}>Reviewed</option>
              <option value="Approved" ${status === 'Approved' ? 'selected' : ''}>Approved</option>
              <option value="Fulfilled" ${status === 'Fulfilled' ? 'selected' : ''}>Fulfilled</option>
              <option value="Rejected" ${status === 'Rejected' ? 'selected' : ''}>Rejected</option>
            </select>
          </div>
        </div>
      `;
    }).join('');

  } catch (error) {
    list.innerHTML = `<p style="grid-column: 1/-1; color: #64748b;">Prescription service offline or running local preview.</p>`;
  }
}

async function updatePrescriptionStatus(id, newStatus) {
  try {
    const res = await fetch(`${API.PRESCRIPTIONS}/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      showToast(`Prescription status updated to "${newStatus}"`, 'success');
      fetchPharmacistPrescriptions();
    } else {
      showToast(data.message || 'Failed to update prescription status.', 'error');
    }
  } catch (error) {
    showToast('Network error updating status.', 'error');
  }
}

// ==========================================
// 8. B2B INSTITUTIONAL & CONTACT FORM HANDLERS
// ==========================================

function handleB2BInquiry(event) {
  event.preventDefault();
  const form = document.getElementById('b2b-inquiry-form');
  const institution = document.getElementById('b2b-institution').value;
  const contactName = document.getElementById('b2b-contact-name').value;
  
  showToast(`Thank you, ${contactName}! Institutional quotation for "${institution}" received. Our Senior Liaison will call you shortly.`, 'success');
  if (form) form.reset();
}

function handleContactSubmit(event) {
  event.preventDefault();
  const form = event.target;
  showToast('Thank you! Your message has been sent to Kana Drug Store staff.', 'success');
  if (form) form.reset();
}

// ==========================================
// 9. AUTHENTICATION & USER PORTAL
// ==========================================

function toggleAuthMode(mode) {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  if (mode === 'register') {
    if (loginForm) loginForm.style.display = 'none';
    if (registerForm) registerForm.style.display = 'flex';
  } else {
    if (loginForm) loginForm.style.display = 'flex';
    if (registerForm) registerForm.style.display = 'none';
  }
}

function updateNavAuth() {
  const container = document.getElementById('nav-auth-container');
  if (!container) return;

  if (currentUser && authToken) {
    const displayName = currentUser.fullName || currentUser.email || 'User';
    container.innerHTML = `
      <span class="nav-user" style="color: white; font-size: 0.88rem;">
        👤 <strong>${escapeHtml(displayName)}</strong>
        <a href="javascript:void(0)" onclick="logout()" style="color: #fca5a5; margin-left: 6px; text-decoration: underline;">(Logout)</a>
      </span>
    `;
  } else {
    container.innerHTML = `<a href="#login" class="nav-btn login-btn" id="nav-login-btn">Login</a>`;
  }
}

function setupAuthForms() {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;

      const btn = document.getElementById('login-btn');
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Logging in...';
      }

      try {
        const response = await fetch(API.AUTH_LOGIN, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok && data.token) {
          authToken = data.token;
          currentUser = data.user;
          localStorage.setItem('kana_token', authToken);
          localStorage.setItem('kana_user', JSON.stringify(currentUser));
          updateNavAuth();
          showToast(`Welcome back, ${currentUser.fullName}!`, 'success');
          loginForm.reset();
        } else {
          showToast(data.message || 'Invalid email or password.', 'error');
        }
      } catch (error) {
        console.error('Login error:', error);
        showToast('Network error during login.', 'error');
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Login 🔐';
        }
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fullName = document.getElementById('reg-name').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const phone = document.getElementById('reg-phone') ? document.getElementById('reg-phone').value.trim() : '';
      const password = document.getElementById('reg-password').value;

      const btn = document.getElementById('register-btn');
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Creating Account...';
      }

      try {
        const response = await fetch(API.AUTH_REGISTER, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fullName, email, phone, password })
        });

        const data = await response.json();

        if (response.ok && data.token) {
          authToken = data.token;
          currentUser = data.user;
          localStorage.setItem('kana_token', authToken);
          localStorage.setItem('kana_user', JSON.stringify(currentUser));
          updateNavAuth();
          toggleAuthMode('login');
          showToast(`Account created! Welcome to Kana Drug Store, ${currentUser.fullName}!`, 'success');
          registerForm.reset();
        } else {
          showToast(data.message || 'Registration failed. Please verify your inputs.', 'error');
        }
      } catch (error) {
        console.error('Registration error:', error);
        showToast('Network error during registration.', 'error');
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Create Account 📝';
        }
      }
    });
  }
}

function logout() {
  authToken = null;
  currentUser = null;
  localStorage.removeItem('kana_token');
  localStorage.removeItem('kana_user');
  localStorage.removeItem('careplus_token');
  localStorage.removeItem('careplus_user');
  updateNavAuth();
  showToast('You have been logged out.', 'info');
}

async function checkSession() {
  if (!authToken) return;

  try {
    const res = await fetch(API.AUTH_ME, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (res.ok) {
      const data = await res.json();
      if (data.user) {
        currentUser = data.user;
        localStorage.setItem('kana_user', JSON.stringify(currentUser));
        updateNavAuth();
      }
    } else if (res.status === 401) {
      authToken = null;
      currentUser = null;
      localStorage.removeItem('kana_token');
      localStorage.removeItem('kana_user');
      updateNavAuth();
    }
  } catch (err) {
    console.warn('Session check skipped.');
  }
}

function setupModalDismissListeners() {
  const modal = document.getElementById('checkout-modal');
  if (!modal) return;

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeCheckoutModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display === 'flex') {
      closeCheckoutModal();
    }
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ==========================================
// 10. INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
  renderCart();
  updateNavAuth();
  checkSession();

  setupSearchListener();
  setupCheckoutForm();
  setupPrescriptionForm();
  setupAuthForms();
  setupModalDismissListeners();

  fetchMedicines();
  fetchPharmacistPrescriptions();
});