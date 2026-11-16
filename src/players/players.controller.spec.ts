import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { ClientProxyGameRanking } from '../proxyrmq/client-proxy';
import { PlayersController } from './players.controller';
import { CreatePlayerDto } from './dtos/createPlayer.dto';

describe('PlayersController', () => {
    let controller: PlayersController;
    const clientAdminBackend = {
        send: jest.fn(),
        emit: jest.fn(),
    };

    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            controllers: [PlayersController],
            providers: [
                {
                    provide: ClientProxyGameRanking,
                    useValue: {
                        getClientProxyAdminBackendInstance: jest
                            .fn()
                            .mockReturnValue(clientAdminBackend),
                    },
                },
            ],
        }).compile();

        controller = module.get<PlayersController>(PlayersController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('criarJogador', () => {
        const player: CreatePlayerDto = {
            phoneNumber: '11999999999',
            email: 'player@example.com',
            name: 'Player One',
            category: 'action',
        };

        it('should create a player when the category exists', async () => {
            clientAdminBackend.send.mockResolvedValue(true);

            await controller.criarJogador(player);

            expect(clientAdminBackend.send).toHaveBeenCalledWith(
                'consultar-categorias',
                player.category,
            );
            expect(clientAdminBackend.emit).toHaveBeenCalledWith(
                'criar-jogador',
                player,
            );
        });

        it('should reject when the category does not exist', async () => {
            clientAdminBackend.send.mockResolvedValue(null);

            await expect(controller.criarJogador(player)).rejects.toThrow(
                BadRequestException,
            );

            expect(clientAdminBackend.emit).not.toHaveBeenCalled();
        });
    });

    describe('findPlayers', () => {
        it('should query by player id when provided', () => {
            const players = [{ id: 'player-1' }];
            const response = of(players);
            clientAdminBackend.send.mockReturnValue(response);

            expect(controller.findPlayers('player-1')).toBe(response);
            expect(clientAdminBackend.send).toHaveBeenCalledWith(
                'consultar-jogadores',
                'player-1',
            );
        });

        it('should query all players when no id is provided', () => {
            clientAdminBackend.send.mockReturnValue(of([]));

            controller.findPlayers('');

            expect(clientAdminBackend.send).toHaveBeenCalledWith(
                'consultar-jogadores',
                '',
            );
        });
    });

    describe('updatePlayer', () => {
        const player = {
            phoneNumber: '11999999999',
            name: 'Updated Player',
            category: 'action',
        };

        it('should update a player when the category exists', async () => {
            clientAdminBackend.send.mockResolvedValue(true);

            await controller.updatePlayer(player, 'player-1');

            expect(clientAdminBackend.send).toHaveBeenCalledWith(
                'consultar-categorias',
                player.category,
            );
            expect(clientAdminBackend.emit).toHaveBeenCalledWith(
                'atualizar-jogador',
                { id: 'player-1', updatePlayer: player },
            );
        });

        it('should reject when the category does not exist', async () => {
            clientAdminBackend.send.mockResolvedValue(null);

            await expect(
                controller.updatePlayer(player, 'player-1'),
            ).rejects.toThrow(BadRequestException);

            expect(clientAdminBackend.emit).not.toHaveBeenCalled();
        });
    });

    describe('deletePlayer', () => {
        it('should emit the player deletion event', async () => {
            await controller.deletePlayer('player-1');

            expect(clientAdminBackend.emit).toHaveBeenCalledWith(
                'deletar-jogador',
                { _id: 'player-1' },
            );
        });
    });
});
