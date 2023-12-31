import {
    SearchPublicGamesQueryHandler
} from '../../../contexts/game/application/search/public/search-public-games.query-handler';
import {CreateGameCommandHandler} from '../../../contexts/game/application/create/create-game.command-handler';
import {JoinGameCommandHandler} from '../../../contexts/game/application/join/join-game.command-handler';
import {JoinGameRoomCommandHandler} from '../../../contexts/game/application/join/room/join-game-room.command-handler';
import {
    SearchGameByIdQueryHandler
} from '../../../contexts/game/application/search/by-id/search-game-by-id.query-handler';
import {LeaveGameCommandHandler} from '../../../contexts/game/application/leave/leave-game.command-handler';

const CommandHandlers = [
    CreateGameCommandHandler,
    JoinGameCommandHandler,
    JoinGameRoomCommandHandler,
    LeaveGameCommandHandler,
];

const QueryHandlers = [
    SearchGameByIdQueryHandler,
    SearchPublicGamesQueryHandler,
];
export const GameCqrsConfig = [
    ...CommandHandlers,
    ...QueryHandlers,
];