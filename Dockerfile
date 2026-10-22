FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app
COPY requirements-lock.txt ./
RUN python -m pip install --no-cache-dir -r requirements-lock.txt \
    && useradd --create-home --uid 10001 ares

COPY backend ./backend
USER ares
EXPOSE 8000

# La plataforma proporciona PORT. Un proceso conserva el escenario compartido en memoria.
CMD ["sh", "-c", "exec python -m uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1"]
