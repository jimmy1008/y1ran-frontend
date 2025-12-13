// src/data/products.js
export const products = [
  {
    id: "journal",
    name: "Trading Journal",
    title: "Trading Journal",
    subtitle: "交易紀錄與復盤系統",
    tagline: "交易紀錄與復盤系統",
    description: "手動紀錄、統計、匯出，專注復盤而非發訊號。",
    featured: true,
    status: "Beta",
    platform: "Web / PWA",
    actions: [
      { label: "開啟系統", href: "/app" },
      { label: "查看介紹", href: "/products/journal" },
    ],
    sections: {
      what: [
        "建立交易紀錄與備註",
        "統計績效與風險指標",
        "協助復盤而非預測市場",
      ],
      not: [
        "不提供交易訊號",
        "不自動下單",
        "不保證任何獲利",
      ],
    },
  },
];

export default products;
