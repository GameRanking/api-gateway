import {
    IsNotEmpty,
    IsArray,
    ArrayMinSize,
    ArrayMaxSize,
    IsDateString,
} from 'class-validator';
import { Player } from '../../players/interfaces/player.interface';

export class CreateChallengeDto {
    @IsNotEmpty()
    @IsDateString()
    dateTimeChallenge: Date;

    @IsNotEmpty()
    requester: string;

    @IsNotEmpty()
    category: string;

    @IsArray()
    @ArrayMinSize(2)
    @ArrayMaxSize(2)
    players: Player[];
}
