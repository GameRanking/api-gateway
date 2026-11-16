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
    private readonly url: string;

    constructor(private readonly configService: ConfigService) {
        this.user = this.configService.get<string>('RABBITMQ_USER')!;
        this.password = this.configService.get<string>('RABBITMQ_PASSWORD')!;
        this.host = this.configService.get<string>('RABBITMQ_HOST')!;

        this.vhost = this.configService.get<string>('RABBITMQ_VIRTUAL_HOST')!;
        this.rmqProtocol = this.configService.get<string>('RABBITMQ_PROTOCOL')!;
        this.rmqQueue = this.configService.get<string>('RABBITMQ_QUEUE')!;

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
}
