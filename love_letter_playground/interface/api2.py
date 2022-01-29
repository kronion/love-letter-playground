import asyncio
from enum import Enum
from typing import Dict, Optional

from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, WebSocket, WebSocketDisconnect, status
from gym_love_letter.envs.base import InvalidPlayError, LoveLetterMultiAgentEnv

from love_letter_playground.agents import HumanAgent, RandomAgent
from love_letter_playground.interface.models import Game, Lobby, User
from love_letter_playground.interface.schema import GameOverSchema, ObservationSchema
from love_letter_playground.interface.serializers import LobbySerializer


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
    game = Game(env)
    return game


async def handle_create(ws: WebSocket, user: User, game_cache) -> None:
    if user.game is not None:
        response = {
            "operation": Operation.CREATE,
            "status": 400,
            "detail": "game ongoing",
        }
    else:
        game = create_game()
        game_cache[game.id] = game

        user.join_game(game)
        game.env.reset()
        game_state = ObservationSchema().dump(game.env.observe())

        response = {
            "operation": Operation.CREATE,
            "status": 201,
            "detail": "created",
            "data": game_state,
        }

    await ws.send_json(response)


async def handle_reset(ws: WebSocket, user: User) -> None:
    game = user.game
    if game is None:
        response = {
            "operation": Operation.RESET,
            "status": 400,
            "detail": "no game ongoing",
        }
    else:
        game.env.reset()
        game_state = ObservationSchema().dump(game.env.observe())

        response = {
            "operation": Operation.RESET,
            "status": 200,
            "detail": "reset",
            "data": game_state,
        }

    await ws.send_json(response)


async def handle_step(ws: WebSocket, data, user: User) -> None:
    game = user.game
    if game is None:
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
    if not game.env.current_player.active:
        raise RuntimeError("Current player not active?")

    try:
        game.env.protected_step(action_id, full_cycle=False)
    except InvalidPlayError as e:
        await ws.send_json({"type": "error", "reason": e})
        return

    schema = ObservationSchema() if game.env.players[0].active else GameOverSchema()
    game_state = schema.dump(game.env.observe())
    response = {
        "operation": Operation.STEP,
        "status": 200,
        "detail": "stepped",
        "data": game_state,
    }
    await ws.send_json(response)

    # Step back around to human player
    while not game.env.game_over and game.env.current_player != game.env.players[0]:
        # Find the next active player to take a step for.
        # Break if no players are active.
        starting_player = game.env.current_player
        while not game.env.current_player.active:
            game.env._next_player()
            if game.env.current_player == starting_player:
                break

        # Raise exception if no players are active (should never happen)
        if not game.env.current_player.active:
            raise RuntimeError("No active players")

        if game.env.current_player != game.env.players[0]:
            await asyncio.sleep(2)

            count = 0
            LIMIT = 100

            while count < LIMIT:
                try:
                    agent = game.env.agents[game.env.current_player.position]
                    action_id, _state = agent.predict(
                        game.env.observe().vector, action_masks=game.env.valid_action_mask()
                    )
                    obs, reward, done, info = game.env.protected_step(
                        action_id, full_cycle=False
                    )
                    break
                except InvalidPlayError:
                    count += 1

            if count == LIMIT:
                breakpoint()
                raise RuntimeError("No valid play found")

            # Step forward so that the next API call will be for an active player
            while not game.env.current_player.active:
                game.env._next_player()

            schema = ObservationSchema() if game.env.players[0].active else GameOverSchema()
            game_state = schema.dump(game.env.observe())
            response = {
                "operation": Operation.STEP,
                "status": 200,
                "detail": "stepped",
                "data": game_state,
            }
            await ws.send_json(response)


async def handle_websocket_message(ws: WebSocket, user: User, game_cache: Dict) -> None:
    # TODO parse data with pydantic
    data = await ws.receive_json()

    if "operation" not in data:
        await ws.send_json({"type": "error", "reason": "'operation' field is required"})
        return

    operation = data["operation"]

    if operation == Operation.CREATE:
        await handle_create(ws, user, game_cache)
    elif operation == Operation.RESET:
        await handle_reset(ws, user)
    elif operation == Operation.STEP:
        await handle_step(ws, data, user)


def make_api():
    api = APIRouter()

    cache = {}
    fetch_game = fetch_game_factory(cache)

    game_cache = {}
    user_cache: Dict[str, User] = {}

    lobby = Lobby()

    @api.get("/valid_actions")
    def valid_actions(env = Depends(fetch_game)):
        return jsonify(ActionSchema(many=True).dump(env.valid_actions))

    @api.websocket("/ws")
    async def manage_socket(ws: WebSocket):
        if "user_id" not in ws.session:
            await ws.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        user_id = ws.session["user_id"]

        if user_id not in user_cache:
            user_cache[user_id] = User(user_id)
        user = user_cache[user_id]
        await user.add_connection(ws)

        if user.game is not None:
            game_state = ObservationSchema().dump(user.game.env.observe())
            message = {"operation": "status", "status": 200, "data": game_state}
        else:
            lobby.users.add(user)
            message = {"operation": "lobby", "status": 200, "data": LobbySerializer.from_orm(lobby).dict()}

        try:
            await ws.send_json(message)
            while True:
                await handle_websocket_message(ws, user, game_cache)
        except WebSocketDisconnect:
            user.remove_connection(ws)

    return api
