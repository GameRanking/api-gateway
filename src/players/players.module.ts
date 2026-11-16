import { Module } from '@nestjs/common';
import { ProxyRMQModule } from '../proxyrmq/proxyrmq.module';
import { PlayersController } from './players.controller';
import { AwsModule } from '../aws/aws.module';

@Module({
    imports: [ProxyRMQModule, AwsModule],
    controllers: [PlayersController],
    providers: [],
})
export class PlayersModule {}
