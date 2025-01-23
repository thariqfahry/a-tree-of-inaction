FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && \
apt-get install -y chromium-driver

COPY requirements.txt.frozen .
RUN pip install -r requirements.txt.frozen

COPY warmup.py .
RUN python warmup.py

COPY . .

EXPOSE 8000

ENTRYPOINT [ "gunicorn", "-w", "2", "main:app", "--timeout", "20", "--log-level", "info", "--access-logfile", "-"]
