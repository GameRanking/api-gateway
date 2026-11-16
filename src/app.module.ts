import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProxyRMQModule } from './proxyrmq/proxyrmq.module';
import { ClientProxyGameRanking } from './proxyrmq/client-proxy';
import { CategoriesModule } from './categories/categories.module';
import { PlayersModule } from './players/players.module';
import { AwsModule } from './aws/aws.module';
import { ChallengesModule } from './challenges/challenges.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        ProxyRMQModule,
        CategoriesModule,
        PlayersModule,
        AwsModule,
        ChallengesModule,
    ],
    controllers: [],
    providers: [ClientProxyGameRanking],
})
export class AppModule {}
