import json
import os
import psycopg

DB_URL = os.environ.get("DATABASE_URL", "")
SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-User-Id",
    "Content-Type": "application/json",
}

COLORS = ["#5B8DEF", "#E74C3C", "#2ECC71", "#9B59B6", "#F39C12", "#1ABC9C"]

def make_response(data, status=200):
    return {
        "statusCode": status,
        "headers": CORS_HEADERS,
        "body": json.dumps(data, default=str),
    }

def handler(request, context):
    if request.get("method") == "OPTIONS":
        return {"statusCode": 204, "headers": CORS_HEADERS, "body": ""}

    user_id = (request.get("headers") or {}).get("x-user-id") or (request.get("headers") or {}).get("X-User-Id")
    if not user_id:
        return make_response({"error": "Unauthorized"}, 401)

    path = request.get("path", "/")
    method = request.get("method", "GET")
    body = {}

    if request.get("body"):
        try:
            body = json.loads(request["body"])
        except Exception:
            body = {}

    try:
        conn = psycopg.connect(DB_URL)
        cur = conn.cursor()

        # Получить список чатов
        if path == "/chats" and method == "GET":
            cur.execute(
                f"""SELECT 
                    c.id,
                    c.name,
                    c.is_group,
                    c.avatar_color,
                    (SELECT content FROM {SCHEMA}.messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
                    (SELECT created_at FROM {SCHEMA}.messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time,
                    (SELECT COUNT(*) FROM {SCHEMA}.messages WHERE chat_id = c.id AND is_read = false AND sender_id != %s) as unread_count,
                    u2.id as other_user_id,
                    u2.display_name as other_user_display_name,
                    u2.avatar_color as other_user_avatar_color,
                    u2.username as other_user_username,
                    u2.is_online as other_user_is_online
                FROM {SCHEMA}.chats c
                JOIN {SCHEMA}.chat_members cm ON cm.chat_id = c.id
                LEFT JOIN {SCHEMA}.chat_members cm2 ON cm2.chat_id = c.id AND cm2.user_id != %s
                LEFT JOIN {SCHEMA}.users u2 ON u2.id = cm2.user_id
                WHERE cm.user_id = %s
                ORDER BY last_message_time DESC NULLS LAST""",
                (user_id, user_id, user_id)
            )
            rows = cur.fetchall()
            chats = []
            for r in rows:
                chats.append({
                    "id": str(r[0]),
                    "name": r[1],
                    "is_group": r[2],
                    "avatar_color": r[3],
                    "last_message": r[4],
                    "last_message_time": str(r[5]) if r[5] else None,
                    "unread_count": int(r[6]),
                    "other_user_id": str(r[7]) if r[7] else None,
                    "other_user_display_name": r[8],
                    "other_user_avatar_color": r[9],
                    "other_user_username": r[10],
                    "other_user_is_online": r[11],
                })
            return make_response(chats)

        # Создать/получить личный чат
        if path == "/chats/direct" and method == "POST":
            target_user_id = body.get("target_user_id")
            if not target_user_id:
                return make_response({"error": "target_user_id required"}, 400)

            cur.execute(
                f"""SELECT c.id FROM {SCHEMA}.chats c
                    JOIN {SCHEMA}.chat_members cm1 ON cm1.chat_id = c.id AND cm1.user_id = %s
                    JOIN {SCHEMA}.chat_members cm2 ON cm2.chat_id = c.id AND cm2.user_id = %s
                    WHERE c.is_group = false LIMIT 1""",
                (user_id, target_user_id)
            )
            row = cur.fetchone()
            if row:
                return make_response({"chat_id": str(row[0])})

            import random
            avatar_color = random.choice(COLORS)
            cur.execute(
                f"INSERT INTO {SCHEMA}.chats (is_group, avatar_color, created_by) VALUES (false, %s, %s) RETURNING id",
                (avatar_color, user_id)
            )
            chat_id = str(cur.fetchone()[0])
            cur.execute(
                f"INSERT INTO {SCHEMA}.chat_members (chat_id, user_id) VALUES (%s, %s), (%s, %s)",
                (chat_id, user_id, chat_id, target_user_id)
            )
            conn.commit()
            return make_response({"chat_id": chat_id}, 201)

        # Получить сообщения чата
        parts = path.strip("/").split("/")
        if len(parts) == 3 and parts[0] == "chats" and parts[2] == "messages":
            chat_id = parts[1]

            if method == "GET":
                cur.execute(
                    f"""UPDATE {SCHEMA}.messages SET is_read = true 
                        WHERE chat_id = %s AND sender_id != %s AND is_read = false""",
                    (chat_id, user_id)
                )
                conn.commit()

                cur.execute(
                    f"""SELECT m.id, m.content, m.created_at, m.is_read, m.sender_id,
                               u.display_name, u.avatar_color, u.username
                        FROM {SCHEMA}.messages m
                        JOIN {SCHEMA}.users u ON u.id = m.sender_id
                        WHERE m.chat_id = %s
                        ORDER BY m.created_at ASC""",
                    (chat_id,)
                )
                rows = cur.fetchall()
                messages = []
                for r in rows:
                    messages.append({
                        "id": str(r[0]),
                        "content": r[1],
                        "created_at": str(r[2]),
                        "is_read": r[3],
                        "sender_id": str(r[4]),
                        "sender_name": r[5],
                        "sender_avatar_color": r[6],
                        "sender_username": r[7],
                    })
                return make_response(messages)

            if method == "POST":
                content = (body.get("content") or "").strip()
                if not content:
                    return make_response({"error": "Сообщение пустое"}, 400)

                cur.execute(
                    f"""INSERT INTO {SCHEMA}.messages (chat_id, sender_id, content)
                        VALUES (%s, %s, %s) RETURNING id, content, created_at, sender_id""",
                    (chat_id, user_id, content)
                )
                row = cur.fetchone()

                cur.execute(
                    f"SELECT display_name, avatar_color, username FROM {SCHEMA}.users WHERE id = %s",
                    (user_id,)
                )
                u = cur.fetchone()
                conn.commit()

                return make_response({
                    "id": str(row[0]),
                    "content": row[1],
                    "created_at": str(row[2]),
                    "sender_id": str(row[3]),
                    "sender_name": u[0],
                    "sender_avatar_color": u[1],
                    "sender_username": u[2],
                }, 201)

        # Профиль
        if path == "/profile" and method == "GET":
            cur.execute(
                f"SELECT id, username, display_name, avatar_color, bio, is_online, last_seen FROM {SCHEMA}.users WHERE id = %s",
                (user_id,)
            )
            row = cur.fetchone()
            if not row:
                return make_response({"error": "User not found"}, 404)
            return make_response({
                "id": str(row[0]), "username": row[1], "display_name": row[2],
                "avatar_color": row[3], "bio": row[4] or "", "is_online": row[5], "last_seen": str(row[6])
            })

        if path == "/profile" and method == "POST":
            display_name = body.get("display_name", "")
            bio = body.get("bio", "")
            cur.execute(
                f"""UPDATE {SCHEMA}.users SET display_name = %s, bio = %s WHERE id = %s
                    RETURNING id, username, display_name, avatar_color, bio""",
                (display_name, bio, user_id)
            )
            row = cur.fetchone()
            conn.commit()
            return make_response({
                "id": str(row[0]), "username": row[1], "display_name": row[2],
                "avatar_color": row[3], "bio": row[4] or ""
            })

        return make_response({"error": "Not found"}, 404)

    except Exception as e:
        return make_response({"error": str(e)}, 500)
    finally:
        try:
            conn.close()
        except Exception:
            pass
