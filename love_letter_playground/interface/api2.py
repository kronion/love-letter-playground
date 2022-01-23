import asyncio
import uuid
from enum import Enum
from typing import Dict, Optional

from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, WebSocket, WebSocketDisconnect, status
from gym_love_letter.envs.base import InvalidPlayError, LoveLetterMultiAgentEnv

from love_letter_playground.agents import HumanAgent, RandomAgent
from love_letter_playground.interface.schema import GameOverSchema, ObservationSchema


class Operation(str, Enum):
    CREATE = "create"
    RESET = "reset"
    STEP = "step"


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


async def handle_create(ws: WebSocket, user_data) -> None:
    if "game" in user_data:
        response = {
            "operation": Operation.CREATE,
            "status": 400,
            "detail": "game ongoing",
        }
    else:
        game = create_game()
        user_data["game"] = game
        game.reset()
        game_state = ObservationSchema().dump(game.observe())

        response = {
            "operation": Operation.CREATE,
            "status": 201,
            "detail": "created",
            "data": game_state,
        }

    await ws.send_json(response)


async def handle_reset(ws: WebSocket, user_data) -> None:
    if "game" not in user_data:
        response = {
            "operation": Operation.RESET,
            "status": 400,
            "detail": "no game ongoing",
        }
    else:
        game = user_data["game"]
        game.reset()
        game_state = ObservationSchema().dump(game.observe())

        response = {
            "operation": Operation.RESET,
            "status": 200,
            "detail": "reset",
            "data": game_state,
        }

    await ws.send_json(response)


async def handle_step(ws: WebSocket, data, user_data) -> None:
    try:
        game = user_data["game"]
    except KeyError:
        response = {
            "operation": Operation.STEP,
            "status": 400,
            "detail": "no game ongoing",
        }
        await ws.send_json(response)
        return

    try:
        action_id = data["action_id"]
    except KeyError:
        await ws.send_json({"type": "error", "reason": "missing field: 'action_id'"})
        return

    # TODO confirm that the step was sent by the correct player
    if not game.current_player.active:
        raise RuntimeError("Current player not active?")

    try:
        game.protected_step(action_id, full_cycle=False)
    except InvalidPlayError as e:
        await ws.send_json({"type": "error", "reason": e})
        return

    schema = ObservationSchema() if game.players[0].active else GameOverSchema()
    game_state = schema.dump(game.observe())
    response = {
        "operation": Operation.STEP,
        "status": 200,
        "detail": "stepped",
        "data": game_state,
    }
    await ws.send_json(response)

    # Step back around to human player
    while not game.game_over and game.current_player != game.players[0]:
        # Find the next active player to take a step for.
        # Break if no players are active.
        starting_player = game.current_player
        while not game.current_player.active:
            game._next_player()
            if game.current_player == starting_player:
                break

        # Raise exception if no players are active (should never happen)
        if not game.current_player.active:
            raise RuntimeError("No active players")

        if game.current_player != game.players[0]:
            await asyncio.sleep(2)

            count = 0
            LIMIT = 100

            while count < LIMIT:
                try:
                    agent = game.agents[game.current_player.position]
                    action_id, _state = agent.predict(
                        game.observe().vector, action_masks=game.valid_action_mask()
                    )
                    obs, reward, done, info = game.protected_step(
                        action_id, full_cycle=False
                    )
                    break
                except InvalidPlayError:
                    count += 1

            if count == LIMIT:
                breakpoint()
                raise RuntimeError("No valid play found")

            # Step forward so that the next API call will be for an active player
            while not game.current_player.active:
                game._next_player()

            schema = ObservationSchema() if game.players[0].active else GameOverSchema()
            game_state = schema.dump(game.observe())
            response = {
                "operation": Operation.STEP,
                "status": 200,
                "detail": "stepped",
                "data": game_state,
            }
            await ws.send_json(response)


async def handle_websocket_message(ws: WebSocket, cache: Dict) -> None:
    # TODO parse data with pydantic
    data = await ws.receive_json()

    if "operation" not in data:
        await ws.send_json({"type": "error", "reason": "'operation' field is required"})
        return

    operation = data["operation"]
    user_id = ws.session.get("user_id")
    if user_id is None:
        await ws.send_json({"type": "error", "reason": "user_id not recognized"})
        return

    if user_id not in cache:
        cache[user_id] = {}
    user_data = cache[user_id]

    if operation == Operation.CREATE:
        await handle_create(ws, user_data)
    elif operation == Operation.RESET:
        await handle_reset(ws, user_data)
    elif operation == Operation.STEP:
        await handle_step(ws, data, user_data)


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
    async def test(ws: WebSocket, user_id: Optional[str] = Cookie(None)):
        if user_id is None:
            await ws.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        ws.session["user_id"] = user_id
        if user_id not in cache:
            cache[user_id] = {}
        user_data = cache[user_id]

        running = False
        game_state = None
        if "game" in user_data:
            running = True
            game = user_data["game"]
            game_state = ObservationSchema().dump(game.observe())

        try:
            await ws.accept()
            await ws.send_json({"operation": "status", "status": 200, "data": game_state})
            while True:
                await handle_websocket_message(ws, cache)
        except WebSocketDisconnect:
            return

    return api
