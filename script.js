// CarePlus Pharmacy - Main Client JavaScript

document.addEventListener('DOMContentLoaded', () => {
    // Shopping Cart State
    let cart = [];
    const cartCountEl = document.getElementById('cart-count');
    const cartItemsEl = document.getElementById('cart-items');
    const cartTotalEl = document.getElementById('cart-total');

    // 1. Add to Cart Functionality
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const card = e.target.closest('.medicine-card');
            const id = card.dataset.id || Math.random().toString();
            const name = card.querySelector('h3').innerText;
            const priceText = card.querySelector('.price').innerText;
            const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));

            const existingItem = cart.find(item => item.name === name);
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push({ id, name, price, quantity: 1 });
            }

            updateCartUI();
        });
    });

    // 2. Update Cart UI
    function updateCartUI() {
        // Update item count badge
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        if (cartCountEl) cartCountEl.innerText = totalItems;

        // Render cart items if cart drawer/container exists
        if (cartItemsEl) {
            cartItemsEl.innerHTML = '';
            let totalSum = 0;

            cart.forEach(item => {
                const itemTotal = item.price * item.quantity;
                totalSum += itemTotal;

                const itemRow = document.createElement('div');
                itemRow.className = 'cart-item';
                itemRow.innerHTML = 
                    <span>${item.name} (x${item.quantity})</span>
                    <span>ETB ${itemTotal.toFixed(2)}</span>
                    <button onclick="removeFromCart('${item.name}')" class="remove-btn">&times;</button>
                ;
                cartItemsEl.appendChild(itemRow);
            });

            if (cartTotalEl) cartTotalEl.innerText = ETB ${totalSum.toFixed(2)};
        }
    }

    // Global function to remove items from cart
    window.removeFromCart = function(name) {
        cart = cart.filter(item => item.name !== name);
        updateCartUI();
    };

    // 3. Login Form Handler
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = loginForm.querySelector('input[type="email"]').value;
            const password = loginForm.querySelector('input[type="password"]').value;

            // Placeholder logic (Replace with fetch() once back-end API is ready)
            alert(Logging in with: ${email});
            loginForm.reset();
        });
    }

    // 4. Prescription Upload Form Handler
    const prescriptionForm = document.getElementById('prescription-form');
    if (prescriptionForm) {
        prescriptionForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Placeholder logic (Replace with fetch() once back-end upload route is ready)
            alert('Prescription submitted successfully! Our pharmacist will review it soon.');
            prescriptionForm.reset();
        });
    }
});