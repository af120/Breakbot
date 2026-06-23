import asyncio
import logging
import sqlite3
import os
from datetime import datetime, timezone
from typing import Optional

from aiogram import Bot, Dispatcher, F
from aiogram.client.default import DefaultBotProperties
from aiogram.filters import Command
from aiogram.types import (
    Message,
    CallbackQuery,
    InlineKeyboardMarkup,
    InlineKeyboardButton,
)
from apscheduler.schedulers.asyncio import AsyncIOScheduler

BOT_TOKEN: str = os.environ.get("BOT_TOKEN", "YOUR_BOT_TOKEN_HERE")
GROUP_CHAT_ID: int = -1004473132946

BREAK_LIMIT_MINUTES: int = 80
DB_PATH: str = "breaks.db"
CHECK_INTERVAL_SECONDS: int = 60

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)


def db_connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def db_init() -> None:
    with db_connect() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS active_breaks (
                user_id        INTEGER PRIMARY KEY,
                full_name      TEXT    NOT NULL,
                username       TEXT,
                start_time     TEXT    NOT NULL,
                alerted        INTEGER NOT NULL DEFAULT 0
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS break_history (
                id             INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id        INTEGER NOT NULL,
                full_name      TEXT    NOT NULL,
                start_time     TEXT    NOT NULL,
                end_time       TEXT    NOT NULL,
                duration_mins  REAL    NOT NULL
            )
        """)
        conn.commit()


def db_start_break(user_id: int, full_name: str, username: Optional[str]) -> bool:
    now_iso = datetime.now(timezone.utc).isoformat()
    try:
        with db_connect() as conn:
            conn.execute(
                "INSERT INTO active_breaks (user_id, full_name, username, start_time) "
                "VALUES (?, ?, ?, ?)",
                (user_id, full_name, username, now_iso),
            )
            conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False


def db_end_break(user_id: int) -> Optional[dict]:
    with db_connect() as conn:
        row = conn.execute(
            "SELECT * FROM active_breaks WHERE user_id = ?", (user_id,)
        ).fetchone()

        if row is None:
            return None

        start_dt = datetime.fromisoformat(row["start_time"])
        end_dt = datetime.now(timezone.utc)
        duration_mins = (end_dt - start_dt).total_seconds() / 60

        conn.execute(
            "INSERT INTO break_history (user_id, full_name, start_time, end_time, duration_mins) "
            "VALUES (?, ?, ?, ?, ?)",
            (user_id, row["full_name"], row["start_time"], end_dt.isoformat(), duration_mins),
        )
        conn.execute("DELETE FROM active_breaks WHERE user_id = ?", (user_id,))
        conn.commit()

    return {
        "full_name": row["full_name"],
        "start_time": start_dt,
        "end_time": end_dt,
        "duration_mins": duration_mins,
    }


def db_get_active_breaks():
    with db_connect() as conn:
        return conn.execute("SELECT * FROM active_breaks").fetchall()


def db_mark_alerted(user_id: int) -> None:
    with db_connect() as conn:
        conn.execute(
            "UPDATE active_breaks SET alerted = 1 WHERE user_id = ?", (user_id,)
        )
        conn.commit()


def main_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="أخذ استراحة ☕", callback_data="take_break")],
            [InlineKeyboardButton(text="تم الانطلاق ✅", callback_data="back_to_work")],
            [InlineKeyboardButton(text="عرض المستريحين 📋", callback_data="show_resting")],
        ]
    )


def format_duration(minutes: float) -> str:
    total_secs = int(minutes * 60)
    hours, remainder = divmod(total_secs, 3600)
    mins, secs = divmod(remainder, 60)
    if hours:
        return f"{hours}h {mins}m {secs}s"
    if mins:
        return f"{mins}m {secs}s"
    return f"{secs}s"


def user_mention(full_name: str, user_id: int) -> str:
    return f'<a href="tg://user?id={user_id}">{full_name}</a>'


bot = Bot(
    token=BOT_TOKEN,
    default=DefaultBotProperties(parse_mode="HTML"),
)
dp = Dispatcher()


@dp.message(Command("start"))
async def cmd_start(message: Message) -> None:
    await message.answer(
        "🕐 <b>نظام تتبع وقت الاستراحة</b>\n\n"
        "استخدم الأزرار أدناه للتحكم في وقت استراحتك.",
        reply_markup=main_keyboard(),
    )


@dp.callback_query(F.data == "take_break")
async def cb_take_break(callback: CallbackQuery) -> None:
    user = callback.from_user
    full_name = user.full_name or f"User {user.id}"
    username = user.username

    success = db_start_break(user.id, full_name, username)

    if not success:
        await callback.answer(
            "⚠️ أنت بالفعل في استراحة! اضغط 'تم الانطلاق' عند عودتك.",
            show_alert=True,
        )
        return

    now_str = datetime.now(timezone.utc).strftime("%H:%M UTC")
    await callback.answer("تم تسجيل استراحتك ☕", show_alert=False)

    await bot.send_message(
        GROUP_CHAT_ID,
        f"☕ {user_mention(full_name, user.id)} أخذ استراحة الساعة <b>{now_str}</b>.\n"
        f"⏱ الحد المسموح به: <b>{BREAK_LIMIT_MINUTES} دقيقة</b>.",
    )


@dp.callback_query(F.data == "back_to_work")
async def cb_back_to_work(callback: CallbackQuery) -> None:
    user = callback.from_user
    result = db_end_break(user.id)

    if result is None:
        await callback.answer(
            "⚠️ لم تسجّل استراحة! اضغط 'أخذ استراحة' أولاً.",
            show_alert=True,
        )
        return

    await callback.answer("تم تسجيل عودتك ✅", show_alert=False)

    duration_str = format_duration(result["duration_mins"])
    over_limit = result["duration_mins"] > BREAK_LIMIT_MINUTES

    status_line = (
        "⚠️ <b>تجاوز الحد المسموح به!</b>" if over_limit
        else "✅ ضمن الوقت المسموح به."
    )

    await bot.send_message(
        GROUP_CHAT_ID,
        f"✅ {user_mention(result['full_name'], user.id)} عاد من الاستراحة.\n"
        f"⏱ مدة الاستراحة: <b>{duration_str}</b>\n"
        f"{status_line}",
    )


@dp.callback_query(F.data == "show_resting")
async def cb_show_resting(callback: CallbackQuery) -> None:
    await callback.answer()

    rows = db_get_active_breaks()

    if not rows:
        await callback.message.answer("📋 لا يوجد أحد في استراحة حالياً.")
        return

    now = datetime.now(timezone.utc)
    lines = ["📋 <b>المستريحون الآن:</b>\n"]

    for row in rows:
        start_dt = datetime.fromisoformat(row["start_time"])
        elapsed_mins = (now - start_dt).total_seconds() / 60
        elapsed_str = format_duration(elapsed_mins)
        warning = " ⚠️" if elapsed_mins > BREAK_LIMIT_MINUTES else ""
        lines.append(
            f"• {user_mention(row['full_name'], row['user_id'])}"
            f" — {elapsed_str}{warning}"
        )

    await callback.message.answer("\n".join(lines))


async def check_overdue_breaks() -> None:
    rows = db_get_active_breaks()
    now = datetime.now(timezone.utc)

    for row in rows:
        if row["alerted"]:
            continue

        start_dt = datetime.fromisoformat(row["start_time"])
        elapsed_mins = (now - start_dt).total_seconds() / 60

        if elapsed_mins >= BREAK_LIMIT_MINUTES:
            elapsed_str = format_duration(elapsed_mins)

            await bot.send_message(
                GROUP_CHAT_ID,
                f"🚨 <b>تنبيه تجاوز وقت الاستراحة!</b>\n\n"
                f"{user_mention(row['full_name'], row['user_id'])} "
                f"تجاوز وقت الاستراحة المسموح به!\n"
                f"⏱ مدة الاستراحة حتى الآن: <b>{elapsed_str}</b>\n"
                f"الحد المسموح: <b>{BREAK_LIMIT_MINUTES} دقيقة</b>.\n\n"
                f"رجاءً العودة فوراً! ✅",
            )
            db_mark_alerted(row["user_id"])


async def main() -> None:
    db_init()

    scheduler = AsyncIOScheduler()
    scheduler.add_job(
        check_overdue_breaks,
        trigger="interval",
        seconds=CHECK_INTERVAL_SECONDS,
        id="break_checker",
        replace_existing=True,
    )
    scheduler.start()

    await bot.delete_webhook(drop_pending_updates=True)

    try:
        await dp.start_polling(bot)
    finally:
        scheduler.shutdown()
        await bot.session.close()


if __name__ == "__main__":
    asyncio.run(main())
