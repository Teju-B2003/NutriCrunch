from flask import Flask, render_template, request, redirect, session, jsonify
from flask_sqlalchemy import SQLAlchemy
from werkzeug.utils import secure_filename
import os
import random

app = Flask(__name__)
app.secret_key = "nutricrunch_secret"

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///nutricrunch.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["UPLOAD_FOLDER"] = "static/uploads"

db = SQLAlchemy(app)


# ================= MODELS =================
class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    category = db.Column(db.String(50))
    price = db.Column(db.Integer)
    weight = db.Column(db.String(20))
    stock = db.Column(db.Integer, default=0)
    available = db.Column(db.Boolean, default=True)
    image = db.Column(db.String(200))


class Buyer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    phone = db.Column(db.String(20), unique=True)
    total_orders = db.Column(db.Integer, default=0)


class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    customer_name = db.Column(db.String(100))
    phone = db.Column(db.String(20))
    address = db.Column(db.Text)
    items = db.Column(db.Text)
    total = db.Column(db.Integer)
    status = db.Column(db.String(20), default="Pending")
    
class Blog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200))
    short_desc = db.Column(db.String(500))
    content = db.Column(db.Text)
    image = db.Column(db.String(200))


# ================= DB INIT =================
with app.app_context():
    os.makedirs("static/uploads", exist_ok=True)
    db.create_all()
    if Blog.query.count() == 0:
        blogs = [
            Blog(
                title="Why Dehydrated Snacks Are Better Than Fried Chips",
                short_desc="Healthy snacking with more nutrients and less oil.",
                content="""
    Dehydrated snacks retain natural nutrients and avoid unhealthy frying oils.

    Benefits:
    • Lower fat
    • No preservatives
    • Better digestion
    • Natural taste
                """,
                image="BANANA.png"
            ),
            Blog(
                title="Benefits of Banana Crisps for Kids",
                short_desc="A tasty natural energy snack for children.",
                content="""
    Banana crisps provide potassium, fiber and natural energy.

    Perfect for:
    • School snacks
    • Evening hunger
    • Travel food
                """,
                image="JACKFRUIT.png"
            )
        ]
        db.session.add_all(blogs)
        db.session.commit()

    if Product.query.count() == 0:
        products = [
            Product(name="Banana Crisps", category="Fruit Crisps", price=80, weight="80g", stock=20),
            Product(name="Jackfruit Crisps", category="Fruit Crisps", price=120, weight="80g", stock=20),
            Product(name="Beetroot Crisps", category="Veggie Crisps", price=90, weight="90g", stock=20),
            Product(name="Sweet Potato Crisps", category="Veggie Crisps", price=170, weight="90g", stock=20),
            Product(name="Carrot Crisps", category="Veggie Crisps", price=80, weight="80g", stock=20),
            Product(name="Ladies Finger Crisps", category="Veggie Crisps", price=110, weight="80g", stock=20),
            Product(name="Bitter Gourd Crisps", category="Veggie Crisps", price=100, weight="80g", stock=20),
        ]
        db.session.add_all(products)
        db.session.commit()


def get_product_image(product_name):
    images = {
        "banana": "BANANA.png",
        "jackfruit": "JACKFRUIT.png",
        "beetroot": "BEETROOT.png",
        "sweet potato": "SWEETPOTATO.png",
        "carrot": "CARROT.png",
        "ladies finger": "LADIESFINGER.png",
        "bitter": "BITTERGUARD.png"
    }

    name = product_name.lower()
    for key in images:
        if key in name:
            return images[key]
    return "BANANA.png"


# ================= ROUTES =================
@app.route("/")
def home():
    products = Product.query.all()
    return render_template(
        "index.html",
        products=products,
        get_product_image=get_product_image
    )
@app.route("/blogs")
def blogs():
    all_blogs = Blog.query.all()
    return render_template("blogs.html", blogs=all_blogs)


