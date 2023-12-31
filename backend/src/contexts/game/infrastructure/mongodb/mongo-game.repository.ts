import {IGameRepository} from '../../domain/i-game.repository';
import {Logger} from '@nestjs/common';
import {Model} from 'mongoose';
import {GameDocument} from './game-document';
import {Game} from '../../domain/game';
import {GameDto} from '../../domain/game.dto';
import {GameStatusConstants} from '../../domain/game-status.constants';
import {GameCode} from '../../domain/game-code';
import {GameId} from '../../domain/game-id';

export class MongoGameRepository implements IGameRepository {

    private readonly logger: Logger = new Logger(MongoGameRepository.name);

    constructor(private readonly model: Model<GameDocument>) {
    }

    public async create(game: Game): Promise<Game> {
        this.logger.log(`[${this.create.name}] INIT ::`);
        const model = new this.model(game.toPrimitives());
        await model.save();
        const mapped: Game = Game.fromPrimitives(model);
        this.logger.log(`[${this.create.name}] FINISH ::`);
        return mapped;
    }

    public async findPublic(): Promise<Array<Game>> {
        const found: Array<GameDto> = await this.model.find({
            isPublic: true,
            status: GameStatusConstants.WAITING_PLAYERS
        });
        return found.map(Game.fromPrimitives);
    }

    public async findByCode(code: GameCode): Promise<Game> {
        this.logger.log(`[${this.findByCode.name}] INIT :: code: ${code.toString()}`);
        const found: GameDto = await this.model.findOne({code: code.toString()});
        const mapped: Game = found ? Game.fromPrimitives(found) : undefined;
        this.logger.log(`[${this.findByCode.name}] FINISH ::`);
        return mapped;
    }

    public async update(game: Game): Promise<Game> {
        this.logger.log(`[${this.update.name}] INIT :: Updating :: ${game.gameId.toString()}`);
        const {gameId, ...toUpdate}: GameDto = game.toPrimitives();
        const updated: GameDto = await this.model.findOneAndUpdate({gameId}, toUpdate, {new: true});
        const mapped: Game = updated ? Game.fromPrimitives(updated) : undefined;
        this.logger.log(`[${this.update.name}] FINISH ::`);
        return mapped;
    }

    async findById(gameId: GameId): Promise<Game> {
        this.logger.log(`[${this.findById.name}] INIT :: gameId: ${gameId.toString()}`);
        const found: GameDto = await this.model.findOne({gameId: gameId.toString()});
        const mapped: Game = found ? Game.fromPrimitives(found) : undefined;
        this.logger.log(`[${this.findById.name}] FINISH ::`);
        return mapped;
    }
}