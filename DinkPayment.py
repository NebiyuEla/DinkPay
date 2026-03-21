import telebot
from telebot.types import InlineKeyboardMarkup, InlineKeyboardButton, ReplyKeyboardMarkup, KeyboardButton
import os
import requests
import sqlite3
import threading
import time
from datetime import datetime
import re

API_KEY = os.getenv("TELEGRAM_BOT_TOKEN", '7386222393:AAExxab6EuZPOQNe0yZRu1AJ9L9iMldeE5E')
CHANNEL_USERNAME = os.getenv("CHANNEL_USERNAME", '@DinkPay')
ADMIN_ID = int(os.getenv("BOT_ADMIN_ID", "6336824594"))
EXCHANGE_API_URL = os.getenv("EXCHANGE_API_URL", "https://v6.exchangerate-api.com/v6/b8f03bdbd9837d39dbb13d6e/latest/USD")
BACKEND_API_URL = os.getenv("BACKEND_API_URL", "http://localhost:5000/api").rstrip("/")
BOT_SYNC_TOKEN = os.getenv("BOT_SYNC_TOKEN", "local-dink-bot-sync")
BACKEND_SYNC_INTERVAL_SECONDS = 12
BACKEND_SYNC_PUSH_MESSAGES = os.getenv("BACKEND_SYNC_PUSH_MESSAGES", "false").lower() == "true"

EXCHANGE_RATES = {
    "tier1": {"max": 50, "rate": 205},
    "tier2": {"max": 100, "rate": 200},
    "tier3": {"max": float('inf'), "rate": 195}
}

EUR_TO_USD_RATE = 0.8202
EUR_FEE = 1.5

conn = sqlite3.connect("dinkpay.db", check_same_thread=False)
cursor = conn.cursor()
backend_notification_cache = set()

cursor.execute("""
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE,
    username TEXT,
    phone TEXT,
    language TEXT DEFAULT 'EN',
    joined_date TEXT,
    last_active TEXT
)
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    customer_name TEXT,
    website TEXT,
    login_detail TEXT,
    amount_original REAL,
    currency TEXT,
    fee_applied REAL,
    amount_usd REAL,
    amount_etb TEXT,
    comment TEXT,
    status TEXT DEFAULT 'pending',
    date TEXT,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
)
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT,
    message TEXT,
    type TEXT DEFAULT 'info',
    is_read INTEGER DEFAULT 0,
    date TEXT,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
)
""")

try:
    cursor.execute("ALTER TABLE payments ADD COLUMN admin_note TEXT")
except sqlite3.OperationalError:
    pass
conn.commit()

def register_user(user_id, username):
    try:
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cursor.execute("""
            INSERT OR IGNORE INTO users (user_id, username, joined_date, last_active) 
            VALUES (?, ?, ?, ?)
        """, (user_id, username, now, now))
        conn.commit()
    except:
        pass

def update_last_active(user_id):
    try:
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cursor.execute("UPDATE users SET last_active = ? WHERE user_id = ?", (now, user_id))
        conn.commit()
    except:
        pass

def is_user_in_channel(user_id):
    try:
        member = bot.get_chat_member(CHANNEL_USERNAME, user_id)
        return member.status in ['member', 'administrator', 'creator']
    except:
        return False

