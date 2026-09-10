import { Injectable,
    BadRequestException,
    NotFoundException,
    InternalServerErrorException,

} from '@nestjs/common';

import {
  BotExchangeRateResponse,
  ExchangeRateData,
} from './interfaces/bot-exchange-rate.interface.js';

import { ExchangeRateQueryDto } from './dto/exchange-rate-query.dto.js';

// Service สำหรับจัดการการคำนวณอัตราแลกเปลี่ยนรายไตรมาส
@Injectable()
export class ExchangeRateService {
    // ตรวจสอบข้อมูลที่ผู้ใช้ส่งเข้ามา
  validateQuery(query: ExchangeRateQueryDto) {
    const { year, quarter } = query;

    // ตรวจสอบว่ามี year และ quarter หรือไม่
    if (!year || !quarter) {
      throw new BadRequestException('Year and Quarter are required.');
    }

    // แปลง year จาก string เป็น number
    const yearNumber = Number(year);

    // ตรวจสอบว่า year เป็นจำนวนเต็มและไม่น้อยกว่า 2002
  if (!Number.isInteger(yearNumber) || yearNumber < 2002) {
    throw new BadRequestException('Invalid year.');
  }

    // ตรวจสอบว่า quarter เป็น Q1-Q4
    if (!['Q1', 'Q2', 'Q3', 'Q4'].includes(quarter)) {
      throw new BadRequestException('Invalid quarter.');
    }

    // คืนค่าปีที่แปลงแล้วและ quarter
    return {
      yearNumber,
      quarter,
    };
  }

    // หาไตรมาสก่อนหน้าจากไตรมาสที่ผู้ใช้เลือก
  getPreviousQuarter(yearNumber: number, quarter: string) {
    let previousYear = yearNumber;
    let previousQuarter = '';

    switch (quarter) {
      case 'Q1':
        // Q1 ต้องย้อนกลับไป Q4 ของปีก่อน
        previousYear = yearNumber - 1;
        previousQuarter = 'Q4';
        break;

      case 'Q2':
        previousQuarter = 'Q1';
        break;

      case 'Q3':
        previousQuarter = 'Q2';
        break;

      case 'Q4':
        previousQuarter = 'Q3';
        break;
    }

    return {
      previousYear,
      previousQuarter,
    };
  }

    // เรียกข้อมูลอัตราแลกเปลี่ยนจาก BOT API
  async fetchExchangeRate(
    yearNumber: number,
    quarter: string,
    previousYear: number,
    previousQuarter: string,
  ): Promise<BotExchangeRateResponse> {
    // สร้าง URL สำหรับขอข้อมูล 2 ไตรมาส
    const url =
      `https://gateway.api.bot.or.th/Stat-ExchangeRate/v2/QUARTERLY_AVG_EXG_RATE/` +
      `?end_period=${yearNumber}-${quarter}` +
      `&start_period=${previousYear}-${previousQuarter}` +
      `&currency=USD`;

    // ส่ง Request ไปยัง BOT API
    const response = await fetch(url, {
      headers: {
        Authorization: process.env.BOT_API_TOKEN ?? '',
      },
    });

    // ถ้า BOT API ตอบกลับไม่สำเร็จ
    if (!response.ok) {
      throw new InternalServerErrorException('Failed to fetch exchange rate data.');
    }

    // แปลง Response เป็น JSON
    return response.json() as Promise<BotExchangeRateResponse>;
  }

    // ค้นหาข้อมูลของไตรมาสปัจจุบันและไตรมาสก่อนหน้า
  findQuarterlyData(
    data: BotExchangeRateResponse,
    currentPeriod: string,
    previousPeriod: string,
  ) {
    // ดึงข้อมูลอัตราแลกเปลี่ยนรายไตรมาส
    const dataDetail: ExchangeRateData[] =
      data.result.data.data_detail;

    // ค้นหาข้อมูลของไตรมาสปัจจุบัน
    const currentData = dataDetail.find(
      (item) => item.period === currentPeriod,
    );

    // ค้นหาข้อมูลของไตรมาสก่อนหน้า
    const previousData = dataDetail.find(
      (item) => item.period === previousPeriod,
    );

    // ถ้าไม่พบข้อมูลของไตรมาสใดไตรมาสหนึ่ง
    if (!currentData || !previousData) {
      throw new NotFoundException('Exchange rate data not found.');
    }

    return {
      currentData,
      previousData,
    };
  }

    // คำนวณเปอร์เซ็นต์การเปลี่ยนแปลงจากไตรมาสก่อนหน้า
  calculateChange(currentData: ExchangeRateData, previousData: ExchangeRateData) {
    // แปลง mid_rate จาก string เป็น number
    const currentRate = Number(currentData.mid_rate);
    const previousRate = Number(previousData.mid_rate);

    const changeFromPreviousQuarter =
      ((currentRate - previousRate) / previousRate) * 100;

    return {
      currentRate,
      previousRate,
      changeFromPreviousQuarter,
    };
  }

    // ประมวลผลข้อมูลอัตราแลกเปลี่ยนรายไตรมาสทั้งหมด
  async getQuarterlyExchangeRate(query: ExchangeRateQueryDto) {
    // ตรวจสอบข้อมูลที่รับเข้ามา
    const { yearNumber, quarter } = this.validateQuery(query);

    // หาไตรมาสก่อนหน้า
    const { previousYear, previousQuarter } =
      this.getPreviousQuarter(yearNumber, quarter);

    // เรียกข้อมูลจาก BOT API
    const data = await this.fetchExchangeRate(
      yearNumber,
      quarter,
      previousYear,
      previousQuarter,
    );

    // สร้างชื่อช่วงเวลาของทั้งสองไตรมาส
    const currentPeriod = `${yearNumber}-${quarter}`;
    const previousPeriod = `${previousYear}-${previousQuarter}`;

    // ค้นหาข้อมูลของทั้งสองไตรมาส
    const { currentData, previousData } =
      this.findQuarterlyData(
        data,
        currentPeriod,
        previousPeriod,
      );

    // คำนวณเปอร์เซ็นต์การเปลี่ยนแปลง
    const {
      currentRate,
      previousRate,
      changeFromPreviousQuarter,
    } = this.calculateChange(currentData, previousData);

    // ส่งผลลัพธ์กลับไปให้ Controller
    return {
      year: yearNumber,
      quarter,
      averageRate: currentRate,
      previousQuarter: {
        year: previousYear,
        quarter: previousQuarter,
        averageRate: previousRate,
      },
      changeFromPreviousQuarter,
    };
  }
}
