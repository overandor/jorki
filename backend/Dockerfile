# Jorki backend — content-addressed file-intelligence gateway.
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py index.html ./

# Persist the SQLite DB on a mounted volume so state survives container restarts.
ENV JORKI_DB=/data/jorki.db
VOLUME /data

EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
