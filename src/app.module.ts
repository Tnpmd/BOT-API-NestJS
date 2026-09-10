import { Module } from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller.js';

import { AppService } from './app.service.js';

import { ExchangeRateModule } from './quarterly-exchange-rate/exchange-rate.module.js';

@Module({
  imports: [
    // โหลดค่าจากไฟล์ .env
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // นำ Feature Quarterly Exchange Rate เข้ามาใช้งาน
    ExchangeRateModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}