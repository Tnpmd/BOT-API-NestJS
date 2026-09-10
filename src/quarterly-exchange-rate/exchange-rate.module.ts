import { Module } from "@nestjs/common";
import { ExchangeRateController } from "./exchange-rate.controller.js";
import { ExchangeRateService } from "./exchange-rate.service.js";

//Module สำหรับจัดการ Feature Quarterly Exchange Rate
@Module({
    controllers: [ExchangeRateController],
    providers: [ExchangeRateService]
})
export class ExchangeRateModule {}