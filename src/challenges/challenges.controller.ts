import {
    Controller,
    Post,
    UsePipes,
    ValidationPipe,
    Body,
    Get,
    Query,
    Put,
    Param,
    Delete,
    Logger,
    BadRequestException,
} from '@nestjs/common';
import { CreateChallengeDto } from './dtos/create-challenge.dto';
import { ChallengeStatusValidationPipe } from './pipes/challenge-status-validation.pipe';
import { LinkChallengeMatchDto } from './dtos/link-challenge-match.dto';
import { UpdateChallengeDto } from './dtos/update-challenge.dto';
import { ClientProxyGameRanking } from '../proxyrmq/client-proxy';
import { Player } from '../players/interfaces/player.interface';
import { Challenge } from '../challenges/interfaces/challenge.interface';
import { ChallengeStatus } from './challenge-status.enum';
import { Match } from './interfaces/match.interface';

@Controller('desafios')
export class ChallengesController {
    private readonly logger = new Logger(ChallengesController.name);
    private clientChallenge: any;
    private clientAdminBackend: any;

    constructor(private clientProxyGameRanking: ClientProxyGameRanking) {
        this.clientChallenge =
            this.clientProxyGameRanking.getClientProxyChallengesInstance();
        this.clientAdminBackend =
            this.clientProxyGameRanking.getClientProxyAdminBackendInstance();
    }
    /*
        Criamos um proxy específico para lidar com o microservice
        desafios
    */

    @Post()
    @UsePipes(ValidationPipe)
    async createChallenge(@Body() createChallengeDto: CreateChallengeDto) {
        this.logger.log(
            `criarDesafioDto: ${JSON.stringify(createChallengeDto)}`,
        );

        /*
                Validações relacionadas ao array de jogadores que participam
                do desafio
            */
        const players: Player[] = await this.clientAdminBackend
            .send('consultar-jogadores', '')
            .toPromise();

        createChallengeDto.players.map((playerDto) => {
            const playerFilter: Player[] = players.filter(
                (player) => player._id == playerDto._id,
            );

            this.logger.log(`jogadorFilter: ${JSON.stringify(playerFilter)}`);

            /*
                    Verificamos se os jogadores do desafio estão cadastrados
                */
            if (playerFilter.length == 0) {
                throw new BadRequestException(
                    `O id ${playerDto._id} não é um jogador!`,
                );
            }

            /*
                    Verificar se os jogadores fazem parte da categoria informada no
                    desafio 
                */
            if (playerFilter[0].category != createChallengeDto.category) {
                throw new BadRequestException(
                    `O jogador ${playerFilter[0]._id} não faz parte da categoria informada!`,
                );
            }
        });

        /*
                Verificamos se o solicitante é um jogador da partida
            */
        const requesterIsPlayerOfMatch: Player[] =
            createChallengeDto.players.filter(
                (player) => player._id == createChallengeDto.requester,
            );

        this.logger.log(
            `solicitanteEhJogadorDaPartida: ${JSON.stringify(requesterIsPlayerOfMatch)}`,
        );

        if (requesterIsPlayerOfMatch.length == 0) {
            throw new BadRequestException(
                `O solicitante deve ser um jogador da partida!`,
            );
        }

        /*
                Verificamos se a categoria está cadastrada
            */
        const category = await this.clientAdminBackend
            .send('consultar-categorias', createChallengeDto.category)
            .toPromise();

        this.logger.log(`categoria: ${JSON.stringify(category)}`);

        if (!category) {
            throw new BadRequestException(`Categoria informada não existe!`);
        }

        await this.clientChallenge.emit('criar-desafio', createChallengeDto);
    }

