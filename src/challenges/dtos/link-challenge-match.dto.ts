import { IsNotEmpty } from 'class-validator';
import type { Result } from '../interfaces/match.interface';
import type { Player } from '../../players/interfaces/player.interface';

export class LinkChallengeMatchDto {
    @IsNotEmpty()
    def: Player;

    @IsNotEmpty()
    result: Array<Result>;
}
