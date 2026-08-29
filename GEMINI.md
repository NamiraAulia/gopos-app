# Guidelines & Rules for GoPOS App

## Printer Rules
* **Default Printer Type**: Every printer initialization or fallback configuration MUST default to `"pcl"` (PCL / Internal / Thermal) rather than `"escpos"`.
  * Store initial state: `printerType: "pcl"`
  * LocalStorage reading fallbacks: `localStorage.getItem("gopos-printer-type") || "pcl"`
  * Test print fallbacks: `printerMode === "pcl"`