def save_payment(user_id, customer_name, website, login_detail, amount_original, currency, fee_applied, amount_usd, amount_etb, comment):
    try:
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cursor.execute("""
            INSERT INTO payments 
            (user_id, customer_name, website, login_detail, amount_original, currency, fee_applied, amount_usd, amount_etb, comment, date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (user_id, customer_name, website, login_detail, amount_original, currency, fee_applied, amount_usd, amount_etb, comment, now))
        conn.commit()
        return cursor.lastrowid
    except Exception as e:
        print(f"Error saving payment: {e}")
        return None

def save_notification(user_id, title, message, notification_type='info'):
    try:
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cursor.execute("""
            INSERT INTO notifications (user_id, title, message, type, date)
            VALUES (?, ?, ?, ?, ?)
        """, (user_id, title, message, notification_type, now))
        conn.commit()
        return True
    except Exception as e:
        print(f"Error saving notification: {e}")
        return False

def get_user_notifications(user_id, limit=8):
    cursor.execute("""
        SELECT title, message, type, date
        FROM notifications
        WHERE user_id = ?
        ORDER BY id DESC
        LIMIT ?
    """, (user_id, limit))
    return cursor.fetchall()

def get_user_services(user_id, limit=8):
    cursor.execute("""
        SELECT id, customer_name, website, amount_etb, status, date
        FROM payments
        WHERE user_id = ?
        ORDER BY id DESC
        LIMIT ?
    """, (user_id, limit))
    return cursor.fetchall()

def update_payment_status(payment_id, status, admin_note=''):
    cursor.execute("SELECT user_id, website, customer_name FROM payments WHERE id = ?", (payment_id,))
    payment = cursor.fetchone()
    if not payment:
        return False

    user_id, website, customer_name = payment
    cursor.execute(
        "UPDATE payments SET status = ?, admin_note = ? WHERE id = ?",
        (status, admin_note, payment_id)
    )
    conn.commit()

    title_map = {
        'paid': 'Payment Confirmed',
        'completed': 'Service Completed',
        'processing': 'Service Activated',
        'failed': 'Payment Failed'
    }

    message_map = {
        'paid': f"Your payment for {website} ({customer_name}) has been confirmed.",
        'completed': f"Your {website} service for {customer_name} has been completed.",
        'processing': f"Your {website} service for {customer_name} is now being processed.",
        'failed': f"Your payment for {website} ({customer_name}) needs attention."
    }

    title = title_map.get(status, 'Payment Update')
    message = message_map.get(status, f"Your payment #{payment_id} status is now {status}.")
    if admin_note:
        message = f"{message}\nNote: {admin_note}"

    save_notification(user_id, title, message, 'success' if status in ['paid', 'processing', 'completed'] else 'info')

    try:
        bot.send_message(user_id, f"🔔 {title}\n\n{message}")
    except Exception as e:
        print(f"Error sending bot notification: {e}")

    return True

def backend_request_json(path, method="GET", params=None, payload=None):
    try:
        response = requests.request(
            method,
            f"{BACKEND_API_URL}{path}",
            headers={"x-bot-token": BOT_SYNC_TOKEN},
            params=params,
            json=payload,
            timeout=10
        )
        data = response.json() if response.text else {}
        if response.ok and data.get("success"):
            return data
    except Exception as e:
        print(f"Backend request error ({method} {path}): {e}")
    return None

def fetch_backend_json(path, params=None):
    return backend_request_json(path, params=params)

def get_backend_user_services(user_id, limit=8):
    data = fetch_backend_json(f"/bot/users/{user_id}/orders", {"limit": limit})
    return data.get("orders", []) if data else []

def get_backend_user_notifications(user_id, limit=8):
    data = fetch_backend_json(f"/bot/users/{user_id}/notifications", {"limit": limit})
    return data.get("notifications", []) if data else []

def get_backend_user_access(user_id):
    data = fetch_backend_json(f"/bot/users/{user_id}/access")
    return data.get("access", {}) if data else {}

def parse_start_param(text):
    parts = str(text or "").split(maxsplit=1)
    return parts[1].strip() if len(parts) > 1 else ""

def register_bot_start_with_backend(message, start_param=""):
    return backend_request_json(
        f"/bot/users/{message.from_user.id}/start",
        method="POST",
        payload={
            "username": message.from_user.username or "",
            "firstName": message.from_user.first_name or "",
            "lastName": message.from_user.last_name or "",
            "startParam": start_param or ""
        }
    )

def require_backend_access(message, allow_start=False):
    user_id = message.from_user.id
    access = get_backend_user_access(user_id)
    if not access:
        return True

    if access.get("banned"):
        reason = str(access.get("reason") or "").strip() or "Please contact @DinkPayAdmin for help."
        bot.send_message(
            user_id,
            f"⛔ Access to the Dink Pay bot is currently blocked.\n\n{reason}",
            reply_markup=get_main_keyboard()
        )
        return False

    if access.get("startRequired") and not allow_start:
        bot.send_message(
            user_id,
            "🔄 Please send /start again to continue using the Dink Pay bot.",
            reply_markup=get_main_keyboard()
        )
        return False

    return True

def get_payment_label(status):
    if status == "paid":
        return "Paid"
    if status == "failed":
        return "Failed"
    if status == "refunded":
        return "Refunded"
    return "Payment Check"

def get_service_status(order):
    status = (order.get("status") or "pending").lower()
    payment_status = (order.get("paymentStatus") or "pending").lower()

    if status == "cancelled":
        return "Cancelled"
    if status == "completed":
        return "Completed"
    if status == "processing":
        return "Processing"
    if payment_status != "paid":
        return "Payment Check"
    return "Pending"

def get_registered_user_ids():
    try:
        rows = conn.execute("SELECT user_id FROM users").fetchall()
        return [row[0] for row in rows]
    except Exception as e:
        print(f"User sync read error: {e}")
        return []

def build_backend_notification_key(user_id, notification):
    notification_id = notification.get("_id")
    if notification_id:
        return f"{user_id}:{notification_id}"

    created_at = str(notification.get("createdAt", ""))
    title = str(notification.get("title", ""))
    message = str(notification.get("message", ""))
    return f"{user_id}:{created_at}:{title}:{message}"

def sync_backend_notifications_once(send_messages=False):
    for user_id in get_registered_user_ids():
        backend_notifications = get_backend_user_notifications(user_id, limit=10)
        if not backend_notifications:
            continue

        for notification in reversed(backend_notifications):
            cache_key = build_backend_notification_key(user_id, notification)
            if cache_key in backend_notification_cache:
                continue

            backend_notification_cache.add(cache_key)

            if not send_messages:
                continue

            title = notification.get("title", "Update")
            message = notification.get("message", "")
            notification_type = notification.get("type", "info")
            prefix = "✅" if notification_type == "success" else "⚠️" if notification_type == "error" else "🔔"

            try:
                bot.send_message(user_id, f"{prefix} {title}\n\n{message}")
            except Exception as e:
                print(f"Backend notification delivery error for {user_id}: {e}")

def run_backend_notification_sync():
    sync_backend_notifications_once(send_messages=False)

    while True:
        try:
            sync_backend_notifications_once(send_messages=BACKEND_SYNC_PUSH_MESSAGES)
        except Exception as e:
            print(f"Backend notification sync loop error: {e}")
        time.sleep(BACKEND_SYNC_INTERVAL_SECONDS)

def convert_to_etb(amount, currency):
    try:
        response = requests.get(EXCHANGE_API_URL).json()
        
        if currency == 'EUR':
            amount_with_fee = amount + EUR_FEE
            amount_usd = amount_with_fee / EUR_TO_USD_RATE
            original_amount_usd = amount / EUR_TO_USD_RATE
            fee_usd = EUR_FEE / EUR_TO_USD_RATE
        else:
            if currency == 'USD':
                amount_usd = amount
                original_amount_usd = amount
                amount_with_fee = amount
                fee_usd = 0
            else:
                usd_rate = response['conversion_rates'].get(currency)
                if not usd_rate:
                    return None
                amount_usd = amount / usd_rate
                original_amount_usd = amount_usd
                amount_with_fee = amount
                fee_usd = 0
        
        if amount_usd <= EXCHANGE_RATES["tier1"]["max"]:
            rate = EXCHANGE_RATES["tier1"]["rate"]
            tier = "Tier 1 ($1-$50)"
        elif amount_usd <= EXCHANGE_RATES["tier2"]["max"]:
            rate = EXCHANGE_RATES["tier2"]["rate"]
            tier = "Tier 2 ($51-$100)"
        else:
            rate = EXCHANGE_RATES["tier3"]["rate"]
            tier = "Tier 3 ($100+)"
        
        amount_etb = amount_usd * rate
        
        return {
            'original_amount': amount,
            'currency': currency,
            'amount_with_fee': round(amount_with_fee, 2) if currency == 'EUR' else amount,
            'fee_applied': EUR_FEE if currency == 'EUR' else 0,
            'fee_usd': round(fee_usd, 2),
            'amount_usd': round(amount_usd, 2),
            'original_usd': round(original_amount_usd, 2),
            'etb': round(amount_etb, 2),
            'rate': rate,
            'tier': tier,
            'formatted': f"{amount_etb:,.0f} ETB"
        }
    except:
        return None

def parse_amount_input(text):
    try:
        text = text.strip().upper()
        pattern = r'^(\d+(?:\.\d+)?)\s*([A-Z]{3})$'
        match = re.match(pattern, text)
        
        if match:
            amount = float(match.group(1))
            currency = match.group(2)
            return amount, currency
        return None, None
    except:
        return None, None

def get_main_keyboard():
    keyboard = ReplyKeyboardMarkup(row_width=2, resize_keyboard=True)
    keyboard.add(
        KeyboardButton("💱 Check Rate"),
        KeyboardButton("📋 Services")
    )
    keyboard.add(
        KeyboardButton("❓ Help"),
        KeyboardButton("📞 Contact Admin")
    )
    return keyboard

def get_cancel_keyboard():
    keyboard = ReplyKeyboardMarkup(resize_keyboard=True)
    keyboard.add(KeyboardButton("❌ Cancel"))
    return keyboard

bot = telebot.TeleBot(API_KEY)

@bot.message_handler(commands=['start'])
def start_command(message):
    user_id = message.from_user.id
    username = message.from_user.username or "NoUsername"
    start_param = parse_start_param(message.text)
    
    register_user(user_id, username)
    update_last_active(user_id)

    backend_start = register_bot_start_with_backend(message, start_param)
    backend_access = (backend_start or {}).get("access", {})
    if backend_access.get("banned"):
        reason = str(backend_access.get("reason") or "").strip() or "Please contact @DinkPayAdmin for help."
        bot.send_message(
            user_id,
            f"⛔ Access to the Dink Pay bot is currently blocked.\n\n{reason}",
            reply_markup=get_main_keyboard()
        )
        return
    
    if not is_user_in_channel(user_id):
        markup = InlineKeyboardMarkup()
        join_button = InlineKeyboardButton(
            "📢 Join Our Channel", 
            url=f"https://t.me/{CHANNEL_USERNAME[1:]}"
        )
        markup.add(join_button)
        
        bot.send_message(
            user_id, 
            "🔔 You must join our channel first!\n\n👇 Click below to join:",
            reply_markup=markup
        )
        return
    
    welcome = f"""
🌟 Welcome {message.from_user.first_name}!

I'm your payment assistant. Here's what I can do:

💱 Check Rate - See how much you'll get
📋 Services - View our services & location
📞 Contact - Get admin help

You'll still receive mini app order updates, admin broadcasts, and payment alerts right here automatically.

📊 Current Rates (Dec 13, 2025):
• $1-$50 → 205 ETB per USD
• $51-$100 → 200 ETB per USD
• $100+ → 195 ETB per USD

💶 EUR Transactions:
• Fixed fee: 1.5 EUR
• Rate: 1 USD = 0.8202 EUR

Select an option below to begin 👇
    """
    
    bot.send_message(user_id, welcome, reply_markup=get_main_keyboard())

@bot.message_handler(func=lambda msg: msg.text == "💳 Start Payment")
def start_payment(message):
    user_id = message.from_user.id
    update_last_active(user_id)

    if not require_backend_access(message):
        return
    
    if not is_user_in_channel(user_id):
        bot.send_message(user_id, "❌ Please join our channel first! Use /start")
        return
    
    msg = bot.send_message(
        user_id,
        "📝 Step 1/4: Enter customer name\n\nExample: John Doe",
        reply_markup=get_cancel_keyboard()
    )
    bot.register_next_step_handler(msg, process_name)

def process_name(message):
    user_id = message.from_user.id
    
    if message.text == "❌ Cancel":
        bot.send_message(user_id, "❌ Cancelled", reply_markup=get_main_keyboard())
        return
    
    if not message.text or len(message.text.strip()) < 2:
        msg = bot.send_message(user_id, "❌ Please enter a valid name (at least 2 characters):", reply_markup=get_cancel_keyboard())
        bot.register_next_step_handler(msg, process_name)
        return
    
    customer_name = message.text.strip()
    
    msg = bot.send_message(
        user_id,
        f"📝 Step 2/4: Enter website link for {customer_name}\n\nExample: https://example.com",
        reply_markup=get_cancel_keyboard()
    )
    bot.register_next_step_handler(msg, process_website, customer_name)

def process_website(message, customer_name):
    user_id = message.from_user.id
    
    if message.text == "❌ Cancel":
        bot.send_message(user_id, "❌ Cancelled", reply_markup=get_main_keyboard())
        return
    
    if not message.text or not (message.text.startswith('http://') or message.text.startswith('https://') or '.' in message.text):
        msg = bot.send_message(user_id, "❌ Please enter a valid website link:", reply_markup=get_cancel_keyboard())
        bot.register_next_step_handler(msg, process_website, customer_name)
        return
    
    website = message.text.strip()
    
    msg = bot.send_message(
        user_id,
        f"📝 Step 3/4: Enter login details for {customer_name}\n\nExample: username:password or email@example.com",
        reply_markup=get_cancel_keyboard()
    )
    bot.register_next_step_handler(msg, process_login, customer_name, website)

def process_login(message, customer_name, website):
    user_id = message.from_user.id
    
    if message.text == "❌ Cancel":
        bot.send_message(user_id, "❌ Cancelled", reply_markup=get_main_keyboard())
        return
    
    if not message.text or len(message.text.strip()) < 3:
        msg = bot.send_message(user_id, "❌ Please enter valid login details:", reply_markup=get_cancel_keyboard())
        bot.register_next_step_handler(msg, process_login, customer_name, website)
        return
    
    login_details = message.text.strip()
    
    msg = bot.send_message(
        user_id,
        f"📝 Step 4/4: Enter amount and currency\n\nExamples: 50 USD • 30 EUR • 100 GBP\n\nRates:\n• $1-50: 205 ETB/USD\n• $51-100: 200 ETB/USD\n• $100+: 195 ETB/USD\n\nEUR: +1.5 fee",
        reply_markup=get_cancel_keyboard()
    )
    bot.register_next_step_handler(msg, process_amount, customer_name, website, login_details)

def process_amount(message, customer_name, website, login_details):
    user_id = message.from_user.id
    
    if message.text == "❌ Cancel":
        bot.send_message(user_id, "❌ Cancelled", reply_markup=get_main_keyboard())
        return
    
    amount, currency = parse_amount_input(message.text)
    
    if not amount or not currency:
        msg = bot.send_message(
            user_id,
            "❌ Invalid format!\n\nUse: 50 USD, 30 EUR, etc.\n\nTry again:",
            reply_markup=get_cancel_keyboard()
        )
        bot.register_next_step_handler(msg, process_amount, customer_name, website, login_details)
        return
    
    if currency not in ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'AUD', 'CAD', 'CHF']:
        msg = bot.send_message(
            user_id,
            "❌ Currency not supported!\n\nSupported: USD, EUR, GBP, JPY, CNY, AUD, CAD, CHF\n\nTry again:",
            reply_markup=get_cancel_keyboard()
        )
        bot.register_next_step_handler(msg, process_amount, customer_name, website, login_details)
        return
    
    conversion = convert_to_etb(amount, currency)
    
    if not conversion:
        bot.send_message(
            user_id,
            "❌ Conversion failed. Please try again later.",
            reply_markup=get_main_keyboard()
        )
        return
    
    if currency == 'EUR':
        details = f"""
💶 Amount: {amount} EUR
➕ Fee: +{EUR_FEE} EUR
💰 Total: {conversion['amount_with_fee']} EUR
💵 USD Value: ${conversion['amount_usd']}
📊 Rate: {conversion['rate']} ETB/USD
💵 You get: {conversion['formatted']}
        """
    else:
        details = f"""
💵 Amount: {amount} {currency}
💲 USD Value: ${conversion['amount_usd']}
📊 Rate: {conversion['rate']} ETB/USD
💰 You get: {conversion['formatted']}
        """
    
    msg = bot.send_message(
        user_id,
        f"📝 Add a comment (or type 'skip'):\n\n{details}",
        reply_markup=get_cancel_keyboard()
    )
    bot.register_next_step_handler(msg, process_comment, customer_name, website, login_details, amount, currency, conversion)

def process_comment(message, customer_name, website, login_details, amount, currency, conversion):
    user_id = message.from_user.id
    
    if message.text == "❌ Cancel":
        bot.send_message(user_id, "❌ Cancelled", reply_markup=get_main_keyboard())
        return
    
    comment = "No comments" if message.text.lower() == 'skip' else message.text
    
    # Save to database
    payment_id = None
    try:
        payment_id = save_payment(
            user_id, 
            customer_name, 
            website, 
            login_details, 
            amount, 
            currency, 
            conversion['fee_applied'],
            conversion['amount_usd'],
            conversion['formatted'],
            comment
        )
    except Exception as e:
        print(f"Database error: {e}")

    if payment_id:
        save_notification(
            user_id,
            "Payment Request Submitted",
            f"Your payment request for {website} has been recorded and is waiting for confirmation.",
            "info"
        )
    
    if currency == 'EUR':
        summary = f"""
📋 PAYMENT SUMMARY

👤 Customer: {customer_name}
🌐 Website: {website}
🔑 Login: {login_details}

💶 Amount: {amount} EUR
➕ Fee: +{EUR_FEE} EUR
💰 Total EUR: {conversion['amount_with_fee']} EUR
💵 USD: ${conversion['amount_usd']}
📊 Rate: {conversion['rate']} ETB/USD
💵 Final: {conversion['formatted']}

📝 Note: {comment}

⚠️ Includes 1.5 EUR fee
        """
    else:
        summary = f"""
📋 PAYMENT SUMMARY

👤 Customer: {customer_name}
🌐 Website: {website}
🔑 Login: {login_details}

💵 Amount: {amount} {currency}
💲 USD: ${conversion['amount_usd']}
📊 Rate: {conversion['rate']} ETB/USD
💰 Final: {conversion['formatted']}

📝 Note: {comment}

✅ No fee applied
        """
    
    markup = InlineKeyboardMarkup(row_width=2)
    markup.add(
        InlineKeyboardButton("✅ Confirm", callback_data="confirm_payment"),
        InlineKeyboardButton("❌ Cancel", callback_data="cancel_payment")
    )
    
    bot.send_message(user_id, summary, reply_markup=markup)

@bot.callback_query_handler(func=lambda call: True)
def handle_callbacks(call):
    user_id = call.from_user.id
    
    if call.data == "confirm_payment":
        bot.answer_callback_query(call.id, "Confirmed!")
        
        # Extract the summary text from the message
        summary_text = call.message.text
        
        # Create a clean admin message (without markdown to avoid errors)
        admin_msg = f"""
🔔 NEW PAYMENT REQUEST

{summary_text}

----------------------------
👤 User: @{call.from_user.username or 'NoUsername'}
🆔 User ID: {user_id}
----------------------------
        """
        
        try:
            # Send to admin without markdown
            bot.send_message(ADMIN_ID, admin_msg)

            save_notification(
                user_id,
                "Payment Sent To Admin",
                "Your payment has been sent to the Dink Pay admin team. You will see updates here.",
                "success"
            )
            
            # Confirm to user
            bot.send_message(
                user_id,
                "✅ Payment sent to admin!\n\nYou'll receive confirmation soon.",
                reply_markup=get_main_keyboard()
            )
        except Exception as e:
            print(f"Error sending to admin: {e}")
            bot.send_message(
                user_id,
                "❌ Error sending to admin. Please contact @DinkPayAdmin directly.",
                reply_markup=get_main_keyboard()
            )
        
    elif call.data == "cancel_payment":
        bot.answer_callback_query(call.id, "Cancelled")
        bot.send_message(user_id, "❌ Cancelled", reply_markup=get_main_keyboard())

@bot.message_handler(func=lambda msg: msg.text == "🛍 My Services")
def my_services(message):
    user_id = message.from_user.id
    update_last_active(user_id)

    if not require_backend_access(message):
        return

    backend_services = get_backend_user_services(user_id)
    local_services = get_user_services(user_id) if not backend_services else []

    if not backend_services and not local_services:
        bot.send_message(
            user_id,
            "🛍 You have no saved services yet.\n\nStart a payment and your services will show here.",
            reply_markup=get_main_keyboard()
        )
        return

    lines = ["🛍 MY SERVICES\n"]

    for order in backend_services:
        service_name = order.get("service", {}).get("name", "Service")
        plan_name = order.get("plan", {}).get("name", "Plan")
        amount_etb = order.get("totalAmount", 0)
        order_id = order.get("orderId", "N/A")
        created_at = order.get("createdAt", "")

        lines.append(
            f"{order_id} • {service_name}\n"
            f"📦 {plan_name}\n"
            f"💰 {amount_etb} ETB\n"
            f"💳 Payment: {get_payment_label(order.get('paymentStatus'))}\n"
            f"📌 Service: {get_service_status(order)}\n"
            f"🕒 {created_at[:19].replace('T', ' ')}\n"
        )

    for payment_id, customer_name, website, amount_etb, status, date in local_services:
        lines.append(
            f"#{payment_id} • {website}\n"
            f"👤 {customer_name}\n"
            f"💰 {amount_etb}\n"
            f"📌 Status: {status.title()}\n"
            f"🕒 {date}\n"
        )

    bot.send_message(user_id, "\n".join(lines), reply_markup=get_main_keyboard())

@bot.message_handler(func=lambda msg: msg.text == "🔔 Notifications")
def my_notifications(message):
    user_id = message.from_user.id
    update_last_active(user_id)

    if not require_backend_access(message):
        return

    backend_notifications = get_backend_user_notifications(user_id)
    local_notifications = get_user_notifications(user_id) if not backend_notifications else []

    if not backend_notifications and not local_notifications:
        bot.send_message(
            user_id,
            "🔔 No notifications yet.\n\nPayment and service updates will appear here.",
            reply_markup=get_main_keyboard()
        )
        return

    lines = ["🔔 YOUR NOTIFICATIONS\n"]

    for notification in backend_notifications:
        notification_type = notification.get("type", "info")
        prefix = "✅" if notification_type == "success" else "⚠️" if notification_type == "error" else "ℹ️"
        lines.append(
            f"{prefix} {notification.get('title', 'Update')}\n"
            f"{notification.get('message', '')}\n"
            f"🕒 {str(notification.get('createdAt', ''))[:19].replace('T', ' ')}\n"
        )

    for title, notification_message, notification_type, date in local_notifications:
        prefix = "✅" if notification_type == "success" else "ℹ️"
        lines.append(f"{prefix} {title}\n{notification_message}\n🕒 {date}\n")

    bot.send_message(user_id, "\n".join(lines), reply_markup=get_main_keyboard())

@bot.message_handler(func=lambda msg: msg.text == "💱 Check Rate")
def check_rate(message):
    user_id = message.from_user.id
    update_last_active(user_id)

    if not require_backend_access(message):
        return
    
    msg = bot.send_message(
        user_id,
        "💱 Enter amount and currency\n\nExamples: 50 USD • 30 EUR • 100 GBP\n\nRates:\n• $1-50: 205 ETB/USD\n• $51-100: 200 ETB/USD\n• $100+: 195 ETB/USD\n\nEUR: +1.5 fee",
        reply_markup=get_cancel_keyboard()
    )
    bot.register_next_step_handler(msg, process_rate_check)

def process_rate_check(message):
    user_id = message.from_user.id
    
    if message.text == "❌ Cancel":
        bot.send_message(user_id, "✅ Back to menu", reply_markup=get_main_keyboard())
        return
    
    amount, currency = parse_amount_input(message.text)
    
    if not amount or not currency:
        msg = bot.send_message(
            user_id,
            "❌ Invalid! Use: 50 USD, 30 EUR, etc.\n\nTry again:",
            reply_markup=get_cancel_keyboard()
        )
        bot.register_next_step_handler(msg, process_rate_check)
        return
    
    conversion = convert_to_etb(amount, currency)
    
    if not conversion:
        bot.send_message(
            user_id,
            "❌ Conversion failed. Try again.",
            reply_markup=get_main_keyboard()
        )
        return
    
    if currency == 'EUR':
        result = f"""
💶 {amount} EUR
➕ Fee: +{EUR_FEE} EUR
💰 Total: {conversion['amount_with_fee']} EUR
💵 = ${conversion['amount_usd']} USD
📊 Rate: {conversion['rate']} ETB/USD
💵 = {conversion['formatted']}
⚠️ Includes 1.5 EUR fee
        """
    else:
        result = f"""
💵 {amount} {currency}
💲 = ${conversion['amount_usd']} USD
📊 Rate: {conversion['rate']} ETB/USD
💰 = {conversion['formatted']}
✅ No fee
        """
    
    bot.send_message(user_id, result, reply_markup=get_main_keyboard())

@bot.message_handler(func=lambda msg: msg.text == "📋 Services")
def show_services(message):
    user_id = message.from_user.id
    update_last_active(user_id)

    if not require_backend_access(message):
        return
    
    text = """
📋 OUR SERVICES

💳 Payment Processing
• Fast & secure transactions
• Multiple currencies supported
• Real-time exchange rates
• EUR: +1.5 fee

📍 Pickup Location
Saris, Infront of Nega Bonger Hotel
Eyuel Stationery

📞 Contact
• Admin: @DinkPayAdmin
• Phone: +251717296190

⚠️ Please call before coming!
    """
    
    markup = InlineKeyboardMarkup()
    markup.add(InlineKeyboardButton("📢 Join Channel", url=f"https://t.me/{CHANNEL_USERNAME[1:]}"))
    
    bot.send_message(user_id, text, reply_markup=markup)

@bot.message_handler(func=lambda msg: msg.text == "📞 Contact Admin")
def contact_admin(message):
    user_id = message.from_user.id
    update_last_active(user_id)

    if not require_backend_access(message):
        return
    
    text = """
📞 CONTACT ADMIN

👤 Admin: @DinkPayAdmin
📱 Phone: +251717296190
📧 Email: DinkPay@gmail.com

⏰ Hours:
• Monday - Saturday: 9AM - 9PM
• Sunday: 2PM - 8PM
    """
    
    markup = InlineKeyboardMarkup()
    markup.add(InlineKeyboardButton("💬 Message Admin", url="https://t.me/DinkPayAdmin"))
    
    bot.send_message(user_id, text, reply_markup=markup)

@bot.message_handler(func=lambda msg: msg.text == "❓ Help")
def show_help(message):
    user_id = message.from_user.id
    update_last_active(user_id)

    if not require_backend_access(message):
        return
    
    text = """
❓ HELP & GUIDANCE

💱 Check Rate
• Click Check Rate
• Enter amount (e.g., 50 USD)
• See instant conversion

🔔 Alerts
• Mini app payment updates arrive here automatically
• Admin broadcasts also show up directly in this bot

💰 EUR Transactions
• Always includes 1.5 EUR fee
• Rate: 1 USD = 0.8202 EUR
• Fee shown in breakdown

📞 Need help?
Contact @DinkPayAdmin
    """
    
    bot.send_message(user_id, text)

@bot.message_handler(commands=['payments'])
def admin_payments(message):
    if message.from_user.id != ADMIN_ID:
        bot.reply_to(message, "❌ Admin only")
        return

    cursor.execute("""
        SELECT id, user_id, customer_name, website, amount_etb, status, date
        FROM payments
        ORDER BY id DESC
        LIMIT 12
    """)
    payments = cursor.fetchall()

    if not payments:
        bot.reply_to(message, "No payments found.")
        return

    lines = ["📋 RECENT PAYMENTS\n"]
    for payment_id, user_id, customer_name, website, amount_etb, status, date in payments:
        lines.append(
            f"#{payment_id} | {website} | {amount_etb}\n"
            f"User: {user_id}\n"
            f"Customer: {customer_name}\n"
            f"Status: {status}\n"
            f"Date: {date}\n"
        )

    bot.reply_to(message, "\n".join(lines))

@bot.message_handler(commands=['setstatus'])
def admin_set_status(message):
    if message.from_user.id != ADMIN_ID:
        bot.reply_to(message, "❌ Admin only")
        return

    parts = message.text.split(maxsplit=3)
    if len(parts) < 3:
        bot.reply_to(message, "Usage: /setstatus <payment_id> <pending|processing|paid|completed|failed> [note]")
        return

    try:
        payment_id = int(parts[1])
    except ValueError:
        bot.reply_to(message, "Payment ID must be a number.")
        return

    status = parts[2].lower()
    note = parts[3] if len(parts) > 3 else ""

    if status not in ['pending', 'processing', 'paid', 'completed', 'failed']:
        bot.reply_to(message, "Invalid status. Use pending, processing, paid, completed, or failed.")
        return

    if update_payment_status(payment_id, status, note):
        bot.reply_to(message, f"✅ Payment #{payment_id} updated to {status}.")
    else:
        bot.reply_to(message, "❌ Payment not found.")

@bot.message_handler(func=lambda msg: True)
def handle_unknown(message):
    user_id = message.from_user.id
    update_last_active(user_id)

    if not require_backend_access(message):
        return
    
    bot.send_message(
        user_id,
        "❓ Please use the buttons below 👇",
        reply_markup=get_main_keyboard()
    )

if __name__ == "__main__":
    print("🤖 Dink Pay Bot is running...")
    print(f"📢 Channel: {CHANNEL_USERNAME}")
    print(f"👤 Admin ID: {ADMIN_ID}")
    print(f"💰 EUR Fee: {EUR_FEE} EUR")
    print(f"🔄 Backend alert sync: {'push enabled' if BACKEND_SYNC_PUSH_MESSAGES else 'cache only'}")
    print("=" * 30)
    
    try:
        if BACKEND_SYNC_PUSH_MESSAGES:
            sync_thread = threading.Thread(target=run_backend_notification_sync, daemon=True)
            sync_thread.start()
        bot.infinity_polling(timeout=10, long_polling_timeout=5)
    except Exception as e:
        print(f"❌ Error: {e}")
