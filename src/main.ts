import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import moment from 'moment-timezone';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.useGlobalInterceptors(
        new LoggingInterceptor(),
        new TimeoutInterceptor(),
    );
    app.setGlobalPrefix('api/v1');
    app.useGlobalFilters(new AllExceptionsFilter());

    await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
