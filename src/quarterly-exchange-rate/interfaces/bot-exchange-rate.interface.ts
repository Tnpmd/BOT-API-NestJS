// ข้อมูลอัตราแลกเปลี่ยนของแต่ละไตรมาสจาก BOT
export interface ExchangeRateData {
  period: string;
  currency_id: string;
  currency_name_th: string;
  currency_name_eng: string;
  buying_sight: string;
  buying_transfer: string;
  selling: string;
  mid_rate: string;
}

// โครงสร้าง Response หลักที่ได้รับจาก BOT API
export interface BotExchangeRateResponse {
  result: {
    timestamp: string;
    api: string;

    data: {
      // ข้อมูลส่วนหัวของรายงาน
      data_header: {
        report_name_eng: string;
        report_name_th: string;
        report_uoq_name_eng: string;
        report_uoq_name_th: string;

        // แหล่งที่มาของข้อมูล
        report_source_of_data: {
          source_of_data_eng: string;
          source_of_data_th: string;
        }[];

        // หมายเหตุของข้อมูล
        report_remark: {
          report_remark_eng: string;
          report_remark_th: string;
        }[];

        last_updated: string;
      };

      // ข้อมูลอัตราแลกเปลี่ยนรายไตรมาส
      data_detail: ExchangeRateData[];
    };
  };
}