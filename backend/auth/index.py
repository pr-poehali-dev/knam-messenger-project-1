import json
import os
import hashlib
import secrets
import smtplib
import random
import string
import psycopg
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

DB_URL = os.environ.get("DATABASE_URL", "")
SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")

SMTP_HOST = os.environ.get("SMTP_HOST", "")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")

COLORS = ["#5B8DEF", "#E74C3C", "#2ECC71", "#9B59B6", "#F39C12", "#1ABC9C", "#E91E63", "#FF5722"]

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    h = hashlib.sha256((salt + password).encode()).hexdigest()
    return f"{salt}:{h}"

def check_password(password: str, hashed: str) -> bool:
    try:
        salt, h = hashed.split(":")
        return hashlib.sha256((salt + password).encode()).hexdigest() == h
    except Exception:
        return False

def generate_token(user_id: str) -> str:
    return hashlib.sha256(f"{user_id}{secrets.token_hex(16)}".encode()).hexdigest()

def generate_code() -> str:
    return "".join(random.choices(string.digits, k=5))

def send_email_code(email: str, code: str):
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"{code} — код подтверждения Кнам"
    msg["From"] = f"Кнам <{SMTP_USER}>"
    msg["To"] = email

    html = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="margin:0;padding:0;background:#0d1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d1117;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="440" cellpadding="0" cellspacing="0" style="background:#161b22;border-radius:16px;border:1px solid #30363d;overflow:hidden;">
          <tr>
            <td style="padding:32px;text-align:center;">
              <div style="display:inline-block;width:64px;height:64px;background:linear-gradient(135deg,#5B8DEF,#3366CC);border-radius:16px;line-height:64px;font-size:28px;font-weight:900;color:white;margin-bottom:20px;">К</div>
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#e6edf3;">Подтверждение email</h1>
              <p style="margin:0 0 28px;color:#8b949e;font-size:14px;">Введи этот код в приложении Кнам:</p>
              <div style="background:#0d1117;border:1px solid #30363d;border-radius:12px;padding:20px;margin:0 0 28px;display:inline-block;">
                <span style="font-size:36px;font-weight:900;color:#5B8DEF;letter-spacing:12px;">{code}</span>
              </div>
              <p style="margin:0;color:#484f58;font-size:12px;">Код действителен 10 минут. Если ты не регистрировался — просто проигнорируй это письмо.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""
    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.ehlo()
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(SMTP_USER, email, msg.as_string())

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-User-Id",
    "Content-Type": "application/json",
}

def make_response(data, status=200):
    return {
        "statusCode": status,
        "headers": CORS_HEADERS,
        "body": json.dumps(data, default=str),
    }

