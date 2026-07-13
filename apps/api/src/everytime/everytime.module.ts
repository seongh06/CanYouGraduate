import { Module } from '@nestjs/common';
import { EverytimeController } from './everytime.controller';
import { EverytimeCrawlerService } from './everytime-crawler.service';
import { EverytimeTextParserService } from './everytime-text-parser.service';
import { EverytimeService } from './everytime.service';

@Module({
  controllers: [EverytimeController],
  providers: [EverytimeService, EverytimeCrawlerService, EverytimeTextParserService],
})
export class EverytimeModule {}
