# -*- coding: utf-8 -*-
"""
Radar Scientifique — FastAPI route registration.
Called at the bottom of api.py:
    from .radar_endpoints import register_radar_routes
    register_radar_routes(app, query)
"""

import threading
import smtplib
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional
from datetime import datetime, timedelta

from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

from . import radar_scientifique as _radar

_bearer = HTTPBearer(auto_error=False)

# ── helpers ──────────────────────────────────────────────────────────────────

def _decode_token(creds: HTTPAuthorizationCredentials) -> dict | None:
    if not creds:
        return None
    try:
        return jwt.decode(
            creds.credentials,
            os.getenv("JWT_SECRET", "larodec_secret"),
            algorithms=["HS256"],
        )
    except Exception:
        return None


def _send_email(to: str, subject: str, html: str):
    """Send an email via SMTP. Configure via env vars."""
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_pass = os.getenv("SMTP_PASS", "")
    from_addr = os.getenv("SMTP_FROM", smtp_user or "noreply@larodec.rnu.tn")

    if not smtp_user:
        print(f"[radar:email] SMTP_USER not configured — skipping email to {to}")
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = from_addr
    msg["To"]      = to
    msg.attach(MIMEText(html, "html", "utf-8"))

    try:
        with smtplib.SMTP(smtp_host, smtp_port) as s:
            s.ehlo()
            s.starttls()
            s.login(smtp_user, smtp_pass)
            s.sendmail(from_addr, [to], msg.as_string())
        print(f"[radar:email] Sent to {to}")
    except Exception as e:
        print(f"[radar:email] Failed to send to {to}: {e}")


def _build_weekly_html(articles: list, prenom: str) -> str:
    today = datetime.now().strftime("%d/%m/%Y")
    rows = ""
    for a in articles[:5]:
        link = f"https://doi.org/{a['doi']}" if a.get("doi") else a.get("url") or "#"
        rows += f"""
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #e8edf5;vertical-align:top;">
            <a href="{link}" style="font-weight:bold;color:#1A1A4E;text-decoration:none;font-size:14px;">{a.get('titre','')}</a><br>
            <span style="color:#6b7280;font-size:13px;font-style:italic;">{a.get('source','')}</span>
            <span style="background:#EEF4FF;color:#1A73E8;font-size:11px;font-weight:bold;padding:2px 8px;border-radius:20px;margin-left:8px;">{a.get('annee','')}</span><br>
            <p style="color:#374151;font-size:13px;margin:6px 0 0;">{a.get('resume_fr','')}</p>
            <a href="{link}" style="color:#1A73E8;font-size:12px;">Lire l'article →</a>
          </td>
        </tr>"""

    return f"""<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#f8faff;margin:0;padding:0;">
  <table width="600" align="center" style="background:white;border-radius:12px;overflow:hidden;margin:24px auto;">
    <tr><td style="background:linear-gradient(135deg,#1A1A4E,#1A73E8);padding:32px 40px;">
      <h1 style="color:white;margin:0;font-size:24px;">LARODEC — Veille Scientifique</h1>
      <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">Sélection du {today} pour {prenom}</p>
    </td></tr>
    <tr><td style="padding:32px 40px;">
      <p style="color:#374151;font-size:14px;">Bonjour {prenom},</p>
      <p style="color:#374151;font-size:14px;">Voici les publications scientifiques les plus pertinentes pour vos thématiques de recherche cette semaine :</p>
      <table width="100%">{rows}</table>
      <div style="text-align:center;margin-top:32px;">
        <a href="http://larodec.rnu.tn" style="background:#1A73E8;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px;">
          Voir tous les articles sur LARODEC
        </a>
      </div>
      <p style="color:#9ca3af;font-size:11px;margin-top:32px;text-align:center;">
        Vous recevez cet email car vous êtes abonné à la veille scientifique LARODEC.<br>
        <a href="http://larodec.rnu.tn/unsubscribe" style="color:#9ca3af;">Se désabonner</a>
      </p>
    </td></tr>
  </table>
</body></html>"""


# ── route registration ────────────────────────────────────────────────────────

