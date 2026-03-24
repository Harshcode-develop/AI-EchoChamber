from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from collections import defaultdict
from datetime import datetime, date, timedelta, timezone
import time
import asyncio
import logging

logger = logging.getLogger(__name__)

# Maximum number of tracked IPs before cleanup is forced
MAX_TRACKED_IPS = 10_000


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Global IP-based rate limiter.
    Limits: 60 requests per minute per IP for all endpoints.
    Includes periodic cleanup to prevent unbounded memory growth.
    """

    def __init__(self, app, requests_per_minute: int = 60):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.requests: dict[str, list[float]] = defaultdict(list)
        self._lock = asyncio.Lock()
        self._last_cleanup = time.time()

    async def dispatch(self, request: Request, call_next):
        # Support X-Forwarded-For for real client IP behind proxies
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            client_ip = forwarded.split(",")[0].strip()
        else:
            client_ip = request.client.host if request.client else "unknown"
        
        now = time.time()
        window = 60.0  # 1 minute

        async with self._lock:
            # Periodic full cleanup to prevent memory leak (every 5 minutes)
            if now - self._last_cleanup > 300 or len(self.requests) > MAX_TRACKED_IPS:
                stale_ips = [
                    ip
                    for ip, timestamps in self.requests.items()
                    if not timestamps or now - timestamps[-1] > window
                ]
                for ip in stale_ips:
                    del self.requests[ip]
                self._last_cleanup = now
                if stale_ips:
                    logger.debug("Cleaned up %d stale IP entries", len(stale_ips))

            # Clean old entries for this IP
            self.requests[client_ip] = [
                t for t in self.requests[client_ip] if now - t < window
            ]

            if len(self.requests[client_ip]) >= self.requests_per_minute:
                logger.warning(
                    "Rate limit hit for IP %s: %d requests in window",
                    client_ip,
                    len(self.requests[client_ip]),
                )
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many requests. Please try again later.",
                )

            self.requests[client_ip].append(now)

        response = await call_next(request)
        return response


class GenerationLimiter:
    """
    Track content generation limits per user/guest.
    - Guest: 1 generation total (per fingerprint)
    - Authenticated: 3 generations per day
    Includes periodic cleanup to prevent unbounded memory growth.
    """

    def __init__(self):
        self.guest_generations: dict[str, dict[str, int]] = {}
        self.auth_generations: dict[str, dict[str, int]] = {}
        self._lock = asyncio.Lock()
        self._last_cleanup = time.time()

    async def _cleanup_stale_entries(self):
        """Remove old entries to prevent memory leak."""
        now = time.time()
        if now - self._last_cleanup < 3600:  # Only cleanup every hour
            return

        # Calculate 'today' based on IST (UTC+5:30) for midnight reset at 12:00 AM IST
        IST = timezone(timedelta(hours=5, minutes=30))
        today = datetime.now(IST).date().isoformat()

        # Clean auth entries with no today data
        stale_users = [
            uid
            for uid, dates in self.auth_generations.items()
            if today not in dates
        ]
        for uid in stale_users:
            del self.auth_generations[uid]

        # Clean guest entries with no today data
        stale_guests = [
            fid
            for fid, dates in self.guest_generations.items()
            if today not in dates
        ]
        for fid in stale_guests:
            del self.guest_generations[fid]

        self._last_cleanup = now
        logger.debug(
            "Cleaned up %d auth and %d guest entries",
            len(stale_users),
            len(stale_guests),
        )

    async def check_and_increment(
        self,
        user_id: str | None,
        fingerprint: str,
        max_guest: int = 1,
        max_auth: int = 1,
    ) -> bool:
        """
        Check if user/guest can generate content.
        Returns True if allowed (and increments counter).
        Raises HTTPException if limit exceeded.
        """
        async with self._lock:
            await self._cleanup_stale_entries()
            IST = timezone(timedelta(hours=5, minutes=30))
            today = datetime.now(IST).date().isoformat()

            if user_id:
                # Authenticated user
                if user_id not in self.auth_generations:
                    self.auth_generations[user_id] = {}

                count = self.auth_generations[user_id].get(today, 0)
                if count >= max_auth:
                    logger.info("Auth user %s hit generation limit", user_id)
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail="You have reached your daily generation limit! Please come back tomorrow or upgrade your account.",
                    )
                self.auth_generations[user_id][today] = count + 1

                # Clean old dates
                old_dates = [
                    d for d in self.auth_generations[user_id] if d != today
                ]
                for d in old_dates:
                    del self.auth_generations[user_id][d]
            else:
                # Guest
                if fingerprint not in self.guest_generations:
                    self.guest_generations[fingerprint] = {}
                
                count = self.guest_generations[fingerprint].get(today, 0)
                if count >= max_guest:
                    logger.info("Guest %s hit generation limit", fingerprint[:8])
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail="You have reached your daily generation limit! Please come back tomorrow or upgrade your account.",
                    )
                self.guest_generations[fingerprint][today] = count + 1

                # Clean old dates
                old_dates = [
                    d for d in self.guest_generations[fingerprint] if d != today
                ]
                for d in old_dates:
                    del self.guest_generations[fingerprint][d]

        return True

    async def get_remaining(
        self,
        user_id: str | None,
        fingerprint: str,
        max_guest: int = 1,
        max_auth: int = 1,
    ) -> int:
        """Get remaining generations for user/guest."""
        async with self._lock:
            IST = timezone(timedelta(hours=5, minutes=30))
            today = datetime.now(IST).date().isoformat()

            if user_id:
                count = self.auth_generations.get(user_id, {}).get(today, 0)
                return max(0, max_auth - count)
            else:
                count = self.guest_generations.get(fingerprint, {}).get(today, 0)
                return max(0, max_guest - count)


# Singleton instance
generation_limiter = GenerationLimiter()
