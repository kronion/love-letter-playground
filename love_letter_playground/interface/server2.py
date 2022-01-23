# from typing import Dict
# from uuid import UUID
#
# from flask import Flask
# from gym_love_letter.envs.base import LoveLetterMultiAgentEnv
# from stable_baselines3.ppo import PPO
#
# # from love_letter_playground.agents import HumanAgent, RandomAgent
# from love_letter_playground.interface.api import make_api
#
#
# app = Flask(__name__, static_url_path="/static", static_folder="dist")
# app.secret_key = "TODO REPLACE ME"
#
#
# # def make_agents(env):
# #     human = HumanAgent()
# #     # load_path = "zoo/ppo_reward_bugfix4/latest/best_model"
# #     # load_path = "zoo/ppo_logging/2020-12-27T15:51:49/final_model"
# #     # load_path = "zoo/ppo_kl/2020-12-27T16:28:42/final_model"
# #     # model = PPO.load(load_path, env)
# #     random1 = RandomAgent(env)
# #     # random2 = RandomAgent(env)
# #
# #     return [human, random1]  # model]  # random1, random2]
# #
# #
# # env = LoveLetterMultiAgentEnv(num_players=2, make_agents_cb=make_agents)
#
#
# cache: Dict[UUID, LoveLetterMultiAgentEnv] = {}
# api = make_api(cache)
# app.register_blueprint(api, url_prefix="/api")

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
from starlette.middleware.sessions import SessionMiddleware
from starlette_csrf import CSRFMiddleware

from love_letter_playground.interface.api2 import make_api


app = FastAPI()

SECRET = os.environ["CSRF_SECRET"]  # Fail if key not provided
# TODO different secrets
SECRET2 = os.environ["CSRF_SECRET"]  # Fail if key not provided
app.add_middleware(CSRFMiddleware, secret=SECRET)
app.add_middleware(SessionMiddleware, secret_key=SECRET)

# Specify static directory relative to this file, since uvicorn keeps the cwd
# as the project root.
static_dir = Path(__file__).parent.resolve() / "dist"
app.mount("/static", StaticFiles(directory=static_dir, html=True), name="static")

app.include_router(make_api({}), prefix="/api")

@app.get("/", response_class=FileResponse)
async def main(response: Response, user_id: Optional[str] = Cookie(None)):
    if user_id is None:
        user_id = str(uuid.uuid4())
    response.set_cookie(key="user_id", value=user_id)

    return static_dir / "index.html"
