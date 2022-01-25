import os
import re
import string
import sys
import uuid
from pathlib import Path
from typing import Optional

from fastapi import Cookie, FastAPI, Response
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from starlette_csrf import CSRFMiddleware  # TODO this middleware doesn't check websockets?

from love_letter_playground.interface.api2 import make_api


app = FastAPI()

SECRET = os.environ["CSRF_SECRET"]  # Fail if key not provided
app.add_middleware(CSRFMiddleware, secret=SECRET)

# Specify static directory relative to this file, since uvicorn keeps the cwd
# as the project root.
static_dir = Path(__file__).parent.resolve() / "dist"
app.mount("/static", StaticFiles(directory=static_dir, html=True), name="static")

app.include_router(make_api(), prefix="/api")

@app.get("/", response_class=FileResponse)
async def main(response: Response, user_id: Optional[str] = Cookie(None)):
    if user_id is None:
        user_id = str(uuid.uuid4())
    response.set_cookie(key="user_id", value=user_id)

    return static_dir / "index.html"