def register_radar_routes(app, query_fn):
    _refresh_running: dict = {"running": False}

    # ── startup: warm cache ─────────────────────────────────────────────────
    @app.on_event("startup")
    async def _startup_radar():
        threading.Thread(
            target=_radar.refresh_cache,
            args=(query_fn,),
            daemon=True,
        ).start()
        # Schedule weekly email cron (runs in background)
        threading.Thread(target=_weekly_email_cron, args=(query_fn,), daemon=True).start()

    # ── GET /api/public/radar ───────────────────────────────────────────────
    @app.get("/api/public/radar")
    def get_radar(refresh: Optional[int] = 0):
        """Return cached radar articles. ?refresh=1 forces synchronous re-fetch."""
        if refresh == 1:
            _radar.refresh_cache(query_fn)
        elif _radar.cache_is_stale(max_age_hours=12) and not _refresh_running.get("running"):
            _refresh_running["running"] = True
            def _bg():
                try:
                    _radar.refresh_cache(query_fn)
                finally:
                    _refresh_running["running"] = False
            threading.Thread(target=_bg, daemon=True).start()
        return _radar.get_cache()

    # ── POST /api/radar/subscribe ───────────────────────────────────────────
    @app.post("/api/radar/subscribe")
    def radar_subscribe(creds: HTTPAuthorizationCredentials = Depends(_bearer)):
        """Subscribe the authenticated user to the weekly radar digest."""
        payload = _decode_token(creds)
        if not payload:
            raise HTTPException(status_code=401, detail="Non authentifié")
        user_id = payload.get("sub") or payload.get("id") or payload.get("user_id")
        try:
            query_fn("""
                CREATE TABLE IF NOT EXISTS radar_subscriptions (
                    user_id   INT PRIMARY KEY,
                    subscribed_at TIMESTAMP DEFAULT NOW()
                )
            """)
            query_fn(
                "INSERT INTO radar_subscriptions (user_id) VALUES (%s) "
                "ON CONFLICT (user_id) DO NOTHING",
                (user_id,)
            )
            return {"ok": True, "message": "Abonnement activé"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    # ── DELETE /api/radar/subscribe ─────────────────────────────────────────
    @app.delete("/api/radar/subscribe")
    def radar_unsubscribe(creds: HTTPAuthorizationCredentials = Depends(_bearer)):
        """Unsubscribe the authenticated user from the weekly digest."""
        payload = _decode_token(creds)
        if not payload:
            raise HTTPException(status_code=401, detail="Non authentifié")
        user_id = payload.get("sub") or payload.get("id") or payload.get("user_id")
        try:
            query_fn(
                "DELETE FROM radar_subscriptions WHERE user_id = %s", (user_id,)
            )
            return {"ok": True, "message": "Désabonnement effectué"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    # ── GET /api/radar/subscribe ────────────────────────────────────────────
    @app.get("/api/radar/subscribe")
    def radar_subscription_status(creds: HTTPAuthorizationCredentials = Depends(_bearer)):
        """Check if authenticated user is subscribed."""
        payload = _decode_token(creds)
        if not payload:
            return {"subscribed": False}
        user_id = payload.get("sub") or payload.get("id") or payload.get("user_id")
        try:
            row = query_fn(
                "SELECT 1 FROM radar_subscriptions WHERE user_id = %s", (user_id,), one=True
            )
            return {"subscribed": bool(row)}
        except Exception:
            return {"subscribed": False}


# ── Weekly email cron ─────────────────────────────────────────────────────────

def _weekly_email_cron(query_fn):
    """
    Runs forever in a daemon thread.
    Every Monday at 08:00 (UTC+1 Tunis), sends the radar digest to all subscribers.
    """
    import time
    print("[radar:cron] Weekly email cron started")
    while True:
        now = datetime.utcnow() + timedelta(hours=1)  # UTC+1
        # Next Monday 08:00
        days_until_monday = (7 - now.weekday()) % 7 or 7
        next_run = (now + timedelta(days=days_until_monday)).replace(
            hour=8, minute=0, second=0, microsecond=0
        )
        sleep_seconds = (next_run - now).total_seconds()
        print(f"[radar:cron] Next digest: {next_run.strftime('%Y-%m-%d %H:%M')} (in {sleep_seconds/3600:.1f}h)")
        time.sleep(max(sleep_seconds, 60))

        # Send emails
        try:
            _send_weekly_digest(query_fn)
        except Exception as e:
            print(f"[radar:cron] Error sending digest: {e}")


def _send_weekly_digest(query_fn):
    """Fetch subscribers and send personalized digest emails."""
    try:
        subs = query_fn("""
            SELECT rs.user_id, u.prenom, u.nom, u.email
            FROM radar_subscriptions rs
            JOIN larodec_users u ON u.id = rs.user_id
            WHERE u.email IS NOT NULL
        """)
    except Exception as e:
        print(f"[radar:digest] Could not fetch subscribers: {e}")
        return

    cache = _radar.get_cache()
    articles = cache.get("articles", [])
    if not articles:
        print("[radar:digest] No articles in cache — skipping")
        return

    today = datetime.now().strftime("%d/%m/%Y")
    for sub in (subs or []):
        prenom = sub.get("prenom", "Cher(e) chercheur(e)")
        email  = sub.get("email", "")
        if not email:
            continue
        html    = _build_weekly_html(articles[:5], prenom)
        subject = f"LARODEC — Votre veille scientifique du {today}"
        _send_email(email, subject, html)
