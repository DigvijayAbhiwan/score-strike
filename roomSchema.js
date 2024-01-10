const Joi = require("joi");

const roomSchema = Joi.object({
  roomId: Joi.string().required(),
  roomname: Joi.string().required(),
  winner: Joi.string().allow(null),
  currentTurn: Joi.string().required(),
  player1: Joi.object({
    playerId: Joi.string().required(),
    name: Joi.string().required(),
    score: Joi.number().integer().min(0).required(),
    chances: Joi.number().integer().min(0).required(),
  }).required(),
  player2: Joi.object({
    playerId: Joi.string().required(),
    name: Joi.string().required(),
    score: Joi.number().integer().min(0).required(),
    chances: Joi.number().integer().min(0).required(),
  }).allow(null),
});

const Room = roomSchema;

module.exports = Room;
