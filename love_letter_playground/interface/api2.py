import uuid
from enum import Enum
from typing import Dict, Optional

from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, WebSocket, status
from gym_love_letter.envs.base import InvalidPlayError, LoveLetterMultiAgentEnv

from love_letter_playground.agents import HumanAgent, RandomAgent
from love_letter_playground.interface.schema import GameOverSchema, ObservationSchema


class Action(str, Enum):
    CREATE = "create"
    RESET = "reset"



def fetch_game_factory(cache):
    def fetcher(game: Optional[str] = Cookie(None)):
        if game is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Game not specified")

        if game not in cache:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Game not found")

        return cache[game]

    return fetcher


def create_game():
    # TODO allow agents to be selected

    def make_agents(env):
        human = HumanAgent()
        # load_path = "zoo/ppo_reward_bugfix4/latest/best_model"
        # load_path = "zoo/ppo_logging/2020-12-27T15:51:49/final_model"
        # load_path = "zoo/ppo_kl/2020-12-27T16:28:42/final_model"
        # model = PPO.load(load_path, env)
        random1 = RandomAgent(env)
        # random2 = RandomAgent(env)

        return [human, random1]  # model]  # random1, random2]

    env = LoveLetterMultiAgentEnv(num_players=2, make_agents_cb=make_agents)

    return env


async def handle_websocket_message(ws: WebSocket, cache: Dict):
    data = await ws.receive_json()

    if "action" not in data:
        await ws.send_json({"type": "error", "reason": "action type is required"})
        return

    action = data["action"]
    if action == Action.CREATE:
        game = create_game()
        uid = str(uuid.uuid4())
        cache[uid] = game

        response = {
            "status": 201,
            "detail": "created",
            "data": {
                "game": uid
            }
        }
        await ws.send_json(response)


def make_api(cache: Dict):
    api = APIRouter()

    fetch_game = fetch_game_factory(cache)

    @api.get("/reset")
    def reset(env = Depends(fetch_game)):
        env.reset()
        return ObservationSchema().dump(env.observe())

    @api.get("/current_state")
    def current_state(env = Depends(fetch_game)):
        schema = ObservationSchema() if env.players[0].active else GameOverSchema()
        return schema.dump(env.observe())

    @api.get("/valid_actions")
    def valid_actions(env = Depends(fetch_game)):
        return jsonify(ActionSchema(many=True).dump(env.valid_actions))

    @api.get("/step")
    def step(env = Depends(fetch_game)):
        # Find the next active player to take a step for.
        # Break if no players are active.
        starting_player = env.current_player
        while not env.current_player.active:
            env._next_player()
            if env.current_player == starting_player:
                break

        # Raise exception if no players are active (should never happen)
        if not env.current_player.active:
            raise RuntimeError("No active players")

        # Human player just returns current observation, no action taken.
        # Note that the player must be active if we've gotten here.
        if env.current_player.position == 0:
            return ObservationSchema().dump(env.observe())

        count = 0
        LIMIT = 100

        while count < LIMIT:
            try:
                agent = env.agents[env.current_player.position]
                action_id, _state = agent.predict(
                    env.observe().vector, action_masks=env.valid_action_mask()
                )
                obs, reward, done, info = env.protected_step(
                    action_id, full_cycle=False
                )
                break
            except InvalidPlayError:
                count += 1

        if count == LIMIT:
            import ipdb; ipdb.set_trace()
            raise RuntimeError("No valid play found")

        # Step forward so that the next API call will be for an active player
        while not env.current_player.active:
            env._next_player()

        schema = ObservationSchema() if env.players[0].active else GameOverSchema()

        return schema.dump(env.observe())

    @api.get("/step/{action_id}")
    def step_action(action_id: int, env = Depends(fetch_game)):
        try:
            env.protected_step(action_id, full_cycle=False)
        except InvalidPlayError as e:
            return {"error": e}, 400

        # Step forward so that the next API call will be for an active player
        while not env.current_player.active:
            env._next_player()

        schema = ObservationSchema() if env.players[0].active else GameOverSchema()

        return schema.dump(env.observe())

    @api.websocket("/ws")
    async def test(websocket: WebSocket):
        await websocket.accept()
        await websocket.send_text(f"Connected")
        while True:
            await handle_websocket_message(websocket, cache)

    async def get_cookie(
        websocket: WebSocket,
        session: Optional[str] = Cookie(None),
    ):
        if session is None:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return session


    @api.websocket("/items/{item_id}/ws")
    async def websocket_endpoint(
        websocket: WebSocket,
        item_id: str,
        cookie: str = Depends(get_cookie),
    ):
        await websocket.accept()
        breakpoint()
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(
                f"Session cookie value is: {cookie}"
            )
            await websocket.send_text(f"Message text was: {data}, for item ID: {item_id}")

    return api
