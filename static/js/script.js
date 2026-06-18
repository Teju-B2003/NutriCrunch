let otpVerified = false;

// ================= PAGE LOAD =================
document.addEventListener("DOMContentLoaded", function () {
    updateCartCount();

    document.querySelectorAll("[id^='cart-controls-']").forEach(box => {
        let id = box.id.replace("cart-controls-", "");
        let name = box.dataset.name;
        let price = box.dataset.price;

        if (name && price) {
            renderCartControls(id, name, price);
        }
    });

    loadCheckout();
});

// ================= CART COUNT =================
function updateCartCount() {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let count = cart.reduce((sum, item) => sum + item.quantity, 0);

    let cartCount = document.getElementById("cart-count");
    if (cartCount) cartCount.innerText = count;
}

// ================= MAIN PAGE =================
function renderCartControls(id, name, price) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let item = cart.find(x => x.name === name);

    let box = document.getElementById("cart-controls-" + id);
    if (!box) return;

    if (!item) {
        box.innerHTML = `
            <button onclick="addToCart('${name}', ${price}, '${id}')">
                Add to Cart
            </button>
        `;
    } else {
        box.innerHTML = `
            <div style="display:flex;justify-content:center;align-items:center;gap:12px;">
                <button onclick="decreaseMainQty('${name}','${id}',${price})">−</button>
                <span style="font-size:20px;font-weight:bold;">${item.quantity}</span>
                <button onclick="increaseMainQty('${name}','${id}',${price})">+</button>
            </div>
        `;
    }
}

function addToCart(name, price, id) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let item = cart.find(x => x.name === name);

    if (item) item.quantity++;
    else cart.push({ name, price, quantity: 1 });

    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
    renderCartControls(id, name, price);
}

function increaseMainQty(name, id, price) {
    addToCart(name, price, id);
}

function decreaseMainQty(name, id, price) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    cart = cart.map(item => {
        if (item.name === name) item.quantity--;
        return item;
    }).filter(item => item.quantity > 0);

    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
    renderCartControls(id, name, price);
}

function scrollToProducts() {
    let products = document.getElementById("products");
    if (products) products.scrollIntoView({ behavior: "smooth" });
}

// ================= CHECKOUT =================
function increaseQty(name) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    cart.forEach(item => {
        if (item.name === name) item.quantity++;
    });

    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
    loadCheckout();
}

function decreaseQty(name) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    cart = cart.map(item => {
        if (item.name === name) item.quantity--;
        return item;
    }).filter(item => item.quantity > 0);

    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
    loadCheckout();
}

function removeItem(name) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart = cart.filter(item => item.name !== name);

    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
    loadCheckout();
}

function clearCart() {
    localStorage.removeItem("cart");
    updateCartCount();
    loadCheckout();
}

function loadCheckout() {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let summary = document.getElementById("order-items");
    let totalBox = document.getElementById("total-price");

    if (!summary || !totalBox) return;

    summary.innerHTML = "";

    if (cart.length === 0) {
        summary.innerHTML = "<h3>Cart is empty</h3>";
        totalBox.innerText = "₹0";
        return;
    }

    let total = 0;

    cart.forEach(item => {
        let row = document.createElement("div");
        row.style.marginBottom = "20px";

        row.innerHTML = `
            <div style="display:flex;gap:15px;background:white;padding:15px;border-radius:15px;">
                <div>
                    <strong>${item.name}</strong><br><br>
                    <button onclick="decreaseQty('${item.name}')">−</button>
                    <span style="margin:0 10px;">${item.quantity}</span>
                    <button onclick="increaseQty('${item.name}')">+</button>
                    <button onclick="removeItem('${item.name}')">✕</button>
                    <br><br>
                    <strong>₹${item.price * item.quantity}</strong>
                </div>
            </div>
        `;
        summary.appendChild(row);
        total += item.price * item.quantity;
    });

    totalBox.innerText = "₹" + total;
}

// ================= SEARCH =================
function searchProducts() {
    let input = document.getElementById("searchBox").value.toLowerCase();
    let cards = document.querySelectorAll(".product-card");

    cards.forEach(card => {
        let name = card.querySelector("h3").innerText.toLowerCase();
        card.style.display = name.includes(input) ? "block" : "none";
    });
}
