// Kana Drug Store - Client Application Logic
// Location: Arba Minch, Ethiopia (In front of Arba Minch General Hospital)
// Operating Hours: 24 Hours / 7 Days a Week

document.addEventListener('DOMContentLoaded', () => {
  // --- 1. State Management ---
  let cart = JSON.parse(localStorage.getItem('kana_cart') || localStorage.getItem('careplus_cart') || '[]');
  let currentUser = JSON.parse(localStorage.getItem('kana_user') || localStorage.getItem('careplus_user') || 'null');
  let authToken = localStorage.getItem('kana_token') || localStorage.getItem('careplus_token') || null;
  let currentSelectedCategory = 'all';

  // --- 2. API Configuration ---
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

  // --- 3. DOM Elements (with resilient multi-selector fallbacks) ---
  const searchInput = document.getElementById('search-input') || document.getElementById('search-med');
  const categoryPills = document.querySelectorAll('.category-pill, .pill');
  const medCards = document.querySelectorAll('.med-card');
  const medicineGrid = document.getElementById('medicine-grid');
  const cartCountEl = document.getElementById('cart-count');
  const cartTotalEl = document.getElementById('cart-total');
  const modalOrderTotalEl = document.getElementById('modal-order-total');
  const modalOrderCountEl = document.getElementById('modal-order-count');
  const cartItemsContainer = document.getElementById('cart-items-container') || document.getElementById('cart-items');
  const cartModal = document.getElementById('cart-modal') || document.getElementById('checkout-modal');
  const openCartBtn = document.getElementById('open-cart-btn') || document.getElementById('open-checkout-btn');
  const closeCartBtn = document.getElementById('close-cart-btn') || document.querySelector('.close-modal-btn');
  const prescriptionForm = document.getElementById('prescription-form') || document.querySelector('.prescription-form');
  const prescriptionInput = document.getElementById('prescription-file') || document.getElementById('rx-file');
  const filePreview = document.getElementById('file-preview');

  // --- 4. Toast Notification Utility ---
  function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast-msg ${type}`;
    
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    toast.innerHTML = `<span>${icon}</span> <span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }

  // Expose showToast globally
  window.showToast = showToast;

  // --- 5. Live Search & Category Filtering ---
  function filterMedicines() {
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const activeCategory = currentSelectedCategory.toLowerCase();

    // 1. Filter existing static DOM cards
    const allMedCards = document.querySelectorAll('.med-card');
    allMedCards.forEach(card => {
      const title = card.querySelector('h4, .med-title')?.innerText.toLowerCase() || '';
      const desc = card.querySelector('p')?.innerText.toLowerCase() || '';
      const categoryText = (card.dataset.category || card.closest('.category-block')?.querySelector('h3')?.innerText || '').toLowerCase();

      const matchesSearch = title.includes(query) || desc.includes(query) || categoryText.includes(query);
      const matchesCategory = activeCategory === 'all' || categoryText.includes(activeCategory);

      if (matchesSearch && matchesCategory) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });

    // 2. Fetch live database matching results if user is actively searching
    if (query.length >= 2 || (activeCategory !== 'all' && activeCategory !== '')) {
      fetchMedicinesFromAPI(query, activeCategory);
    }
  }

  // Debounced search listener
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(filterMedicines, 300);
    });
  }

  // Category Pills Event Listeners
  categoryPills.forEach(pill => {
    pill.addEventListener('click', () => {
      categoryPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      const catAttr = pill.dataset.category || pill.textContent.trim();
      currentSelectedCategory = catAttr === 'All' ? 'all' : catAttr.toLowerCase();
      filterMedicines();
    });
  });

  // Global helper for clear search button
  window.clearSearch = function() {
    if (searchInput) searchInput.value = '';
    currentSelectedCategory = 'all';
    categoryPills.forEach(p => {
      if (p.textContent.trim() === 'All' || p.dataset.category === 'all') {
        p.classList.add('active');
      } else {
        p.classList.remove('active');
      }
    });
    filterMedicines();
  };

  // Global helper for filterByCategory
  window.filterByCategory = function(category) {
    currentSelectedCategory = category === 'All' ? 'all' : category.toLowerCase();
    categoryPills.forEach(pill => {
      const text = pill.textContent.trim();
      if (text.toLowerCase() === category.toLowerCase() || (category === 'All' && text === 'All')) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });
    filterMedicines();
  };

  // Fetch dynamic medicines from MongoDB API
  async function fetchMedicinesFromAPI(searchTerm = '', category = 'all') {
    if (!medicineGrid) return;

    try {
      let url = API.MEDICINES;
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (category && category !== 'all') params.append('category', category);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await fetch(url);
      if (!res.ok) return;

      const data = await res.json();
      const medicines = Array.isArray(data) ? data : (data.data || data.medicines || []);

      if (medicines.length > 0) {
        medicineGrid.innerHTML = medicines.map(med => {
          const price = med.price || 0;
          const name = escapeHtml(med.name || 'Medicine');
          const generic = med.genericName ? `<span class="generic-name">(${escapeHtml(med.genericName)})</span>` : '';
          const catLabel = med.category ? `<span style="font-size: 0.75rem; background: #e0f2fe; color: #0284c7; padding: 2px 8px; border-radius: 12px; font-weight: 600;">${escapeHtml(med.category)}</span>` : '';
          const img = med.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop';
          const desc = med.description ? `<p>${escapeHtml(med.description)}</p>` : '';
          const notes = med.counselingNotes ? `<p style="font-size: 0.78rem; color: #059669; margin-top: 4px;">💡 ${escapeHtml(med.counselingNotes)}</p>` : '';

          return `
            <div class="med-card" data-category="${escapeHtml(med.category || '')}">
              <img src="${img}" alt="${name}" onerror="this.src='https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop'">
              <div style="margin-bottom: 0.5rem;">${catLabel}</div>
              <h4 class="med-title">${name}</h4>
              ${generic}
              <p class="price">${price} ETB</p>
              ${desc}
              ${notes}
              <button class="cart-btn" onclick="addToCart('${name.replace(/'/g, "\\'")}', ${price})">Add to Cart 🛒</button>
            </div>
          `;
        }).join('');
      }
    } catch (err) {
      console.warn('API medicine lookup notice:', err.message);
    }
  }

  // --- 6. Shopping Cart Management ---
  function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
    const totalPrice = cart.reduce((sum, item) => sum + ((Number(item.price) || Number(item.priceETB) || 0) * (Number(item.quantity) || 1)), 0);

    if (cartCountEl) cartCountEl.innerText = totalItems;
    if (cartTotalEl) cartTotalEl.innerText = totalPrice.toLocaleString();
    if (modalOrderTotalEl) modalOrderTotalEl.innerText = totalPrice.toLocaleString();
    if (modalOrderCountEl) modalOrderCountEl.innerText = totalItems;

    if (cartItemsContainer) {
      if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<li class="empty-msg" style="color: #64748b; text-align: center; padding: 1.5rem;">Your shopping cart is empty. Browse our medicines catalog above!</li>';
        if (openCartBtn) openCartBtn.disabled = true;
        return;
      }

      if (openCartBtn) openCartBtn.disabled = false;

      cartItemsContainer.innerHTML = cart.map((item, index) => {
        const itemPrice = Number(item.price) || Number(item.priceETB) || 0;
        const itemTotal = itemPrice * item.quantity;
        return `
          <li style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
            <div style="flex: 1;">
              <strong style="color: #0f172a;">${escapeHtml(item.name)}</strong>
              <div style="color: #64748b; font-size: 0.85rem;">${itemPrice} ETB each</div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px; margin: 0 15px;">
              <button type="button" onclick="changeQuantity(${index}, -1)" style="width: 28px; height: 28px; border-radius: 4px; border: 1px solid #cbd5e1; background: white; cursor: pointer; font-weight: bold;">-</button>
              <span style="font-weight: 700; min-width: 20px; text-align: center;">${item.quantity}</span>
              <button type="button" onclick="changeQuantity(${index}, 1)" style="width: 28px; height: 28px; border-radius: 4px; border: 1px solid #cbd5e1; background: white; cursor: pointer; font-weight: bold;">+</button>
            </div>
            <div style="text-align: right; min-width: 80px;">
              <div style="font-weight: 700; color: #0056b3;">${itemTotal.toLocaleString()} ETB</div>
              <button type="button" onclick="removeFromCart(${index})" style="background: none; border: none; color: #ef4444; font-size: 0.8rem; cursor: pointer; text-decoration: underline; padding: 0;">Remove</button>
            </div>
          </li>
        `;
      }).join('');
    }
  }

  function saveCart() {
    localStorage.setItem('kana_cart', JSON.stringify(cart));
  }

  window.addToCart = function(name, price) {
    const numPrice = Number(price) || 0;
    const existing = cart.find(item => item.name === name);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ name, price: numPrice, priceETB: numPrice, quantity: 1 });
    }
    saveCart();
    updateCartUI();
    showToast(`Added "${name}" to your cart! 🛒`, 'success');
  };

  window.changeQuantity = function(index, delta) {
    if (!cart[index]) return;
    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) {
      cart.splice(index, 1);
    }
    saveCart();
    updateCartUI();
  };

  window.removeFromCart = function(index) {
    if (!cart[index]) return;
    const removed = cart[index].name;
    cart.splice(index, 1);
    saveCart();
    updateCartUI();
    showToast(`Removed "${removed}" from cart.`, 'info');
  };

  // Modal Open / Close Handlers
  window.openCheckoutModal = function() {
    if (cart.length === 0) {
      showToast('Your shopping cart is empty.', 'error');
      return;
    }
    if (cartModal) {
      // Auto fill logged in user
      if (currentUser) {
        const nameInput = document.getElementById('order-name');
        const phoneInput = document.getElementById('order-phone');
        if (nameInput && !nameInput.value) nameInput.value = currentUser.fullName || '';
        if (phoneInput && !phoneInput.value) phoneInput.value = currentUser.phone || '';
      }
      cartModal.style.display = 'flex';
      updateCartUI();
    }
  };

  window.closeCheckoutModal = function() {
    if (cartModal) cartModal.style.display = 'none';
  };

  if (openCartBtn) openCartBtn.addEventListener('click', window.openCheckoutModal);
  if (closeCartBtn) closeCartBtn.addEventListener('click', window.closeCheckoutModal);

  // Close modal when clicking outside card or pressing Escape
  if (cartModal) {
    cartModal.addEventListener('click', (e) => {
      if (e.target === cartModal) window.closeCheckoutModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && cartModal && cartModal.style.display === 'flex') {
      window.closeCheckoutModal();
    }
  });

  // --- 7. Order Placement & Checkout Submission ---
  const checkoutForm = document.getElementById('checkout-form');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (cart.length === 0) {
        showToast('Your cart is empty.', 'error');
        window.closeCheckoutModal();
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
          showToast('Order placed successfully! We will coordinate delivery to your bedside/location shortly.', 'success');
          cart = [];
          saveCart();
          updateCartUI();
          checkoutForm.reset();
          window.closeCheckoutModal();
        } else {
          showToast(data.message || 'Failed to place order. Please check details.', 'error');
        }
      } catch (error) {
        console.error('Order checkout error:', error);
        showToast('Network error while placing order. Call 0922142311 for immediate delivery.', 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Confirm & Place Order 🚀';
        }
      }
    });
  }

  // --- 8. Prescription Upload & File Preview ---
  if (prescriptionInput && filePreview) {
    prescriptionInput.addEventListener('change', () => {
      const file = prescriptionInput.files[0];
      if (file) {
        const sizeKB = Math.round(file.size / 1024);
        filePreview.style.display = 'block';
        filePreview.innerHTML = `📄 <strong>Selected File:</strong> ${escapeHtml(file.name)} (${sizeKB} KB)`;
      } else {
        filePreview.style.display = 'none';
      }
    });
  }

  if (prescriptionForm) {
    prescriptionForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!prescriptionInput || !prescriptionInput.files || prescriptionInput.files.length === 0) {
        showToast('Please select a prescription photo or PDF file.', 'error');
        return;
      }

      const formData = new FormData(prescriptionForm);
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
          prescriptionForm.reset();
          if (filePreview) filePreview.style.display = 'none';
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

  // --- 9. Pharmacist Review Dashboard ---
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

  window.fetchPharmacistPrescriptions = fetchPharmacistPrescriptions;

  window.updatePrescriptionStatus = async function(id, newStatus) {
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
  };

  // --- 10. B2B Institutional & Contact Form Handlers ---
  window.handleB2BInquiry = function(event) {
    event.preventDefault();
    const form = document.getElementById('b2b-inquiry-form');
    const institution = document.getElementById('b2b-institution')?.value || 'Your Institution';
    const contactName = document.getElementById('b2b-contact-name')?.value || 'Partner';
    
    showToast(`Thank you, ${contactName}! Institutional inquiry for "${institution}" received. Our Senior Liaison will contact you shortly.`, 'success');
    if (form) form.reset();
  };

  window.handleContactSubmit = function(event) {
    event.preventDefault();
    const form = event.target;
    showToast('Thank you! Your message has been sent to Kana Drug Store staff.', 'success');
    if (form) form.reset();
  };

  // --- 11. Authentication (Login & Register) ---
  window.toggleAuthMode = function(mode) {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (mode === 'register') {
      if (loginForm) loginForm.style.display = 'none';
      if (registerForm) registerForm.style.display = 'flex';
    } else {
      if (loginForm) loginForm.style.display = 'flex';
      if (registerForm) registerForm.style.display = 'none';
    }
  };

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

  const loginForm = document.getElementById('login-form');
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

  const registerForm = document.getElementById('register-form');
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
          window.toggleAuthMode('login');
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

  window.logout = function() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('kana_token');
    localStorage.removeItem('kana_user');
    localStorage.removeItem('careplus_token');
    localStorage.removeItem('careplus_user');
    updateNavAuth();
    showToast('You have been logged out.', 'info');
  };

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

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- 12. Initial Load ---
  updateCartUI();
  updateNavAuth();
  checkSession();
  fetchMedicinesFromAPI('', 'all');
  fetchPharmacistPrescriptions();
});
