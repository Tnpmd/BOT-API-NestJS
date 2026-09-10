import { Controller, Get, Query } from '@nestjs/common';
import { ExchangeRateService } from './exchange-rate.service.js';
import { ExchangeRateQueryDto } from './dto/exchange-rate-query.dto.js';

// Controller สำหรับรับ Request ของ Quarterly Exchange Rate
@Controller('quarterly-change')
export class ExchangeRateController {
  constructor(
    private readonly exchangeRateService: ExchangeRateService,
  ) {}

  // รับข้อมูล year และ quarter จาก Query Parameter
  @Get()
  async getQuarterlyExchangeRate(
    @Query() query: ExchangeRateQueryDto,
  ) {
    // ส่งข้อมูลไปให้ Service ประมวลผล
    return this.exchangeRateService.getQuarterlyExchangeRate(query);
  }
}