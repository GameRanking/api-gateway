import { Player } from '../../players/interfaces/player.interface';
import { ChallengeStatus } from '../challenge-status.enum';

export interface Challenge {
    dateTimeChallenge: Date;
    status: ChallengeStatus;
    dateTimeRequest: Date;
    dateTimeResponse: Date;
    requestor: Player;
    category: string;
    match?: string;
    players: Array<Player>;
}
