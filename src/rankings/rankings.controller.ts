import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ClientProxyGameRanking } from '../proxyrmq/client-proxy';

@Controller('rankings')
export class RankingsController {
    private clientRankingsBackend;
    constructor(private clientProxyGameRanking: ClientProxyGameRanking) {
        this.clientRankingsBackend =
            this.clientProxyGameRanking.getClientProxyRankingsInstance();
    }

    @Get()
    findRankings(
        @Query('idCategoria') idCategory: string,
        @Query('dataRef') dateRef: string,
    ): Observable<any> {
        if (!idCategory) {
            throw new BadRequestException('o id da categoria é obrigatório');
        }

        return this.clientRankingsBackend.send('consultar-rankings', {
            idCategory: idCategory,
            dateRef: dateRef ? dateRef : '',
        });
    }
}