    @Get()
    async findChallenges(@Query('idJogador') idPlayer: string): Promise<any> {
        /*
            Verificamos se o jogador informado está cadastrado
        */
        if (idPlayer) {
            const player: Player = await this.clientAdminBackend
                .send('consultar-jogadores', idPlayer)
                .toPromise();
            this.logger.log(`jogador: ${JSON.stringify(player)}`);
            if (!player) {
                throw new BadRequestException(`Jogador não cadastrado!`);
            }
        }
        /*
            No microservice desafios, o método responsável por consultar os desafios
            espera a estrutura abaixo, onde:
            - Se preenchermos o idPlayer a consulta de desafios será pelo id do 
            jogador informado
            - Se preenchermos o campo _id a consulta será pelo id do desafio
            - Se não preenchermos nenhum dos dois campos a consulta irá retornar
            todos os desafios cadastrados
        */
        return this.clientChallenge.send('consultar-desafios', {
            idPlayer: idPlayer,
            _id: '',
        });
    }

    @Put('/:desafio')
    async updateChallenge(
        @Body(ChallengeStatusValidationPipe)
        UpdateChallengeDto: UpdateChallengeDto,
        @Param('desafio') _id: string,
    ) {
        /*
                Validações em relação ao desafio
            */

        const challenge: Challenge = await this.clientChallenge
            .send('consultar-desafios', { idPlayer: '', _id: _id })
            .toPromise();

        this.logger.log(`desafio: ${JSON.stringify(challenge)}`);

        /*
                Verificamos se o desafio está cadastrado
            */
        if (!challenge) {
            throw new BadRequestException(`Desafio não cadastrado!`);
        }

        /*
                Somente podem ser atualizados desafios com status PENDENTE
            */
        if (challenge.status != ChallengeStatus.PENDENTE) {
            throw new BadRequestException(
                'Somente desafios com status PENDENTE podem ser atualizados!',
            );
        }

        await this.clientChallenge.emit('atualizar-desafio', {
            id: _id,
            desafio: UpdateChallengeDto,
        });
    }

    @Post('/:desafio/partida/')
    async linkChallengeToMatch(
        @Body(ValidationPipe) linkChallengeMatchDto: LinkChallengeMatchDto,
        @Param('desafio') _id: string,
    ) {
        const challenge: Challenge = await this.clientChallenge.send(
            'consultar-desafios',
            { idPlayer: '', _id: _id },
        );

        this.logger.log(`desafio: ${JSON.stringify(challenge)}`);

        /*
            Verificamos se o desafio está cadastrado
        */
        if (!challenge) {
            throw new BadRequestException(`Desafio não cadastrado!`);
        }

        /*
            Verificamos se o desafio já foi realizado
        */

        if (challenge.status == ChallengeStatus.REALIZADO) {
            throw new BadRequestException(`Desafio já realizado!`);
        }

        /*
            Somente deve ser possível lançar uma partida para um desafio
            com status ACEITO
        */

        if (challenge.status != ChallengeStatus.ACEITO) {
            throw new BadRequestException(
                `Partidas somente podem ser lançadas em desafios aceitos pelos adversários!`,
            );
        }

        /*
            Verificamos se o jogador informado faz parte do desafio
        */
        if (!challenge.players.includes(linkChallengeMatchDto.def)) {
            throw new BadRequestException(
                `O jogador vencedor da partida deve fazer parte do desafio!`,
            );
        }

        /*
            Criamos nosso objeto partida, que é formado pelas
            informações presentes no Dto que recebemos e por informações
            presentes no objeto desafio que recuperamos 
        */
        const match: Match = {};
        match.category = challenge.category;
        match.def = linkChallengeMatchDto.def;
        match.challenge = _id;
        match.players = challenge.players;
        match.result = linkChallengeMatchDto.result;

        /*
            Enviamos a partida para o tópico 'criar-partida'
            Este tópico é responsável por persitir a partida na 
            collection Partidas
        */
        await this.clientChallenge.emit('criar-partida', match);
    }

    @Delete('/:_id')
    async deleteChallenge(@Param('_id') _id: string) {
        const challenge: Challenge = await this.clientChallenge.send(
            'consultar-desafios',
            { idPlayer: '', _id: _id },
        );

        this.logger.log(`desafio: ${JSON.stringify(challenge)}`);

        /*
            Verificamos se o desafio está cadastrado
        */
        if (!challenge) {
            throw new BadRequestException(`Desafio não cadastrado!`);
        }

        await this.clientChallenge.emit('deletar-desafio', challenge);
    }
}
