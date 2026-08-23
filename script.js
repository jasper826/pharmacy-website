// Global Shopping Cart State
let cart = [];

// DOM Content Loaded Initialization
document.addEventListener("DOMContentLoaded", () => {
  // Initialize Cart UI
  updateCartUI();

  // Attach event listener for Live Medicine Search
  const searchInput = document.getElementById("search-med");
  if (searchInput) {
    searchInput.addEventListener("input", handleLiveSearch);
  }

  // Auto-fetch prescriptions for Pharmacist Dashboard if container exists
  if (document.getElementById("rx-dashboard-list")) {
    fetchPharmacistPrescriptions();
  }

  // Attach submit handler for Prescription Upload Form
  const rxForm = document.querySelector(".prescription-form");
  if (rxForm) {
    rxForm.addEventListener("submit", handlePrescriptionUpload);
  }
});

/* =======================================================
   1. SHOPPING CART FUNCTIONS
   ======================================================= */
function addToCart(name, price) {
  const existingItem = cart.find(item => item.name === name);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ name, price, quantity: 1 });
  }
  updateCartUI();
}

function removeFromCart(name) {
  cart = cart.filter(item => item.name !== name);
  updateCartUI();
}

function updateCartUI() {
  const cartCountEl = document.getElementById("cart-count");
  const cartItemsEl = document.getElementById("cart-items");
  const cartTotalEl = document.getElementById("cart-total");

  if (!cartCountEl || !cartItemsEl || !cartTotalEl) return;

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  cartCountEl.textContent = totalItems;
  cartTotalEl.textContent = totalPrice;

  if (cart.length === 0) {
    cartItemsEl.innerHTML = '<li class="empty-msg">Your cart is currently empty. Add medicines above!</li>';
  } else {
    cartItemsEl.innerHTML = cart.map(item => `
      <li style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 5px;">
        <span><strong>${escapeHtml(item.name)}</strong> x ${item.quantity}</span>
        <span>${item.price * item.quantity} ETB 
          <button onclick="removeFromCart('${item.name.replace(/'/g, "\\'")}')" style="background: #dc3545; color: white; border: none; padding: 2px 8px; border-radius: 4px; cursor: pointer; margin-left: 10px;">✕</button>
        </span>
      </li>
    `).join('');
  }
}

/* =======================================================
   2. SHOPPING CART CHECKOUT PROCESSING
   ======================================================= */
async function processCheckout() {
  if (cart.length === 0) {
    alert("Your shopping cart is empty! Add medicines before checking out.");
    return;
  }

  // Prompt user for delivery details
  const customerName = prompt("Enter your Full Name for delivery:");
  if (!customerName) return;

  const phone = prompt("Enter your Phone Number (e.g. +251 911 234 567):");
  if (!phone) return;

  const deliveryAddress = prompt("Enter Delivery Address (Subcity, House No.):");
  if (!deliveryAddress) return;

  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const orderPayload = {
    customerName,
    phone,
    deliveryAddress,
    items: cart,
    totalPrice,
    paymentMethod: "Cash on Delivery"
  };

  try {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderPayload)
    });

    const data = await response.json();

    if (response.ok) {
      alert(`🎉 Order placed successfully! Order ID: ${data.order._id}`);
      cart = []; // Clear cart after successful checkout
      updateCartUI();
    } else {
      alert(`Checkout failed: ${data.message || 'Error processing order'}`);
    }
  } catch (err) {
    console.error("Checkout submission error:", err);
    alert("Network error processing order. Please check backend connection.");
  }
}

/* =======================================================
   3. LIVE MEDICINE SEARCH (MONGODB INTEGRATION)
   ======================================================= */
async function handleLiveSearch(e) {
  const query = e.target.value.trim();
  const grid = document.getElementById("medicine-grid");
  if (!grid) return;

  if (query.length === 0) {
    grid.innerHTML = "";
    return;
  }

  try {
    const res = await fetch(`/api/medicines/search?q=${encodeURIComponent(query)}`);
    const medicines = await res.json();

    if (!medicines.length) {
      grid.innerHTML = `<p style="text-align:center; grid-column: 1/-1;">No medicines found matching "${escapeHtml(query)}"</p>`;
      return;
    }

    grid.innerHTML = medicines.map(med => `
      <div class="med-card" style="border: 1px solid #ddd; padding: 15px; border-radius: 8px; background: #fff;">
        <img src="${med.imageUrl || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop'}" alt="${escapeHtml(med.name)}" style="width: 100%; height: 160px; object-fit: cover; border-radius: 6px;">
        <h4 style="margin: 10px 0 5px;">${escapeHtml(med.name)}</h4>
        <p class="price" style="font-weight: bold; color: #28a745;">${med.price} ETB</p>
        <p style="font-size: 14px; color: #555;">${escapeHtml(med.description || '')}</p>
        <button class="cart-btn" onclick="addToCart('${med.name.replace(/'/g, "\\'")}', ${med.price})" style="width: 100%; padding: 8px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Add to Cart 🛒</button>
      </div>
    `).join('');
  } catch (err) {
    console.error("Search error:", err);
  }
}

