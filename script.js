let cart = [];
let total = 0;

function addToCart(itemName, itemPrice) {
  cart.push({ name: itemName, price: itemPrice });
  total += itemPrice;
  updateCartUI();
}

function updateCartUI() {
  const cartCount = document.getElementById('cart-count');
  const cartList = document.getElementById('cart-items');
  const cartTotal = document.getElementById('cart-total');

  cartCount.innerText = cart.length;
  cartTotal.innerText = total;

  if (cart.length === 0) {
    cartList.innerHTML = '<li class="empty-msg">Your cart is currently empty. Add medicines above!</li>';
  } else {
    cartList.innerHTML = '';
    cart.forEach((item) => {
      const li = document.createElement('li');
      li.className = 'cart-item-row';
      li.innerHTML = <span>${item.name}</span> <strong>${item.price} ETB</strong>;
      cartList.appendChild(li);
    });
  }
}