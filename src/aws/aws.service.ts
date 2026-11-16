import { Injectable, Logger } from '@nestjs/common';
import {
    PutObjectCommand,
    S3Client,
    S3ServiceException,
} from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import type { File } from '../common/interfaces/file.interface';

@Injectable()
export class AwsService {
    private logger = new Logger(AwsService.name);
    constructor(private readonly configService: ConfigService) {}

    public async uploadFile(file: File, id: string) {
        const accessKeyId = this.configService.get<string>('AWS_ACESSKEY');
        const secretAccessKey =
            this.configService.get<string>('AWS_SECRETACESSKEY');
        const bucket = this.configService.get<string>('AWS_BUCKET');

        const region = this.configService.get<string>('AWS_REGION');
        const awsDomain = 'amazonaws.com/';
        if (!accessKeyId || !secretAccessKey || !bucket) {
            throw new Error('AWS credentials or bucket are not configured');
        }

        const s3Client = new S3Client({
            region: region,
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
        });

        // arquivo salvo no bucket (id do jogador.extensção do arquivo)
        const fileExtension = file.originalname.split('.')[1];
        const urlKey = `${id}.${fileExtension}`;

        this.logger.log(`urlKey (url da foto jogador no bucket s3): ${urlKey}`);
        const params = {
            Bucket: bucket,
            Key: urlKey,
            Body: file.buffer,
        };
        try {
            await s3Client.send(new PutObjectCommand(params));
            return {
                // url da imagem no bucket s3 da aws
                url: `http://${bucket}.s3.${region}.${awsDomain}${urlKey}`,
            };
        } catch (error: unknown) {
            const errorMessage = `Error from S3 while uploading object to ${bucket}. \
The object was too large. To upload objects larger than 5GB, use the S3 console (160GB max) \
or the multipart upload API (5TB max).`;
            if (
                error instanceof S3ServiceException &&
                error.name === 'EntityTooLarge'
            ) {
                this.logger.error(errorMessage);
            } else if (error instanceof S3ServiceException) {
                this.logger.error(
                    `Error from S3 while uploading object to ${bucket}.  ${error.name}: ${error.message}`,
                );
            } else {
                throw error;
            }
        }
    }
}
