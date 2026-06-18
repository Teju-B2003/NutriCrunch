let otpVerified = false;

// ---------------- CART COUNT ----------------
function updateCartCount() {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let count = 0;

    cart.forEach(item => {
        count += item.quantity;
    });

    let cartCount = document.getElementById("cart-count");
    if (cartCount) cartCount.innerText = count;
}

// ---------------- HOME PAGE CONTROLS ----------------
function renderCartControls(id, name, price) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let item = cart.find(x => x.name === name);

    let box = document.getElementById("cart-controls-" + id);
    if (!box) return;

    if (!item) {
        box.innerHTML = `
            <button onclick="addToCart('${name}', '${price}', '${id}')">
                Add to Cart
            </button>
        `;
    } else {
        box.innerHTML = `
            <div style="display:flex;justify-content:center;align-items:center;gap:12px;">
                <button onclick="decreaseMainQty('${name}','${id}','${price}')">−</button>
                <span style="font-size:20px;font-weight:bold;">${item.quantity}</span>
                <button onclick="increaseMainQty('${name}','${id}','${price}')">+</button>
            </div>
        `;
    }
}

function addToCart(name, price, id) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let existing = cart.find(item => item.name === name);

    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({
            name: name,
            price: Number(price),
            quantity: 1
        });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();

    if (id) renderCartControls(id, name, price);
}

function increaseMainQty(name, id, price) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    cart.forEach(item => {
        if (item.name === name) item.quantity += 1;
    });

    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
    renderCartControls(id, name, price);
}

function decreaseMainQty(name, id, price) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    cart = cart.map(item => {
        if (item.name === name) item.quantity -= 1;
        return item;
    }).filter(item => item.quantity > 0);

    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
    renderCartControls(id, name, price);
}

function scrollToProducts() {
    let products = document.getElementById("products");
    if (products) {
        products.scrollIntoView({ behavior: "smooth" });
    }
}

// ---------------- CHECKOUT ----------------
function increaseQty(name) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    cart.forEach(item => {
        if (item.name === name) item.quantity += 1;
    });

    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
    loadCheckout();
}

function decreaseQty(name) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    cart = cart.map(item => {
        if (item.name === name) item.quantity -= 1;
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

    if (!summary) return;

    summary.innerHTML = "";

    if (cart.length === 0) {
        summary.innerHTML = "<h3>Cart is empty</h3>";
        totalBox.innerText = "₹0";
        return;
    }

    let clearBtn = document.createElement("button");
    clearBtn.innerText = "Empty Cart";
    clearBtn.onclick = clearCart;
    summary.appendChild(clearBtn);

    let total = 0;

    cart.forEach(item => {
        let row = document.createElement("div");
        row.style.marginBottom = "20px";

        let imageName = item.name
            .toUpperCase()
            .replace(" CRISPS", "")
            .replace(" ", "") + ".png";

        row.innerHTML = `
            <div style="display:flex; gap:15px; align-items:center; background:white; padding:15px; border-radius:15px;">
                <img src="/static/images/${imageName}" 
                     style="width:90px;height:90px;object-fit:cover;border-radius:12px;">

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

// ---------------- OTP ----------------
async function sendOTP() {
    let phone = document.getElementById("customerPhone").value;

    if (!phone) {
        alert("Enter phone number first");
        return;
    }

    let response = await fetch("/send_otp", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ phone: phone })
    });

    let result = await response.json();
    document.getElementById("otpStatus").innerText =
        "Your OTP is: " + result.otp;
}

async function verifyOTP() {
    let phone = document.getElementById("customerPhone").value;
    let otp = document.getElementById("otpBox").value;

    let response = await fetch("/verify_otp", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ phone, otp })
    });

    let result = await response.json();

    if (result.success) {
        otpVerified = true;
        document.getElementById("otpStatus").innerText = "OTP Verified ✅";
        document.getElementById("placeOrderBtn").disabled = false;
    } else {
        otpVerified = false;
        document.getElementById("otpStatus").innerText = "Wrong OTP ❌";
    }
}

// ---------------- PLACE ORDER ----------------
async function placeOrder() {
    if (!otpVerified) {
        alert("Verify OTP first");
        return;
    }

    let name = document.getElementById("customerName").value;
    let phone = document.getElementById("customerPhone").value;
    let address = document.getElementById("customerAddress").value;

    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    if (cart.length === 0) {
        alert("Cart is empty");
        return;
    }

    let total = 0;
    let orderText = "";

    cart.forEach(item => {
        orderText += `${item.name} x ${item.quantity} = ₹${item.price * item.quantity}\n`;
        total += item.price * item.quantity;
    });

    await fetch("/save_order", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            name,
            phone,
            address,
            items: orderText,
            total
        })
    });

    localStorage.removeItem("cart");
    updateCartCount();

    let message =
        "New NutriCrunch Order%0A%0A" +
        "Name: " + name + "%0A" +
        "Phone: " + phone + "%0A" +
        "Address: " + address + "%0A%0A" +
        "Items:%0A" +
        encodeURIComponent(orderText) +
        "%0ATotal: ₹" + total;

    window.open("https://wa.me/918660586938?text=" + message, "_blank");
}
