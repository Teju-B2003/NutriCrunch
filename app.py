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


# ---------------- MODELS ----------------
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


# ---------------- DB INIT ----------------
with app.app_context():
    os.makedirs("static/uploads", exist_ok=True)
    db.create_all()


def get_product_image(product_name):
    images = {
        "banana": "BANANA.png",
        "beetroot": "BEETROOT.png",
        "bitterguard": "BITTERGUARD.png",
        "carrot": "CARROT.png",
        "jackfruit": "JACKFRUIT.png",
        "ladies finger": "LADIESFINGER.png",
        "sweet potato": "SWEETPOTATO.png"
    }

    name = product_name.lower()
    for key in images:
        if key in name:
            return images[key]

    return "BANANA.png"


# ---------------- ROUTES ----------------
@app.route("/")
def home():
    products = Product.query.all()
    return render_template("index.html", products=products, get_product_image=get_product_image)


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


@app.route("/update_status/<int:order_id>/<status>")
def update_status(order_id, status):
    order = Order.query.get(order_id)

    if order:
        order.status = status
        db.session.commit()

    return redirect("/dashboard")


@app.route("/delete_order/<int:order_id>")
def delete_order(order_id):
    order = Order.query.get(order_id)

    if order:
        db.session.delete(order)
        db.session.commit()

    return redirect("/dashboard")


@app.route("/admin", methods=["GET", "POST"])
def admin():
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]

        if username == "admin" and password == "Nutri@2026":
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

        if image and image.filename != "":
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

    total_orders = len(orders)
    total_products = len(products)
    total_revenue = sum(order.total for order in orders)
    pending_orders = len([o for o in orders if o.status != "Delivered"])

    return render_template(
        "dashboard.html",
        products=products,
        orders=orders,
        buyers=buyers,
        total_orders=total_orders,
        total_products=total_products,
        total_revenue=total_revenue,
        pending_orders=pending_orders
    )


@app.route("/update_product/<int:id>", methods=["POST"])
def update_product(id):
    product = Product.query.get(id)

    if product:
        product.price = int(request.form["price"])
        product.weight = request.form["weight"]
        product.stock = int(request.form["stock"])
        product.available = request.form["available"] == "true"
        db.session.commit()

    return redirect("/dashboard")


@app.route("/logout")
def logout():
    session.pop("admin", None)
    return redirect("/")


if __name__ == "__main__":
    app.run(debug=True)