def handler(request, context):
    if isinstance(request, list):
        request = request[0] if request else {}
    if not isinstance(request, dict):
        request = {}

    if request.get("method") == "OPTIONS":
        return {"statusCode": 204, "headers": CORS_HEADERS, "body": ""}

    path = request.get("path", "/")
    method = request.get("method", "GET")
    body = {}
    
    if request.get("body"):
        try:
            body = json.loads(request["body"])
        except Exception:
            body = {}

    query_params = request.get("queryStringParameters") or {}

    try:
        conn = psycopg.connect(DB_URL)
        cur = conn.cursor()

        # Шаг 1: отправка кода на email
        if path == "/send-code" and method == "POST":
            email = (body.get("email") or "").strip().lower()

            if not email:
                return make_response({"error": "Введи email"}, 400)

            if "@" not in email or "." not in email.split("@")[-1]:
                return make_response({"error": "Некорректный email адрес"}, 400)

            # Проверяем, не занят ли email
            cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE email = %s", (email,))
            if cur.fetchone():
                return make_response({"error": "Этот email уже используется"}, 409)

            # Удаляем старые неиспользованные коды для этого email
            cur.execute(
                f"DELETE FROM {SCHEMA}.email_verifications WHERE email = %s AND used = false",
                (email,)
            )

            code = generate_code()
            cur.execute(
                f"""INSERT INTO {SCHEMA}.email_verifications (email, code)
                    VALUES (%s, %s)""",
                (email, code)
            )
            conn.commit()

            # Отправляем письмо
            try:
                send_email_code(email, code)
            except Exception as e:
                return make_response({"error": f"Не удалось отправить письмо: {str(e)}"}, 500)

            return make_response({"ok": True, "message": "Код отправлен на email"})

        # Шаг 2: проверка кода
        if path == "/verify-code" and method == "POST":
            email = (body.get("email") or "").strip().lower()
            code = (body.get("code") or "").strip()

            if not email or not code:
                return make_response({"error": "Email и код обязательны"}, 400)

            cur.execute(
                f"""SELECT id FROM {SCHEMA}.email_verifications
                    WHERE email = %s AND code = %s AND used = false AND expires_at > NOW()
                    ORDER BY created_at DESC LIMIT 1""",
                (email, code)
            )
            row = cur.fetchone()

            if not row:
                return make_response({"error": "Неверный или устаревший код"}, 400)

            # Помечаем код как использованный
            cur.execute(
                f"UPDATE {SCHEMA}.email_verifications SET used = true WHERE id = %s",
                (row[0],)
            )
            conn.commit()

            return make_response({"ok": True, "verified": True})

        # Шаг 3: регистрация (после верификации email)
        if path == "/register" and method == "POST":
            username = (body.get("username") or "").strip().lower()
            email = (body.get("email") or "").strip().lower()
            display_name = (body.get("display_name") or "").strip()
            password = body.get("password") or ""

            if not username or not display_name or not password or not email:
                return make_response({"error": "Все поля обязательны"}, 400)

            if "@" not in email or "." not in email.split("@")[-1]:
                return make_response({"error": "Некорректный email адрес"}, 400)

            # Проверяем, что email был верифицирован (использованный код существует)
            cur.execute(
                f"""SELECT id FROM {SCHEMA}.email_verifications
                    WHERE email = %s AND used = true
                    ORDER BY created_at DESC LIMIT 1""",
                (email,)
            )
            if not cur.fetchone():
                return make_response({"error": "Email не подтверждён"}, 403)

            # Проверяем уникальность username
            cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE username = %s", (username,))
            if cur.fetchone():
                return make_response({"error": "Пользователь с таким именем уже существует"}, 409)

            # Проверяем уникальность email
            cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE email = %s", (email,))
            if cur.fetchone():
                return make_response({"error": "Email уже используется"}, 409)

            avatar_color = random.choice(COLORS)
            password_hash = hash_password(password)

            cur.execute(
                f"""INSERT INTO {SCHEMA}.users (username, email, display_name, password_hash, avatar_color)
                    VALUES (%s, %s, %s, %s, %s) RETURNING id, username, display_name, avatar_color, bio""",
                (username, email, display_name, password_hash, avatar_color)
            )
            row = cur.fetchone()
            user = {"id": str(row[0]), "username": row[1], "display_name": row[2], "avatar_color": row[3], "bio": row[4] or ""}
            
            cur.execute(f"UPDATE {SCHEMA}.users SET is_online = true, last_seen = NOW() WHERE id = %s", (row[0],))
            conn.commit()
            
            token = generate_token(str(row[0]))
            return make_response({"user": user, "token": token}, 201)

        # Вход (по email или username)
        if path == "/login" and method == "POST":
            login_id = (body.get("email") or body.get("username") or "").strip().lower()
            password = body.get("password") or ""

            if not login_id or not password:
                return make_response({"error": "Введите email/имя пользователя и пароль"}, 400)

            cur.execute(
                f"""SELECT id, username, display_name, avatar_color, bio, password_hash 
                    FROM {SCHEMA}.users 
                    WHERE email = %s OR username = %s""",
                (login_id, login_id)
            )
            row = cur.fetchone()

            if not row:
                return make_response({"error": "Неверный email/имя пользователя или пароль"}, 401)

            if not check_password(password, row[5]):
                return make_response({"error": "Неверный email/имя пользователя или пароль"}, 401)

            cur.execute(f"UPDATE {SCHEMA}.users SET is_online = true, last_seen = NOW() WHERE id = %s", (row[0],))
            conn.commit()

            user = {"id": str(row[0]), "username": row[1], "display_name": row[2], "avatar_color": row[3], "bio": row[4] or ""}
            token = generate_token(str(row[0]))
            return make_response({"user": user, "token": token})

        # Поиск пользователей
        if path == "/search" and method == "GET":
            q = query_params.get("q", "")
            cur.execute(
                f"""SELECT id, username, display_name, avatar_color, bio FROM {SCHEMA}.users
                    WHERE username ILIKE %s OR display_name ILIKE %s LIMIT 20""",
                (f"%{q}%", f"%{q}%")
            )
            rows = cur.fetchall()
            users = [{"id": str(r[0]), "username": r[1], "display_name": r[2], "avatar_color": r[3], "bio": r[4] or ""} for r in rows]
            return make_response(users)

        return make_response({"error": "Not found"}, 404)

    except Exception as e:
        return make_response({"error": str(e)}, 500)
    finally:
        try:
            conn.close()
        except Exception:
            pass
