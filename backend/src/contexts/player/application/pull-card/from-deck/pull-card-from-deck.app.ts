import {Logger} from '@nestjs/common';
import {UserId} from '../../../../user/domain/user-id';
import {Player} from '../../../domain/player';
import {SearchPlayerByUserApp} from '../../search/by-user/search-player-by-user.app';
import {PullCardAppUtils} from '../pull-card.app.utils';
import {SearchActiveMatchApp} from '../../../../match/application/search/active/search-active-match.app';
import {Match} from '../../../../match/domain/match';
import {UpdateMatchApp} from '../../../../match/application/update/update-match.app';
import {UpdatePlayerApp} from '../../update/update-player.app';
import {PullCardAppResponse} from '../pull-card.app.response';

export class PullCardFromDeckApp {

    private readonly logger: Logger = new Logger(PullCardFromDeckApp.name);

    constructor(
        private readonly searchPlayerByUserApp: SearchPlayerByUserApp,
        private readonly searchActiveMatchApp: SearchActiveMatchApp,
        private readonly updatePlayerApp: UpdatePlayerApp,
        private readonly updateMatchApp: UpdateMatchApp,
    ) {
    }

    async exec(userId: UserId): Promise<PullCardAppResponse> {
        this.logger.log(`[${this.exec.name}] INIT :: userId: ${userId.toString()}`);
        const player: Player = await this.searchPlayerByUserApp.exec(userId);
        PullCardAppUtils.validatePlayer(player);
        const match: Match = await this.searchActiveMatchApp.exec(player.gameId);
        match.pullFromDesk(player);
        const updatedMatch: Match = await this.updateMatchApp.exec(match);
        const updated: Player = await this.updatePlayerApp.exec(player);
        this.logger.log(`[${this.exec.name}] FINISH ::`);
        return {player: updated.toPrimitives(), match: updatedMatch.toPrimitives()};
    }
}