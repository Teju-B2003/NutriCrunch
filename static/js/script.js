let otpVerified = false;

function updateCartCount() {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let count = 0;

    cart.forEach(item => count += item.quantity);

    let cartCount = document.getElementById("cart-count");
    if (cartCount) cartCount.innerText = count;
}

function scrollToProducts() {
    let products = document.getElementById("products");
    if (products) {
        products.scrollIntoView({ behavior: "smooth" });
    }
}

function getCartQty(name) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let item = cart.find(i => i.name === name);
    return item ? item.quantity : 0;
}

function renderCartControls(productId, name, price) {
    let container = document.getElementById("cart-controls-" + productId);
    if (!container) return;

    let qty = getCartQty(name);

    if (qty === 0) {
        container.innerHTML = `
            <button onclick="addToCart('${name}', '${price}', ${productId})">
                Add to Cart
            </button>
        `;
    } else {
        container.innerHTML = `
            <div style="display:flex; justify-content:center; gap:10px; align-items:center;">
                <button onclick="decreaseQty('${name}', ${productId})"
                style="width:35px;height:35px;background:#fb8c00;color:white;border:none;border-radius:8px;">−</button>

                <span style="font-size:20px;font-weight:bold;">${qty}</span>

                <button onclick="increaseQty('${name}', ${productId})"
                style="width:35px;height:35px;background:#2e7d32;color:white;border:none;border-radius:8px;">+</button>
            </div>
        `;
    }
}

function addToCart(name, price, productId = null) {
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

    if (productId) renderCartControls(productId, name, price);
}

function increaseQty(name, productId = null) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    cart.forEach(item => {
        if (item.name === name) item.quantity += 1;
    });

    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
    loadCheckout();

    if (productId) renderCartControls(productId, name);
}

function decreaseQty(name, productId = null) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    cart = cart.map(item => {
        if (item.name === name) item.quantity -= 1;
        return item;
    }).filter(item => item.quantity > 0);

    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
    loadCheckout();

    if (productId) renderCartControls(productId, name);
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
    clearBtn.style.marginBottom = "20px";
    clearBtn.style.background = "#616161";
    clearBtn.style.color = "white";
    clearBtn.style.padding = "8px 14px";
    clearBtn.style.fontSize = "14px";
    clearBtn.style.border = "none";
    clearBtn.style.borderRadius = "8px";
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
                    Qty: ${item.quantity}

                    <button onclick="increaseQty('${item.name}')" 
                    style="background:#2e7d32;color:white;width:35px;height:35px;border:none;border-radius:8px;">+</button>

                    <button onclick="decreaseQty('${item.name}')" 
                    style="background:#fb8c00;color:white;width:35px;height:35px;border:none;border-radius:8px;">−</button>

                    <button onclick="removeItem('${item.name}')" 
                    style="background:#e53935;color:white;width:35px;height:35px;border:none;border-radius:8px;">✕</button>

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
    document.getElementById("otpStatus").innerText = "Your OTP is: " + result.otp;
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
        orderText += item.name + " x " + item.quantity + " = ₹" + (item.price * item.quantity) + "\n";
        total += item.price * item.quantity;
    });

    await fetch("/save_order", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            name, phone, address,
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
