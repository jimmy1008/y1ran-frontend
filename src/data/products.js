// src/data/products.js
export const products = [
  {
    id: "journal",
    name: "Trading Journal",
    tagline: "Trade review & journaling system",
    status: "Beta",
    platform: "Web / PWA",
    actions: [
      { label: "Open App", href: "/app" },
      { label: "Docs", href: "/docs" },
    ],
    sections: {
      what: [
        "Manual trade journaling",
        "R-multiple & PnL analysis",
        "Exportable data (CSV / JSON)",
      ],
      not: [
        "No signals",
        "No auto trading",
        "No strategy selling",
      ],
    },
  },
];
