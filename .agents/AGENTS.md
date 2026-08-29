# Project Rules for GoPOS App

## Printer Initializations
* Whenever you initialize or handle fallback printer configurations, always default to `"pcl"` (PCL / Internal / Thermal) instead of `"escpos"`.
* Code patterns to enforce:
  * Zustand store default printerType: `printerType: "pcl"`
  * LocalStorage fallbacks: `localStorage.getItem("gopos-printer-type") || "pcl"`
