import json
import os
import hashlib
import secrets
import psycopg
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

DB_URL = os.environ.get("DATABASE_URL", "")
SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")

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

        # Регистрация
        if path == "/register" and method == "POST":
            username = (body.get("username") or "").strip().lower()
            display_name = (body.get("display_name") or "").strip()
            password = body.get("password") or ""

            if not username or not display_name or not password:
                return make_response({"error": "Все поля обязательны"}, 400)

            cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE username = %s", (username,))
            if cur.fetchone():
                return make_response({"error": "Пользователь уже существует"}, 409)

            import random
            avatar_color = random.choice(COLORS)
            password_hash = hash_password(password)

            cur.execute(
                f"""INSERT INTO {SCHEMA}.users (username, display_name, password_hash, avatar_color)
                    VALUES (%s, %s, %s, %s) RETURNING id, username, display_name, avatar_color, bio""",
                (username, display_name, password_hash, avatar_color)
            )
            row = cur.fetchone()
            user = {"id": str(row[0]), "username": row[1], "display_name": row[2], "avatar_color": row[3], "bio": row[4] or ""}
            
            cur.execute(f"UPDATE {SCHEMA}.users SET is_online = true, last_seen = NOW() WHERE id = %s", (row[0],))
            conn.commit()
            
            token = generate_token(str(row[0]))
            return make_response({"user": user, "token": token}, 201)

        # Вход
        if path == "/login" and method == "POST":
            username = (body.get("username") or "").strip().lower()
            password = body.get("password") or ""

            cur.execute(
                f"SELECT id, username, display_name, avatar_color, bio, password_hash FROM {SCHEMA}.users WHERE username = %s",
                (username,)
            )
            row = cur.fetchone()

            if not row:
                return make_response({"error": "Неверное имя пользователя или пароль"}, 401)

            if not check_password(password, row[5]):
                return make_response({"error": "Неверное имя пользователя или пароль"}, 401)

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
