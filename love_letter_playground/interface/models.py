from __future__ import annotations

from typing import Optional

import nanoid
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)


class User:
    def __init__(self, user_id: str):
        self.id = user_id
        self.ws_manager = ConnectionManager()
        self.game: Optional[Game] = None

    async def add_connection(self, ws: WebSocket) -> None:
        await self.ws_manager.connect(ws)

    def remove_connection(self, ws: WebSocket) -> None:
        self.ws_manager.disconnect(ws)

    def join_game(self, game: Game) -> None:
        self.game = game
        self.game.add_player(self)

    def leave_game(self) -> None:
        if self.game is not None:
            self.game.remove_player(self)
            self.game = None


class Game:
    def __init__(self, env):
        self.id = nanoid.generate(alphabet="1234567890", size=10)
        self.env = env
        self.players = {}

    def add_player(self, player: User) -> None:
        pass

    def remove_player(self, player: User) -> None:
        pass


class Lobby:
    def __init__(self):
        self.games: set[Game] = set()
        self.users: set[User] = set()
