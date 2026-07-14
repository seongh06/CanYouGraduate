import { Module } from '@nestjs/common';
import { CourseOfferingMatcherService } from './course-offering-matcher.service';
import { EverytimeController } from './everytime.controller';
import { EverytimeCrawlerService } from './everytime-crawler.service';
import { EverytimeTextParserService } from './everytime-text-parser.service';
import { EverytimeService } from './everytime.service';

@Module({
  controllers: [EverytimeController],
  providers: [EverytimeService, EverytimeCrawlerService, EverytimeTextParserService, CourseOfferingMatcherService],
})
export class EverytimeModule {}
