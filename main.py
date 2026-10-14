from flask import Flask, render_template, request, jsonify

import smtplib
import os
import re

from spellchecker import SpellChecker

from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage


app = Flask(__name__)

spell = SpellChecker()

UPLOAD_FOLDER = "static/uploads"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# =========================================================
# GENERAL SPELLING CORRECTION
# =========================================================

def correct_spelling(text):

    words = text.split()

    corrected_words = []

    for word in words:

        corrected = spell.correction(word)

        corrected_words.append(
            corrected if corrected else word
        )

    return " ".join(corrected_words)


# =========================================================
# EMAIL NORMALIZATION
# =========================================================

def normalize_email(email):

    if not email:
        return ""

    email = email.lower().strip()

    # Remove spaces
    email = re.sub(r"\s+", "", email)

    # Voice words
    email = email.replace("attherate", "@")
    email = email.replace("at", "@")
    email = email.replace("dot", ".")

    # Common Gmail recognition mistakes
    email = email.replace("gamil", "gmail")
    email = email.replace("gmial", "gmail")
    email = email.replace("gmaiil", "gmail")

    # Common domain mistakes
    email = email.replace("gmailcom", "gmail.com")
    email = email.replace("gmail.con", "gmail.com")

    email = email.replace("yaho.com", "yahoo.com")
    email = email.replace("yaho", "yahoo")

    email = email.replace("hotmai.com", "hotmail.com")
    email = email.replace("hotmai", "hotmail")

    email = email.replace("outlok.com", "outlook.com")
    email = email.replace("outlok", "outlook")

    # Duplicate symbols
    email = re.sub(r"@+", "@", email)
    email = re.sub(r"\.+", ".", email)

    # Fix .@
    email = email.replace(".@", "@")

    # Fix @.
    email = email.replace("@.", "@")

    return email


# =========================================================
# EMAIL FORMAT CHECK
# =========================================================

def is_valid_email(email):

    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"

    return re.match(pattern, email) is not None


# =========================================================
# HOME
# =========================================================
@app.route("/")
def home():
    return render_template("login.html")


@app.route("/login", methods=["POST"])
def login():
    username = request.form.get("username", "")
    password = request.form.get("password", "")

    if username == "admin" and password == "1234":
        return render_template("index.html")

    return render_template(
        "login.html",
        error="Invalid username or password"
    )


@app.route("/success")
def success():
    return render_template("success.html")

# =========================================================
# SPELL CORRECTION
# =========================================================

@app.route("/correct", methods=["POST"])
def correct():

    text = request.form.get("text", "")

    corrected_text = correct_spelling(text)

    return jsonify({

        "corrected": corrected_text

    })


# =========================================================
# SEND EMAIL
# =========================================================

@app.route("/send", methods=["POST"])
def send():

    # -----------------------------------------------------
    # Accept JSON from voice system
    # -----------------------------------------------------

    if request.is_json:

        data = request.get_json()

        receiver_email = data.get("receiver", "")
        subject = data.get("subject", "")
        message = data.get("message", "")

        photo = None

    else:

        # -------------------------------------------------
        # Accept normal form submission also
        # -------------------------------------------------

        receiver_email = request.form.get("email", "")

        subject = request.form.get("subject", "")

        message = request.form.get("message", "")

        photo = request.files.get("photo")


    # -----------------------------------------------------
    # Normalize email
    # -----------------------------------------------------

    receiver_email = normalize_email(
        receiver_email
    )


    # -----------------------------------------------------
    # Validate email
    # -----------------------------------------------------

    if not receiver_email:

        return jsonify({

            "success": False,

            "message":
            "Receiver email is required"

        }), 400


    if not is_valid_email(receiver_email):

        return jsonify({

            "success": False,

            "message":
            "Invalid receiver email address"

        }), 400


    # =====================================================
    # SENDER DETAILS
    # =====================================================

    sender_email ="priya2007devi@gmail.com"

    app_password = os.environ.get("app_password","")


    if not sender_email or not app_password:

        return jsonify({

            "success": False,

            "message":
            "Email configuration is missing"

        }), 500


    # =====================================================
    # CREATE EMAIL
    # =====================================================

    msg = MIMEMultipart()


    msg["From"] = sender_email

    msg["To"] = receiver_email

    msg["Subject"] = subject or ""


    msg.attach(

        MIMEText(
            message or "",
            "plain"
        )

    )


    # =====================================================
    # ATTACH PHOTO
    # =====================================================

    if photo and photo.filename != "":

        image_data = photo.read()

        image = MIMEImage(
            image_data
        )

        image.add_header(

            "Content-Disposition",

            "attachment",

            filename=photo.filename

        )

        msg.attach(image)


    # =====================================================
    # SEND EMAIL
    # =====================================================

    try:

        server = smtplib.SMTP(
            "smtp.gmail.com",
            587
        )

        server.starttls()

        server.login(
            sender_email,
            app_password
        )

        server.send_message(msg)

        server.quit()

        return jsonify({

            "success": True,

            "message": "Email sent successfully"

        })


    except Exception as e:

        print("EMAIL ERROR:", e)

        return jsonify({

            "success": False,

            "message": f"Email error: {str(e)}"

        }), 500

# =========================================================
# RUN
# =========================================================

if __name__ == "__main__":

    app.run(
        debug=True
    )
