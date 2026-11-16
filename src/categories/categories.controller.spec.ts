import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { ClientProxyGameRanking } from '../proxyrmq/client-proxy';
import { CategoriesController } from './categories.controller';
import { CreateCategoryDto } from './dtos/createCategory.dto';

describe('CategoriesController', () => {
    let controller: CategoriesController;
    const clientAdminBackend = {
        send: jest.fn(),
        emit: jest.fn(),
    };

    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            controllers: [CategoriesController],
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

        controller = module.get<CategoriesController>(CategoriesController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('createCategory', () => {
        it('should emit the category creation event', () => {
            const category: CreateCategoryDto = {
                category: 'action',
                description: 'Action games',
                events: [{ name: 'first-place', operation: '+', value: 10 }],
            };

            controller.createCategory(category);

            expect(clientAdminBackend.emit).toHaveBeenCalledWith(
                'criar-categoria',
                category,
            );
        });
    });

    describe('findCategories', () => {
        it('should query by category id when provided', () => {
            const categories = [{ id: 'category-1' }];
            const response = of(categories);
            clientAdminBackend.send.mockReturnValue(response);

            expect(controller.findCategories('category-1')).toBe(response);
            expect(clientAdminBackend.send).toHaveBeenCalledWith(
                'consultar-categorias',
                'category-1',
            );
        });

        it('should query all categories when no id is provided', () => {
            clientAdminBackend.send.mockReturnValue(of([]));

            controller.findCategories('');

            expect(clientAdminBackend.send).toHaveBeenCalledWith(
                'consultar-categorias',
                '',
            );
        });
    });

    describe('updateCategory', () => {
        it('should emit the category update event with its id and data', async () => {
            const category = {
                description: 'Updated description',
                events: [{ name: 'first-place', operation: '+', value: 15 }],
            };

            await controller.updateCategory('category-1', category);

            expect(clientAdminBackend.emit).toHaveBeenCalledWith(
                'atualizar-categoria',
                { id: 'category-1', updateCategory: category },
            );
        });
    });
});
