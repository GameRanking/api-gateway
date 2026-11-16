import { Module } from '@nestjs/common';
import { ChallengesController } from './challenges.controller';
import { ClientProxyGameRanking } from '../proxyrmq/client-proxy';

@Module({
    controllers: [ChallengesController],
    providers: [ClientProxyGameRanking],
})
export class ChallengesModule {}
