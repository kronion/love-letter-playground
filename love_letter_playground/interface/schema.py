from gym_love_letter.engine import Card
from marshmallow import Schema, fields


class CardSchema(Schema):
    name = fields.Str()
    value = fields.Int()


class PlayerStatusSchema(Schema):
    position = fields.Int()
    name = fields.Str()
    active = fields.Boolean()
    safe = fields.Boolean()


class PlayerFullSchema(PlayerStatusSchema):
    hand = fields.Method("get_player_hand")

    def get_player_hand(self, obj):
        return [card.value for card in obj.hand if card != Card.EMPTY]


class ActionSchema(Schema):
    card = fields.Pluck(CardSchema, "value")
    target = fields.Int()
    guess = fields.Pluck(CardSchema, "value")
    _id = fields.Int(data_key="id")


class PlaySchema(Schema):
    action = fields.Nested(ActionSchema)
    player = fields.Pluck(PlayerStatusSchema, "position")
    discarding_player = fields.Pluck(
        PlayerStatusSchema, "position", data_key="discardingPlayer"
    )
    discard = fields.Pluck(CardSchema, "value")


class PriestInfoSchema(Schema):
    _priest_targets = fields.Dict(
        keys=fields.Pluck(PlayerStatusSchema, "position"),
        values=fields.Pluck(CardSchema, "value"),
    )


class ObservationSchema(Schema):
    players = fields.List(fields.Nested(PlayerStatusSchema))
    curr_player = fields.Pluck(PlayerStatusSchema, "position", data_key="currentPlayer")
    hand = fields.Method("get_human_player_hand")
    priestInfo = fields.Method("get_priest_info")
    discard = fields.List(fields.Pluck(CardSchema, "value"))
    cardsRemaining = fields.Method("get_cards_remaining")
    plays = fields.List(fields.Nested(PlaySchema))
    validActions = fields.Method("get_valid_actions")
    game_over = fields.Boolean(data_key="gameOver")
    winners = fields.List(fields.Pluck(PlayerStatusSchema, "position"))

    def get_human_player_hand(self, obj):
        return [card.value for card in obj.players[0].hand if card != Card.EMPTY]

    def get_cards_remaining(self, obj):
        return obj.deck.remaining()

    def get_priest_info(self, obj):
        return PriestInfoSchema().dump(obj.players[0])["_priest_targets"]

    def get_valid_actions(self, obj):
        if obj.curr_player.position != 0:
            return []
        return ActionSchema().dump(obj.valid_actions, many=True)


class GameOverSchema(ObservationSchema):
    players = fields.List(fields.Nested(PlayerFullSchema))
