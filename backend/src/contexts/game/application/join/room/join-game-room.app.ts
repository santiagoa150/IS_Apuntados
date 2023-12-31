import {Logger} from '@nestjs/common';
import {GameId} from '../../../domain/game-id';
import {SearchGameByIdApp} from '../../search/by-id/search-game-by-id.app';
import {Game} from '../../../domain/game';
import {GameSocket} from '../../../../../apps/game/sockets/game.socket';
import {GameEventsConstants} from '../../../domain/game-events.constants';
import {UpdateGameApp} from '../../update/update-game.app';
import {GameStatusConstants} from '../../../domain/game-status.constants';
import {GameStatus} from '../../../domain/game-status';
import {CreateMatchApp} from '../../../../match/application/create/create-match.app';
import {
    SearchPlayerByPositionApp
} from '../../../../player/application/search/by-position/search-player-by-position.app';
import {Player} from '../../../../player/domain/player';

export class JoinGameRoomApp {

    private readonly logger: Logger = new Logger(JoinGameRoomApp.name);

    constructor(
        private readonly searchGameByIdApp: SearchGameByIdApp,
        private readonly searchPlayerByPositionApp: SearchPlayerByPositionApp,
        private readonly updateGameApp: UpdateGameApp,
        private readonly crateMatchApp: CreateMatchApp,
        private readonly socket: GameSocket,
    ) {
    }

    public async exec(gameId: GameId): Promise<void> {
        this.logger.log(`[${this.exec.name}] INIT :: gameId: ${gameId.toString()}`);
        const game: Game = await this.searchGameByIdApp.exec(gameId);
        if (game.status.toString() !== GameStatusConstants.WAITING_PLAYERS) return;
        this.socket.wsServer
            .in(gameId.toString())
            .emit(GameEventsConstants.EVENT_JOIN_GAME);
        if (game.requiredPlayers === game.totalPlayers) {
            const updated: Game = await this.updateGame(game);
            await this.crateMatchApp.exec(updated);
            this.socket.wsServer
                .in(gameId.toString())
                .emit(GameEventsConstants.EVENT_START_GAME);
            await this.notifyStartPlayer(gameId);
        }
        this.logger.log(`[${this.exec.name}] FINISH ::`);
    }

    private async notifyStartPlayer(gameId: GameId): Promise<void> {
        const player: Player = await this.searchPlayerByPositionApp.exec(gameId, 1);
        this.socket.wsServer
            .in(player.playerId.toString())
            .emit(GameEventsConstants.EVENT_START_TURN);
    }

    private async updateGame(game: Game): Promise<Game> {
        game.status = new GameStatus(GameStatusConstants.ACTIVE);
        return this.updateGameApp.exec(game);
    }
}