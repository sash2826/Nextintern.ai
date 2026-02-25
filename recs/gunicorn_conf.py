import multiprocessing
import os

worker_class = "uvicorn.workers.UvicornWorker"

try:
    cores = multiprocessing.cpu_count()
except (NotImplementedError, Exception):
    cores = 1
workers_per_core = 2
default_web_concurrency = workers_per_core * cores + 1
web_concurrency = os.getenv("WEB_CONCURRENCY")

if web_concurrency:
    if not (web_concurrency.isascii() and web_concurrency.isdigit()) or int(web_concurrency) <= 0:
        raise ValueError("WEB_CONCURRENCY must be a positive integer")
    workers = int(web_concurrency)
else:
    workers = default_web_concurrency

timeout = 60
graceful_timeout = 30
keepalive = 5

loglevel = "info"
bind = "0.0.0.0:8000"

# Render logs to stdout/stderr
accesslog = "-"
errorlog = "-"
