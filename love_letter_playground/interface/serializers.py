from pydantic import BaseModel


class UserSerializer(BaseModel):
    id: str

    class Config:
        orm_mode = True


class GameSerializer(BaseModel):
    id: str
    players: list[UserSerializer]

    class Config:
        orm_mode = True


class LobbySerializer(BaseModel):
    games: list[GameSerializer]
    users: list[UserSerializer]

    class Config:
        orm_mode = True
