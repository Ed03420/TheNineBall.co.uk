// checkout.js – safe + cleaned
(() => {
  const cartItemsContainer = document.getElementById('cartItems');
  const totalPriceElem = document.getElementById('totalPrice');
  const stripeBtn = document.getElementById('stripeBtn');
  const nameInput = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const addressInput = document.getElementById('address');

  const cart = JSON.parse(localStorage.getItem('cart') || '[]') || [];

  function renderCart() {
    cartItemsContainer.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
      cartItemsContainer.innerHTML = `<p style="color:#bdbdbd">Your cart is empty.</p>`;
    }

    cart.forEach((item, index) => {
      const price = parseFloat(item.price) || 0;
      total += price;

      const div = document.createElement('div');
      div.className = 'cart-item';
      div.innerHTML = `
        <div class="cart-item-details">
          <p>${escapeHtml(item.name)} ${item.size ? `(${escapeHtml(item.size)})` : ''}</p>
          <p class="cart-item-small">£${price.toFixed(2)}</p>
        </div>
        <button data-index="${index}" type="button">Remove</button>
      `;

      div.querySelector('button').addEventListener('click', () => {
        cart.splice(index, 1);
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCart();
        checkFormFields();
      });

      cartItemsContainer.appendChild(div);
    });

    totalPriceElem.textContent = `Total: £${total.toFixed(2)}`;
  }

  function escapeHtml(str = '') {
    return String(str).replace(/[&<>"'`=\/]/g, s => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '`': '&#96;',
      '/': '&#x2F;'
    })[s]);
  }

  function checkFormFields() {
    const ready =
      nameInput.value.trim() !== '' &&
      emailInput.value.trim() !== '' &&
      addressInput.value.trim() !== '' &&
      cart.length > 0;

    stripeBtn.disabled = !ready;
  }

  [nameInput, emailInput, addressInput].forEach(input =>
    input.addEventListener('input', checkFormFields)
  );

  // Stripe Checkout
  stripeBtn.addEventListener('click', async () => {
    try {
      stripeBtn.disabled = true;
      stripeBtn.textContent = "Redirecting...";

      const total = cart.reduce((s, it) => s + (parseFloat(it.price) || 0), 0);

      const resp = await fetch("http://localhost:3000/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          total,
          customerEmail: emailInput.value.trim(),
          metadata: {
            customerName: nameInput.value.trim(),
            address: addressInput.value.trim(),
            cart: JSON.stringify(cart)
          }
        })
      });

      const data = await resp.json();

      if (!resp.ok) throw new Error(data.error || "Checkout failed");

      window.location.href = data.url;
    } catch (err) {
      alert("Error: " + err.message);
      stripeBtn.textContent = "Pay with Stripe";
      stripeBtn.disabled = false;
    }
  });

  renderCart();
  checkFormFields();
})();
