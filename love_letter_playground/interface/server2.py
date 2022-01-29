import os
import re
import string
import sys
from pathlib import Path
from typing import Optional

import nanoid
from fastapi import Cookie, FastAPI, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware
from starlette_csrf import CSRFMiddleware  # TODO this middleware doesn't check websockets?

from love_letter_playground.interface.api2 import make_api


app = FastAPI()

SECRET = os.environ["CSRF_SECRET"]  # Fail if key not provided
app.add_middleware(CSRFMiddleware, secret=SECRET)
SECRET2 = os.environ["CSRF_SECRET"]  # TODO should be a separate secret
app.add_middleware(SessionMiddleware, secret_key=SECRET2)

# Specify static directory relative to this file, since uvicorn keeps the cwd
# as the project root.
static_dir = Path(__file__).parent.resolve() / "dist"
app.mount("/static", StaticFiles(directory=static_dir, html=True), name="static")

app.include_router(make_api(), prefix="/api")

@app.get("/", response_class=FileResponse)
async def main(request: Request):
    if "user_id" not in request.session:
        user_id = nanoid.generate(alphabet="1234567890", size=10)
        request.session["user_id"] = user_id

    return static_dir / "index.html"
