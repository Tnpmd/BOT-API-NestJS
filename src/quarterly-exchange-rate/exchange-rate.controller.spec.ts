import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { ExchangeRateController } from './exchange-rate.controller.js';
import { ExchangeRateService } from './exchange-rate.service.js';
import {
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';

describe('ExchangeRateController', () => {
  let controller: ExchangeRateController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExchangeRateController],
      providers: [
        {
          // ใช้ ExchangeRateService จริงเป็นตัวอ้างอิง
          provide: ExchangeRateService,

          // จำลอง Service เพื่อไม่ต้องเรียก BOT API จริง
          useValue: {
            getQuarterlyExchangeRate: jest.fn(),
          },
        },
      ],
    }).compile();

    // ดึง Controller ที่สร้างจาก TestingModule มาใช้งาน
    controller = module.get<ExchangeRateController>(ExchangeRateController);
  });

  // ตรวจสอบกรณีที่ Controller เรียก Service ได้สำเร็จ
  it('should return quarterly exchange rate data', async () => {
    // จำลองผลลัพธ์ที่ Service จะส่งกลับมา
    const mockResult = {
      year: 2025,
      quarter: 'Q1',
      averageRate: 33.9542,
      previousQuarter: {
        year: 2024,
        quarter: 'Q4',
        averageRate: 34.2,
      },
      changeFromPreviousQuarter: -0.7187134502923976,
    };

    // จำลองให้ Service ส่งข้อมูลที่กำหนดกลับมา
    jest
      .spyOn(controller['exchangeRateService'], 'getQuarterlyExchangeRate')
      .mockResolvedValue(mockResult);

    // เรียก Controller โดยส่ง year และ quarter เข้าไป
    const result = await controller.getQuarterlyExchangeRate({
      year: '2025',
      quarter: 'Q1',
    });

    // ตรวจสอบว่า Controller ส่งผลลัพธ์จาก Service กลับมา
    expect(result).toEqual(mockResult);
  });

  // ตรวจสอบกรณีที่ข้อมูลที่ส่งเข้ามาไม่ถูกต้อง
  it('should throw BadRequestException when query is invalid', async () => {
    // จำลองให้ Service โยน BadRequestException
    jest
      .spyOn(controller['exchangeRateService'], 'getQuarterlyExchangeRate')
      .mockRejectedValue(new BadRequestException('Invalid year.'));

    // เรียก Controller ด้วยข้อมูลที่ไม่ถูกต้อง
    await expect(
      controller.getQuarterlyExchangeRate({
        year: 'abc',
        quarter: 'Q1',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  // ตรวจสอบกรณีที่ไม่พบข้อมูลอัตราแลกเปลี่ยน
  it('should throw NotFoundException when exchange rate data is not found', async () => {
    // จำลองให้ Service โยน NotFoundException
    jest
      .spyOn(controller['exchangeRateService'], 'getQuarterlyExchangeRate')
      .mockRejectedValue(
        new NotFoundException('Exchange rate data not found.'),
      );

    // เรียก Controller ด้วยข้อมูลที่ถูกต้อง
    // แต่จำลองให้ Service ไม่พบข้อมูล
    await expect(
      controller.getQuarterlyExchangeRate({
        year: '2025',
        quarter: 'Q1',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  // ตรวจสอบกรณีที่ BOT API เกิดข้อผิดพลาด
  it('should throw InternalServerErrorException when BOT API fails', async () => {
    // จำลองให้ Service โยน InternalServerErrorException
    jest
      .spyOn(controller['exchangeRateService'], 'getQuarterlyExchangeRate')
      .mockRejectedValue(
        new InternalServerErrorException('Failed to fetch exchange rate data.'),
      );

    // เรียก Controller ด้วยข้อมูลที่ถูกต้อง
    // แต่จำลองให้ BOT API เกิดข้อผิดพลาด
    await expect(
      controller.getQuarterlyExchangeRate({
        year: '2025',
        quarter: 'Q1',
      }),
    ).rejects.toThrow(InternalServerErrorException);
  });
});
