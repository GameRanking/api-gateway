import { Injectable } from '@nestjs/common';
import {
    ClientProxy,
    ClientProxyFactory,
    Transport,
} from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ClientProxyGameRanking {
    private readonly user: string;
    private readonly password: string;
    private readonly host: string;
    private readonly vhost: string;
    private readonly rmqProtocol: string;
    private readonly rmqQueue: string;
    private readonly rmqQueueChallenge: string;
    private readonly rmqQueueRankings: string;
    private readonly url: string;

    constructor(private readonly configService: ConfigService) {
        this.user = this.configService.get<string>('RABBITMQ_USER')!;
        this.password = this.configService.get<string>('RABBITMQ_PASSWORD')!;
        this.host = this.configService.get<string>('RABBITMQ_HOST')!;

        this.vhost = this.configService.get<string>('RABBITMQ_VIRTUAL_HOST')!;
        this.rmqProtocol = this.configService.get<string>('RABBITMQ_PROTOCOL')!;

        this.rmqQueue = this.configService.get<string>(
            'RABBITMQ_QUEUE_ADMIN_BACKEND',
        )!;
        this.rmqQueueChallenge = this.configService.get<string>(
            'RABBITMQ_QUEUE_CHALLENGE',
        )!;

        this.rmqQueueRankings = this.configService.get<string>(
            'RABBITMQ_QUEUE_RANKINGS',
        )!;

        this.url = `${this.rmqProtocol}${this.user}:${this.password}@${this.host}${this.vhost}`;
    }

    getClientProxyAdminBackendInstance(): ClientProxy {
        return ClientProxyFactory.create({
            transport: Transport.RMQ,
            options: {
                urls: [this.url],
                queue: this.rmqQueue,
            },
        });
    }

    getClientProxyChallengesInstance(): ClientProxy {
        return ClientProxyFactory.create({
            transport: Transport.RMQ,
            options: {
                urls: [this.url],
                queue: this.rmqQueueChallenge,
            },
        });
    }

    getClientProxyRankingsInstance(): ClientProxy {
        return ClientProxyFactory.create({
            transport: Transport.RMQ,
            options: {
                urls: [this.url],
                queue: this.rmqQueueRankings,
            },
        });
    }
}
