import {
    Body,
    Controller,
    Get,
    Logger,
    Param,
    Post,
    Put,
    Query,
    UsePipes,
    ValidationPipe,
} from '@nestjs/common';

import { CreateCategoryDto } from './dtos/createCategory.dto';
import { UpdateCategoryDto } from './dtos/updateCategory.dto';
import { Observable } from 'rxjs';
import { ClientProxyGameRanking } from '../proxyrmq/client-proxy';

@Controller('categorias')
export class CategoriesController {
    private logger = new Logger(CategoriesController.name);
    private clientAdminBackend;

    constructor(private clientProxyGameRanking: ClientProxyGameRanking) {
        this.clientAdminBackend =
            this.clientProxyGameRanking.getClientProxyAdminBackendInstance();
    }

    @Post()
    @UsePipes(ValidationPipe)
    createCategory(@Body() createCategoryDto: CreateCategoryDto) {
        // por usar o emit do broker, não há necessidade de usar return na função
        this.clientAdminBackend.emit('criar-categoria', createCategoryDto);
    }

    @Get()
    findCategories(@Query('idCatedoria') _id: string): Observable<any> {
        // send espera um retorno o um objeto categoria ou um array<Categorias>
        return this.clientAdminBackend.send(
            'consultar-categorias',
            _id ? _id : '',
        );
    }
    @Put('/:_id')
    @UsePipes(ValidationPipe)
    async updateCategory(
        @Param('_id') _id: string,
        @Body() updateCategoryDto: UpdateCategoryDto,
    ) {
        this.clientAdminBackend.emit('atualizar-categoria', {
            id: _id,
            updateCategory: updateCategoryDto,
        });
    }
}
