function renderCart() {
cartItemsContainer.innerHTML = '';
let total = 0;


if (cart.length === 0) {
cartItemsContainer.innerHTML = `<p style="color:#777">Your cart is empty.</p>`;
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


function checkFormFields() {
stripeBtn.disabled = !(
nameInput.value.trim() &&
emailInput.value.trim() &&
addressInput.value.trim() &&
cart.length > 0
);
}


[nameInput, emailInput, addressInput].forEach(input =>
input.addEventListener('input', checkFormFields)
);


stripeBtn.addEventListener('click', async () => {
try {
stripeBtn.disabled = true;
stripeBtn.textContent = "Redirecting...";


const total = cart.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);


const response = await fetch("https://api.thenineball.co.uk/api/create-checkout", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({
total,
customerEmail: emailInput.value.trim(),
metadata: {
name: nameInput.value.trim(),
address: addressInput.value.trim(),
cart: JSON.stringify(cart)
}
})
});


const data = await response.json();
if (!response.ok) throw new Error(data.error || "Checkout failed");


window.location.href = data.url;


} catch (err) {
alert("Error: " + err.message);
stripeBtn.disabled = false;
stripeBtn.textContent = "Pay with Stripe";
}
});


renderCart();
checkFormFields();
