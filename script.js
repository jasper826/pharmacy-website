/**
 * CarePlus Pharmacy - Frontend Application Logic
 * Integrates UI with Express + MongoDB REST APIs.
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
let cart = JSON.parse(localStorage.getItem('careplus_cart') || '[]');
let currentUser = JSON.parse(localStorage.getItem('careplus_user') || 'null');
let authToken = localStorage.getItem('careplus_token') || null;

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
  }, 4000);
}

// ==========================================
// 3. MEDICINES CATALOG & SEARCH
// ==========================================

async function fetchMedicines(searchTerm = '', category = '') {
  const grid = document.getElementById('medicine-grid');
  if (!grid) return;

  try {
    grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #64748b;">Loading live medicine catalog...</p>';

    let url = API.MEDICINES;
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (category && category !== 'All') params.append('category', category);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await fetch(url);
    const result = await response.json();
    const medicines = result.data || result.medicines || [];

    if (!medicines || medicines.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 2rem; background: #fff; border-radius: 8px; border: 1px dashed #cbd5e1;">
          <p style="color: #64748b; font-size: 1.1rem; margin: 0;">No medicines found matching "<strong>${searchTerm}</strong>".</p>
          <button onclick="clearSearch()" style="margin-top: 10px; padding: 6px 14px; background: #0284c7; color: white; border: none; border-radius: 4px; cursor: pointer;">Show All Medicines</button>
        </div>
      `;
      return;
    }

    grid.innerHTML = medicines.map(med => {
      const price = med.price || 0;
      const img = med.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop';
      const nameEscaped = med.name.replace(/'/g, "\\'");
      
      return `
        <div class="med-card" id="med-${med._id}">
          <img src="${img}" alt="${med.name}" onerror="this.src='https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop'">
          <div>
            <h4>${med.name}</h4>
            <p style="color: #0284c7; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; margin-bottom: 4px;">${med.category || 'General'}</p>
            <p class="price">${price} ETB</p>
            <p>${med.description || 'Quality pharmaceutical product for healthcare needs.'}</p>
            ${med.counselingNotes ? `<p style="font-size: 0.75rem; color: #047857; background: #ecfdf5; padding: 4px 8px; border-radius: 4px; margin-bottom: 8px;">💡 <em>${med.counselingNotes}</em></p>` : ''}
          </div>
          <button class="cart-btn" onclick="addToCart('${nameEscaped}', ${price})">Add to Cart 🛒</button>
        </div>
      `;
    }).join('');

  } catch (error) {
    console.error('Error loading medicines:', error);
    grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #ef4444;">Unable to load medicines from database. Please ensure the backend server is running.</p>';
  }
}

function clearSearch() {
  const searchInput = document.getElementById('search-med');
  if (searchInput) searchInput.value = '';
  fetchMedicines();
}

// Debounced live search listener
let searchTimeout = null;
function setupSearchListener() {
  const searchInput = document.getElementById('search-med');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const val = e.target.value.trim();
    searchTimeout = setTimeout(() => {
      fetchMedicines(val);
    }, 300);
  });
}

// ==========================================
// 4. SHOPPING CART SYSTEM
// ==========================================

function saveCart() {
  localStorage.setItem('careplus_cart', JSON.stringify(cart));
  updateCartBadge();
  renderCart();
}

function updateCartBadge() {
  const badge = document.getElementById('cart-count');
  if (badge) {
    const totalCount = cart.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
    badge.textContent = totalCount;
  }
}

function addToCart(name, price) {
  const existing = cart.find(item => item.name === name);
  if (existing) {
    existing.quantity = (existing.quantity || 1) + 1;
  } else {
    cart.push({
      name,
      price: Number(price) || 0,
      quantity: 1
    });
  }
  saveCart();
  showToast(`Added "${name}" to your cart!`, 'success');
}

function changeQuantity(index, delta) {
  if (cart[index]) {
    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) {
      cart.splice(index, 1);
    }
    saveCart();
  }
}

function removeFromCart(index) {
  if (cart[index]) {
    const name = cart[index].name;
    cart.splice(index, 1);
    saveCart();
    showToast(`Removed "${name}" from cart.`, 'info');
  }
}

function renderCart() {
  const list = document.getElementById('cart-items');
  const totalDisplay = document.getElementById('cart-total');
  if (!list || !totalDisplay) return;

  if (cart.length === 0) {
    list.innerHTML = '<li class="empty-msg">Your cart is currently empty. Add medicines above!</li>';
    totalDisplay.textContent = '0';
    return;
  }

  let grandTotal = 0;
  list.innerHTML = cart.map((item, idx) => {
    const itemTotal = (item.price || 0) * (item.quantity || 1);
    grandTotal += itemTotal;

    return `
      <li class="cart-item-row">
        <div class="cart-item-info">
          <h4>${item.name}</h4>
          <p>${item.price} ETB &times; ${item.quantity} = <strong>${itemTotal} ETB</strong></p>
        </div>
        <div class="cart-item-controls">
          <button type="button" class="qty-btn" onclick="changeQuantity(${idx}, -1)" title="Decrease">&minus;</button>
          <span class="qty-val">${item.quantity}</span>
          <button type="button" class="qty-btn" onclick="changeQuantity(${idx}, 1)" title="Increase">&plus;</button>
          <button type="button" class="remove-btn" onclick="removeFromCart(${idx})" title="Remove item">&times;</button>
        </div>
      </li>
    `;
  }).join('');

  totalDisplay.textContent = grandTotal.toLocaleString();
}

// ==========================================
// 5. CHECKOUT & ORDER SUBMISSION
// ==========================================

function openCheckoutModal() {
  if (cart.length === 0) {
    showToast('Your cart is empty! Please add items before checking out.', 'error');
    return;
  }

  const modal = document.getElementById('checkout-modal');
  const countSpan = document.getElementById('modal-order-count');
  const totalSpan = document.getElementById('modal-order-total');
  
  const totalCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const totalPrice = cart.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);

  if (countSpan) countSpan.textContent = totalCount;
  if (totalSpan) totalSpan.textContent = totalPrice.toLocaleString();

  // Auto-fill user info if logged in
  if (currentUser) {
    const nameInput = document.getElementById('order-name');
    const phoneInput = document.getElementById('order-phone');
    if (nameInput && !nameInput.value) nameInput.value = currentUser.fullName || '';
    if (phoneInput && !phoneInput.value) phoneInput.value = currentUser.phone || '';
  }

  if (modal) modal.style.display = 'flex';
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

    const btn = document.getElementById('confirm-order-btn');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Processing Order...';
    }

    const formData = new FormData(form);
    const orderPayload = {
      customerName: formData.get('customerName'),
      phone: formData.get('phone'),
      deliveryAddress: formData.get('deliveryAddress'),
      paymentMethod: formData.get('paymentMethod'),
      items: cart,
      totalPrice: cart.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0)
    };

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
        cart = [];
        saveCart();
        closeCheckoutModal();
        form.reset();
        showToast('🎉 Order placed successfully! Our pharmacy team is preparing it.', 'success');
      } else {
        showToast(data.message || 'Failed to place order. Please check your details.', 'error');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      showToast('Network error while placing order. Please try again.', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Confirm & Place Order 🚀';
      }
    }
  });
}

// ==========================================
// 6. PRESCRIPTION UPLOAD
// ==========================================

function setupPrescriptionForm() {
  const form = document.querySelector('.prescription-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fileInput = document.getElementById('rx-file');
    if (!fileInput || !fileInput.files[0]) {
      showToast('Please select a prescription file (JPG, PNG, or PDF).', 'error');
      return;
    }

    const btn = document.getElementById('rx-submit-btn') || form.querySelector('button[type="submit"]');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Uploading Prescription...';
    }

    const formData = new FormData(form);

    try {
      const response = await fetch(API.PRESCRIPTION_UPLOAD, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok && (data.success || data.prescription)) {
        showToast('Prescription uploaded successfully! A pharmacist will review it promptly.', 'success');
        form.reset();
        // Refresh pharmacist dashboard if loaded
        fetchPharmacistPrescriptions();
      } else {
        showToast(data.message || 'Failed to upload prescription.', 'error');
      }
    } catch (error) {
      console.error('Prescription upload error:', error);
      showToast('Network error during prescription upload. Please try again.', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Submit Prescription 📤';
      }
    }
  });
}

// ==========================================
// 7. PHARMACIST PRESCRIPTION DASHBOARD
// ==========================================

async function fetchPharmacistPrescriptions() {
  const container = document.getElementById('rx-dashboard-list');
  if (!container) return;

  try {
    container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #64748b;">Loading prescription submissions...</p>';

    const response = await fetch(API.PRESCRIPTIONS);
    const result = await response.json();
    const list = Array.isArray(result) ? result : (result.data || result.prescriptions || []);

    if (!list || list.length === 0) {
      container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #64748b;">No prescription submissions found in database.</p>';
      return;
    }

    container.innerHTML = list.map(rx => {
      const date = rx.createdAt ? new Date(rx.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently';
      const statusClass = (rx.status || 'pending').toLowerCase();
      const fileUrl = `${API_BASE_URL}/${rx.filePath}`;

      return `
        <div class="rx-card" id="rx-item-${rx._id}">
          <div>
            <div class="rx-card-header">
              <h4 style="margin: 0; color: #0f172a; font-size: 1.1rem;">${rx.patientName}</h4>
              <span class="rx-badge ${statusClass}">${rx.status || 'Pending'}</span>
            </div>
            <p style="margin: 4px 0; color: #475569; font-size: 0.9rem;">📞 <strong>Phone:</strong> ${rx.phone}</p>
            <p style="margin: 4px 0; color: #64748b; font-size: 0.8rem;">📅 <strong>Submitted:</strong> ${date}</p>
            ${rx.notes ? `<p style="margin: 8px 0; font-size: 0.85rem; color: #334155; background: #f8fafc; padding: 6px 10px; border-radius: 4px; border-left: 3px solid #0284c7;">📝 ${rx.notes}</p>` : ''}
          </div>
          
          <div class="rx-actions">
            <a href="${fileUrl}" target="_blank" rel="noopener noreferrer" class="btn-sm btn-outline">
              📄 View Document
            </a>
            <select onchange="updatePrescriptionStatus('${rx._id}', this.value)" style="margin-left: auto;">
              <option value="Pending" ${rx.status === 'Pending' ? 'selected' : ''}>Pending</option>
              <option value="Reviewed" ${rx.status === 'Reviewed' ? 'selected' : ''}>Reviewed</option>
              <option value="Approved" ${rx.status === 'Approved' ? 'selected' : ''}>Approved</option>
              <option value="Fulfilled" ${rx.status === 'Fulfilled' ? 'selected' : ''}>Fulfilled</option>
              <option value="Rejected" ${rx.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
            </select>
          </div>
        </div>
      `;
    }).join('');

  } catch (error) {
    console.error('Error fetching pharmacist prescriptions:', error);
    container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #ef4444;">Failed to load prescriptions from backend server.</p>';
  }
}

async function updatePrescriptionStatus(id, newStatus) {
  try {
    const response = await fetch(`${API.PRESCRIPTIONS}/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
      },
      body: JSON.stringify({ status: newStatus })
    });

    const data = await response.json();
    if (response.ok && (data.success || data.prescription)) {
      showToast(`Prescription status updated to ${newStatus}!`, 'success');
      fetchPharmacistPrescriptions();
    } else {
      showToast(data.message || 'Failed to update prescription status.', 'error');
    }
  } catch (error) {
    console.error('Error updating status:', error);
    showToast('Network error updating status.', 'error');
  }
}

// ==========================================
// 8. AUTHENTICATION (LOGIN & REGISTER)
// ==========================================

function toggleAuthMode(mode) {
  const loginForm = document.getElementById('login-form');
  const regForm = document.getElementById('register-form');

  if (mode === 'register') {
    if (loginForm) loginForm.style.display = 'none';
    if (regForm) regForm.style.display = 'block';
  } else {
    if (regForm) regForm.style.display = 'none';
    if (loginForm) loginForm.style.display = 'block';
  }
}

function updateNavAuth() {
  const container = document.getElementById('nav-auth-container');
  if (!container) return;

  if (currentUser && authToken) {
    const firstName = currentUser.fullName ? currentUser.fullName.split(' ')[0] : 'User';
    container.innerHTML = `
      <span class="nav-user">
        👤 <span>${firstName}</span>
        <a href="javascript:void(0)" onclick="logout()" class="logout-link" title="Logout">(Logout)</a>
      </span>
    `;
  } else {
    container.innerHTML = `
      <a href="#login" class="nav-btn login-btn" id="nav-login-btn">Login</a>
    `;
  }
}

function setupAuthForms() {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  // Login Handler
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;

      const btn = document.getElementById('login-btn');
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Authenticating...';
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
          localStorage.setItem('careplus_token', authToken);
          localStorage.setItem('careplus_user', JSON.stringify(currentUser));
          updateNavAuth();
          showToast(`Welcome back, ${currentUser.fullName}!`, 'success');
          loginForm.reset();
        } else {
          showToast(data.message || 'Invalid email or password.', 'error');
        }
      } catch (error) {
        console.error('Login error:', error);
        showToast('Network error during login. Please try again.', 'error');
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Login 🔐';
        }
      }
    });
  }

  // Register Handler
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fullName = document.getElementById('reg-name').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const phone = document.getElementById('reg-phone').value.trim();
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
          localStorage.setItem('careplus_token', authToken);
          localStorage.setItem('careplus_user', JSON.stringify(currentUser));
          updateNavAuth();
          toggleAuthMode('login');
          showToast(`Account created! Welcome to CarePlus, ${currentUser.fullName}!`, 'success');
          registerForm.reset();
        } else {
          showToast(data.message || 'Registration failed. Please verify your inputs.', 'error');
        }
      } catch (error) {
        console.error('Registration error:', error);
        showToast('Network error during registration. Please try again.', 'error');
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
        localStorage.setItem('careplus_user', JSON.stringify(currentUser));
        updateNavAuth();
      }
    } else if (res.status === 401) {
      // Token expired or invalid
      authToken = null;
      currentUser = null;
      localStorage.removeItem('careplus_token');
      localStorage.removeItem('careplus_user');
      updateNavAuth();
    }
  } catch (err) {
    // Keep local cached user if offline
    console.warn('Session check skipped (offline or network error).');
  }
}

function setupModalDismissListeners() {
  const modal = document.getElementById('checkout-modal');
  if (!modal) return;

  // Click outside card to close
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeCheckoutModal();
    }
  });

  // Escape key to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display === 'flex') {
      closeCheckoutModal();
    }
  });
}

// ==========================================
// 9. INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize cart and navigation auth status
  updateCartBadge();
  renderCart();
  updateNavAuth();
  checkSession();

  // 2. Setup forms and event listeners
  setupSearchListener();
  setupCheckoutForm();
  setupPrescriptionForm();
  setupAuthForms();
  setupModalDismissListeners();

  // 3. Initial data fetches
  fetchMedicines();
  fetchPharmacistPrescriptions();
});
