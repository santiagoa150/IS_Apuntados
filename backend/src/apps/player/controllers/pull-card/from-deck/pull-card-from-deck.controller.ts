import {AppController} from '../../../../shared/controllers/app.controller';
import {Controller, Patch, UseGuards} from '@nestjs/common';
import {PlayerConfigConstants} from '../../../config/player.config.constants';
import {ApiAcceptedResponse, ApiBearerAuth, ApiTags} from '@nestjs/swagger';
import {JwtGuard} from '../../../../../contexts/user/infrastructure/passport/jwt.guard';
import {PullCardControllerResponse} from '../pull-card.controller.response';
import {
    PullCardFromDeckCommand
} from '../../../../../contexts/player/application/pull-card/from-deck/pull-card-from-deck.command';
import {PlayerDto} from '../../../../../contexts/player/domain/player.dto';
import {IUserDecorator, User} from '../../../../../contexts/user/domain/user.decorator';
import {PullCardAppResponse} from '../../../../../contexts/player/application/pull-card/pull-card.app.response';

@Controller(PlayerConfigConstants.CONTROLLER_PREFIX)
@ApiTags(PlayerConfigConstants.API_TAG)
@ApiBearerAuth()
export class PullCardFromDeckController extends AppController {

    @Patch(PlayerConfigConstants.PULL_CARD_FROM_DECK)
    @UseGuards(JwtGuard)
    @ApiAcceptedResponse({type: PullCardControllerResponse})
    async controller(
        @User() user: IUserDecorator,
    ): Promise<PullCardControllerResponse> {
        const response: PullCardControllerResponse = new PullCardControllerResponse();
        response.data = await this.dispatch<PullCardAppResponse, PullCardFromDeckCommand>(new PullCardFromDeckCommand(user.userId));
        return response;
    }
}