/* =======================================================
   4. PRESCRIPTION UPLOAD (PATIENT SUBMISSION)
   ======================================================= */
async function handlePrescriptionUpload(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);

  try {
    const response = await fetch('/api/prescriptions', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    if (response.ok) {
      alert("Prescription submitted successfully! A pharmacist will review it shortly.");
      form.reset();
      fetchPharmacistPrescriptions(); // Refresh list on Dashboard
    } else {
      alert(`Error: ${data.message || 'Failed to upload prescription'}`);
    }
  } catch (err) {
    console.error("Prescription upload error:", err);
    alert("Server error uploading prescription. Please check backend connection.");
  }
}

/* =======================================================
   5. PHARMACIST DASHBOARD (FETCH, DISPLAY & STATUS UPDATES)
   ======================================================= */
async function fetchPharmacistPrescriptions() {
  const container = document.getElementById("rx-dashboard-list");
  if (!container) return;

  container.innerHTML = "<p>Loading prescription submissions...</p>";

  try {
    const res = await fetch('/api/prescriptions');
    if (!res.ok) throw new Error("Failed to load prescriptions.");

    const prescriptions = await res.json();

    if (!prescriptions.length) {
      container.innerHTML = `<p style="grid-column: 1/-1; color: #6c757d; font-style: italic;">No uploaded prescriptions found in queue.</p>`;
      return;
    }

    container.innerHTML = prescriptions.map(rx => renderPrescriptionCard(rx)).join('');
  } catch (err) {
    console.error("Dashboard error:", err);
    container.innerHTML = `<p style="color: red; grid-column: 1/-1;">Failed to fetch prescriptions. Ensure backend server is running.</p>`;
  }
}

function renderPrescriptionCard(rx) {
  const dateStr = rx.createdAt ? new Date(rx.createdAt).toLocaleString() : "N/A";
  const fileUrl = rx.filePath ? `/${rx.filePath}` : "#";

  let statusBg = "#ffc107";
  let statusColor = "#212529";
  if (rx.status === "Approved") { statusBg = "#28a745"; statusColor = "#fff"; }
  else if (rx.status === "Rejected") { statusBg = "#dc3545"; statusColor = "#fff"; }
  else if (rx.status === "Fulfilled") { statusBg = "#17a2b8"; statusColor = "#fff"; }

  return `
    <div class="rx-card" style="background: #ffffff; border: 1px solid #ced4da; border-radius: 8px; padding: 18px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); text-align: left;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <span style="font-weight: bold; font-size: 16px;">👤 ${escapeHtml(rx.patientName || 'Anonymous')}</span>
        <span style="background: ${statusBg}; color: ${statusColor}; font-size: 12px; padding: 4px 10px; border-radius: 12px; font-weight: bold;">
          ${rx.status || 'Pending'}
        </span>
      </div>

      <p style="margin: 4px 0; font-size: 14px;"><strong>📞 Phone:</strong> ${escapeHtml(rx.phone || 'N/A')}</p>
      <p style="margin: 4px 0; font-size: 14px;"><strong>📅 Date:</strong> ${dateStr}</p>
      <p style="margin: 8px 0; font-size: 14px; background: #f8f9fa; padding: 8px; border-radius: 4px; border-left: 3px solid #007bff;">
        <strong>Notes:</strong> ${escapeHtml(rx.notes || 'No additional notes provided.')}
      </p>

      <div style="margin: 12px 0;">
        <a href="${fileUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 6px 12px; background: #e9ecef; color: #495057; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 13px;">
          📄 View Uploaded Prescription Document
        </a>
      </div>

      <div style="margin-top: 15px; border-top: 1px solid #eee; padding-top: 12px;">
        <label style="font-size: 13px; font-weight: bold; display: block; margin-bottom: 6px;">Update Status:</label>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button onclick="updatePrescriptionStatus('${rx._id}', 'Approved')" style="flex: 1; background: #28a745; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 12px;">
            Approve ✓
          </button>
          <button onclick="updatePrescriptionStatus('${rx._id}', 'Fulfilled')" style="flex: 1; background: #17a2b8; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 12px;">
            Fulfill 📦
          </button>
          <button onclick="updatePrescriptionStatus('${rx._id}', 'Rejected')" style="flex: 1; background: #dc3545; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 12px;">
            Reject ✕
          </button>
        </div>
      </div>
    </div>
  `;
}

async function updatePrescriptionStatus(id, newStatus) {
  try {
    const res = await fetch(`/api/prescriptions/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: newStatus })
    });

    const data = await res.json();
    if (res.ok) {
      fetchPharmacistPrescriptions();
    } else {
      alert(`Update failed: ${data.message || 'Error updating status'}`);
    }
  } catch (err) {
    console.error("Status update error:", err);
    alert("Failed to communicate with server to update status.");
  }
}

// Security helper function to escape raw text
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}