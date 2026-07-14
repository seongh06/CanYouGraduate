import { Module } from '@nestjs/common';
import { CatalogCrawlerService } from './catholic-university/catalog-crawler.service';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';

@Module({
  controllers: [CatalogController],
  providers: [CatalogService, CatalogCrawlerService],
})
export class CatalogModule {}
