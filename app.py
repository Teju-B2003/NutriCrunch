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


# ---------------- PRODUCT TABLE ----------------
class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    category = db.Column(db.String(50))
    price = db.Column(db.Integer)
    weight = db.Column(db.String(20))
    stock = db.Column(db.Integer, default=0)
    available = db.Column(db.Boolean, default=True)
    image = db.Column(db.String(200))


# ---------------- BUYER TABLE ----------------
class Buyer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    phone = db.Column(db.String(20), unique=True)
    total_orders = db.Column(db.Integer, default=0)


# ---------------- ORDER TABLE ----------------
class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    customer_name = db.Column(db.String(100))
    phone = db.Column(db.String(20))
    address = db.Column(db.Text)
    items = db.Column(db.Text)
    total = db.Column(db.Integer)
    status = db.Column(db.String(20), default="Pending")


with app.app_context():
    os.makedirs("static/uploads", exist_ok=True)
    db.create_all()

    if Product.query.count() == 0:
        default_products = [
            Product(name="Banana Crisps", category="Fruit Crisps", price=80, weight="80g", stock=20, available=True),
            Product(name="Jackfruit Crisps", category="Fruit Crisps", price=120, weight="80g", stock=20, available=True),
            Product(name="Beetroot Crisps", category="Veggie Crisps", price=90, weight="90g", stock=20, available=True),
            Product(name="Sweet Potato Crisps", category="Veggie Crisps", price=170, weight="90g", stock=20, available=True),
            Product(name="Carrot Crisps", category="Veggie Crisps", price=80, weight="80g", stock=20, available=True),
            Product(name="Ladies Finger Crisps", category="Veggie Crisps", price=110, weight="80g", stock=20, available=True),
            Product(name="Bitterguard Crisps", category="Veggie Crisps", price=100, weight="80g", stock=20, available=True),
        ]
        db.session.add_all(default_products)
        db.session.commit()


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


@app.route("/")
def home():
    products = Product.query.all()
    return render_template(
        "index.html",
        products=products,
        get_product_image=get_product_image
    )


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

    return jsonify({"message": "OTP Sent", "otp": str(otp)})


@app.route("/verify_otp", methods=["POST"])
def verify_otp():
    data = request.get_json()
    otp = data["otp"]
    phone = data["phone"]

    if "otp" in session and session["otp"] == str(otp) and session["otp_phone"] == phone:
        return jsonify({"success": True})

    return jsonify({"success": False})
