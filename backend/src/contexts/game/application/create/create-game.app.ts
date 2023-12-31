import {Logger} from '@nestjs/common';
import {Game} from '../../domain/game';
import {UserId} from '../../../user/domain/user-id';
import {User} from '../../../user/domain/user';
import {SearchUserByIdApp} from '../../../user/application/search/by-id/search-user-by-id.app';
import {IGameRepository} from '../../domain/i-game.repository';
import {NotEnoughTokensException} from '../../../user/domain/exceptions/not-enough-tokens.exception';
import {UserStatusConstants} from '../../../user/domain/user-status.constants';
import {UserIsAlreadyPlayingException} from '../../../user/domain/exceptions/user-is-already-playing.exception';
import {GameId} from '../../domain/game-id';
import {GameStatusConstants} from '../../domain/game-status.constants';
import {InvalidRequiredPlayersException} from '../../domain/exceptions/invalid-required-players.exception';
import {UpdateUserApp} from '../../../user/application/update/one/update-user.app';
import {UserStatus} from '../../../user/domain/user-status';
import {CreatePlayerApp} from '../../../player/application/create/create-player.app';
import {GameCode} from '../../domain/game-code';
import {TryAgainLaterException} from '../../../shared/domain/exceptions/try-again-later.exception';

export class CreateGameApp {

    private readonly logger: Logger = new Logger(CreateGameApp.name);

    constructor(
        private readonly searchUserByIdApp: SearchUserByIdApp,
        private readonly updateUserApp: UpdateUserApp,
        private readonly createPlayerApp: CreatePlayerApp,
        private readonly repository: IGameRepository,
    ) {
    }

    private static map(
        userId: UserId,
        requiredPlayers: number,
        isPublic: boolean,
        totalBet: number,
        name: string,
        code: GameCode,
    ): Game {
        return Game.fromPrimitives({
            creatorId: userId.toString(),
            gameId: GameId.create().toString(),
            code: code.toString(),
            isPublic,
            name,
            requiredPlayers,
            status: GameStatusConstants.WAITING_PLAYERS,
            totalBet,
            totalPlayers: 1,
            currentPlayers: 1,
        });
    }

    async exec(
        userId: UserId,
        requiredPlayers: number,
        isPublic: boolean,
        totalBet: number,
        name: string,
    ): Promise<Game> {
        this.logger.log(`[${this.exec.name}] INIT :: name: ${name}, isPublic: ${isPublic}, requiredPlayers: ${requiredPlayers}`);
        const user: User = await this.searchUserByIdApp.exec(userId);
        this.validateUser(user, totalBet);
        this.validateRequiredPlayers(requiredPlayers);
        const code: GameCode = await this.generateCode();
        const game: Game = CreateGameApp.map(userId, requiredPlayers, isPublic, totalBet, name, code);
        const created: Game = await this.repository.create(game);
        await this.createPlayerApp.exec(userId, user.username, user.icon, user.cardDesign, game.gameId);
        await this.updateUser(user, totalBet);
        this.logger.log(`[${this.exec.name}] FINISH ::`);
        return created;
    }

    private async generateCode(): Promise<GameCode> {
        this.logger.log(`[${this.generateCode.name}] Creating Code ::`);
        for (let attempts: number = 0; attempts < 3; attempts++) {
            const code: GameCode = GameCode.create();
            if (!(await this.repository.findByCode(code))) return code;
        }
        throw new TryAgainLaterException();
    }

    private async updateUser(user: User, totalBet: number): Promise<void> {
        user.removeTokens(totalBet);
        user.status = new UserStatus(UserStatusConstants.PLAYING);
        await this.updateUserApp.exec(user);
    }

    private validateUser(user: User, totalBet: number): void {
        if (totalBet > user.getTokens()) throw new NotEnoughTokensException();
        if (user.status.toString() === UserStatusConstants.PLAYING) throw new UserIsAlreadyPlayingException();
    }

    private validateRequiredPlayers(requiredPlayers: number): void {
        if (requiredPlayers < 2 || requiredPlayers > 6) throw new InvalidRequiredPlayersException();
    }
}