@app.route("/blog/<int:id>")
def blog_detail(id):
    blog = Blog.query.get_or_404(id)
    return render_template("blog_detail.html", blog=blog)


@app.route("/checkout")
def checkout():
    return render_template("checkout.html")


@app.route("/track")
def track():
    return render_template("track.html")


@app.route("/track_order", methods=["POST"])
def track_order():
    phone = request.form["phone"]
    orders = Order.query.filter_by(phone=phone).all()
    return render_template("track.html", orders=orders)


# ================= OTP =================
@app.route("/send_otp", methods=["POST"])
def send_otp():
    data = request.get_json()
    phone = data["phone"]

    otp = random.randint(1000, 9999)
    session["otp"] = str(otp)
    session["otp_phone"] = phone

    return jsonify({"otp": str(otp)})


@app.route("/verify_otp", methods=["POST"])
def verify_otp():
    data = request.get_json()
    otp = data["otp"]
    phone = data["phone"]

    if "otp" in session and session["otp"] == str(otp) and session["otp_phone"] == phone:
        return jsonify({"success": True})

    return jsonify({"success": False})


# ================= SAVE ORDER =================
@app.route("/save_order", methods=["POST"])
def save_order():
    data = request.get_json()

    buyer = Buyer.query.filter_by(phone=data["phone"]).first()

    if buyer:
        buyer.total_orders += 1
    else:
        buyer = Buyer(
            name=data["name"],
            phone=data["phone"],
            total_orders=1
        )
        db.session.add(buyer)

    order = Order(
        customer_name=data["name"],
        phone=data["phone"],
        address=data["address"],
        items=data["items"],
        total=data["total"],
        status="Pending"
    )

    db.session.add(order)
    db.session.commit()

    return jsonify({"message": "Order Saved"})


# ================= ADMIN =================
@app.route("/admin", methods=["GET", "POST"])
def admin():
    if request.method == "POST":
        if request.form["username"] == "admin" and request.form["password"] == "Nutri@2026":
            session["admin"] = True
            return redirect("/dashboard")

    return render_template("admin_login.html")


@app.route("/dashboard", methods=["GET", "POST"])
def dashboard():
    if "admin" not in session:
        return redirect("/admin")

    if request.method == "POST":
        image = request.files["image"]
        filename = ""

        if image and image.filename:
            filename = secure_filename(image.filename)
            image.save(os.path.join(app.config["UPLOAD_FOLDER"], filename))

        product = Product(
            name=request.form["name"],
            category=request.form["category"],
            price=int(request.form["price"]),
            weight=request.form["weight"],
            stock=int(request.form["stock"]),
            available=request.form["available"] == "true",
            image=filename
        )

        db.session.add(product)
        db.session.commit()

    products = Product.query.all()
    orders = Order.query.all()
    buyers = Buyer.query.all()

    return render_template(
        "dashboard.html",
        products=products,
        orders=orders,
        buyers=buyers,
        total_orders=len(orders),
        total_products=len(products),
        total_revenue=sum(order.total for order in orders),
        pending_orders=len([o for o in orders if o.status != "Delivered"])
    )


@app.route("/update_all_products", methods=["POST"])
def update_all_products():
    product_ids = request.form.getlist("product_id")

    for pid in product_ids:
        product = Product.query.get(int(pid))
        if product:
            product.price = int(request.form[f"price_{pid}"])
            product.weight = request.form[f"weight_{pid}"]
            product.stock = int(request.form[f"stock_{pid}"])
            product.available = request.form[f"available_{pid}"] == "true"

    db.session.commit()
    return redirect("/dashboard")


@app.route("/delete_product/<int:id>")
def delete_product(id):
    product = Product.query.get(id)

    if product:
        db.session.delete(product)
        db.session.commit()

    return redirect("/dashboard")


@app.route("/logout")
def logout():
    session.pop("admin", None)
    return redirect("/")


if __name__ == "__main__":
    app.run(debug=True)
