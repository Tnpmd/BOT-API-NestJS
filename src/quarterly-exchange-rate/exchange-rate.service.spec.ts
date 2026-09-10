import { ExchangeRateService } from './exchange-rate.service.js';
import { jest } from '@jest/globals'

describe('ExchangeRateService', () => {
  let service: ExchangeRateService;

  beforeEach(() => {
    service = new ExchangeRateService();
  });

  describe('validateQuery', () => {
    // ตรวจสอบกรณีที่ส่งข้อมูลถูกต้อง
    it('should validate correct query', () => {
      const result = service.validateQuery({
        year: '2025',
        quarter: 'Q1',
      });

      // ตรวจสอบว่าผลลัพธ์ตรงกับที่คาดไว้
      expect(result).toEqual({
        yearNumber: 2025,
        quarter: 'Q1',
      });
    });

    // ตรวจสอบกรณีที่ไม่มี year หรือ quarter
    it('should throw error when year or quarter is missing', () => {
      expect(() =>
        service.validateQuery({
          year: '',
          quarter: '',
        }),
      ).toThrow('Year and Quarter are required.');
    });

    // ตรวจสอบกรณีที่ year ไม่ใช่ตัวเลข
    it('should throw error when year is invalid', () => {
      expect(() =>
        service.validateQuery({
          year: 'abc',
          quarter: 'Q1',
        }),
      ).toThrow('Invalid year.');
    });

    // ตรวจสอบกรณีที่ quarter ไม่ถูกต้อง
    it('should throw error when quarter is invalid', () => {
      expect(() =>
        service.validateQuery({
          year: '2025',
          quarter: 'Q5',
        }),
      ).toThrow('Invalid quarter.');
    });
  });

  describe('getPreviousQuarter', () => {
    // ตรวจสอบ Q1 ว่าต้องย้อนกลับไป Q4 ของปีก่อน
    it('should return previous year Q4 when current quarter is Q1', () => {
      const result = service.getPreviousQuarter(2025, 'Q1');

      expect(result).toEqual({
        previousYear: 2024,
        previousQuarter: 'Q4',
      });
    });

    // ตรวจสอบ Q2 ว่าไตรมาสก่อนหน้าคือ Q1
    it('should return Q1 when current quarter is Q2', () => {
      const result = service.getPreviousQuarter(2025, 'Q2');

      expect(result).toEqual({
        previousYear: 2025,
        previousQuarter: 'Q1',
      });
    });

    // ตรวจสอบ Q3 ว่าไตรมาสก่อนหน้าคือ Q2
    it('should return Q2 when current quarter is Q3', () => {
      const result = service.getPreviousQuarter(2025, 'Q3');

      expect(result).toEqual({
        previousYear: 2025,
        previousQuarter: 'Q2',
      });
    });

    // ตรวจสอบ Q4 ว่าไตรมาสก่อนหน้าคือ Q3
    it('should return Q3 when current quarter is Q4', () => {
      const result = service.getPreviousQuarter(2025, 'Q4');

      expect(result).toEqual({
        previousYear: 2025,
        previousQuarter: 'Q3',
      });
    });
  });

  describe('calculateChange', () => {
    // ตรวจสอบว่าคำนวณอัตราการเปลี่ยนแปลงได้ถูกต้อง
    it('should calculate percentage change correctly', () => {
      const currentData = {
        period: '2025-Q1',
        currency_id: 'USD',
        currency_name_th: 'สหรัฐอเมริกา : ดอลลาร์ (USD)',
        currency_name_eng: 'USA : DOLLAR (USD)',
        buying_sight: '33.7094000',
        buying_transfer: '33.7931000',
        selling: '34.1153000',
        mid_rate: '33.9542000',
      };

      const previousData = {
        period: '2024-Q4',
        currency_id: 'USD',
        currency_name_th: 'สหรัฐอเมริกา : ดอลลาร์ (USD)',
        currency_name_eng: 'USA : DOLLAR (USD)',
        buying_sight: '34.0000000',
        buying_transfer: '34.1000000',
        selling: '34.4000000',
        mid_rate: '34.2000000',
      };

      const result = service.calculateChange(currentData, previousData);

      // ตรวจสอบค่าอัตราแลกเปลี่ยนปัจจุบัน
      expect(result.currentRate).toBe(33.9542);

      // ตรวจสอบค่าอัตราแลกเปลี่ยนของไตรมาสก่อนหน้า
      expect(result.previousRate).toBe(34.2);

      // ตรวจสอบเปอร์เซ็นต์การเปลี่ยนแปลง
      expect(result.changeFromPreviousQuarter).toBeCloseTo(-0.7187134502923976);
    });
  });

  // Test การประมวลผลอัตราแลกเปลี่ยนรายไตรมาสทั้งหมด
    // Test การประมวลผลอัตราแลกเปลี่ยนรายไตรมาสทั้งหมด
  describe('getQuarterlyExchangeRate', () => {

    // ตรวจสอบกรณีที่เรียกข้อมูลและคำนวณได้สำเร็จ
    it('should return quarterly exchange rate data', async () => {

      // จำลองข้อมูลที่ได้จาก BOT API
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          result: {
            data: {
              data_detail: [
                {
                  period: '2025-Q1',
                  currency_id: 'USD',
                  currency_name_th: 'สหรัฐอเมริกา : ดอลลาร์ (USD)',
                  currency_name_eng: 'USA : DOLLAR (USD)',
                  buying_sight: '33.7094000',
                  buying_transfer: '33.7931000',
                  selling: '34.1153000',
                  mid_rate: '33.9542000',
                },
                {
                  period: '2024-Q4',
                  currency_id: 'USD',
                  currency_name_th: 'สหรัฐอเมริกา : ดอลลาร์ (USD)',
                  currency_name_eng: 'USA : DOLLAR (USD)',
                  buying_sight: '34.0000000',
                  buying_transfer: '34.1000000',
                  selling: '34.4000000',
                  mid_rate: '34.2000000',
                },
              ],
            },
          },
        }),
      } as Response);

      const result = await service.getQuarterlyExchangeRate({
        year: '2025',
        quarter: 'Q1',
      });

      // ตรวจสอบข้อมูลไตรมาสปัจจุบัน
      expect(result.year).toBe(2025);
      expect(result.quarter).toBe('Q1');
      expect(result.averageRate).toBe(33.9542);

      // ตรวจสอบข้อมูลไตรมาสก่อนหน้า
      expect(result.previousQuarter.year).toBe(2024);
      expect(result.previousQuarter.quarter).toBe('Q4');
      expect(result.previousQuarter.averageRate).toBe(34.2);

      // ตรวจสอบเปอร์เซ็นต์การเปลี่ยนแปลง
      expect(result.changeFromPreviousQuarter).toBeCloseTo(
        -0.7187134502923976,
      );
    });

    // ตรวจสอบกรณีที่ BOT API ตอบกลับไม่สำเร็จ
    it('should throw error when BOT API fails', async () => {

      // จำลอง BOT API ตอบกลับด้วยสถานะไม่สำเร็จ
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
      } as Response);

      await expect(
        service.getQuarterlyExchangeRate({
          year: '2025',
          quarter: 'Q1',
        }),
      ).rejects.toThrow('Failed to fetch exchange rate data.');
    });

    // ตรวจสอบกรณีที่ไม่พบข้อมูลของไตรมาส
    it('should throw error when exchange rate data is not found', async () => {

      // จำลอง BOT API ตอบกลับสำเร็จแต่ไม่มีข้อมูล
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          result: {
            data: {
              data_detail: [],
            },
          },
        }),
      } as Response);

      await expect(
        service.getQuarterlyExchangeRate({
          year: '2025',
          quarter: 'Q1',
        }),
      ).rejects.toThrow('Exchange rate data not found.');
    });
  });
});
