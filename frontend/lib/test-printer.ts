import { generatePlainTextReceipt } from "./printer";
import { ReceiptData } from "./types/receipt";

// Mock data scenarios
const testScenarios: { name: string; data: ReceiptData }[] = [
  {
    name: "Standard short items, no member",
    data: {
      transactionCode: "TRX-10001",
      storeName: "GoPOS Coffee & Eatery",
      storeAddress: "Jl. Margonda Raya No. 12, Depok",
      storePhone: "081234567890",
      items: [
        { name: "Espresso", qty: 2, price: 15000, subtotal: 30000 },
        { name: "Croissant", qty: 1, price: 20000, subtotal: 20000 }
      ],
      subtotal: 50000,
      tax: 0,
      discount: 0,
      total: 50000,
      paymentMethod: "cash",
      cashierName: "Ahmad",
      transactionDate: "25/07/2026 15:30",
      footerText: "Terima Kasih - Silakan Datang Kembali",
      amountPaid: 100000,
      changeAmount: 50000,
      member: null
    }
  },
  {
    name: "Very long item names, discount, member",
    data: {
      transactionCode: "TRX-20002-LONG-ID-1234567890",
      storeName: "GoPOS Minimarket Cabang Utama Jakarta Selatan",
      storeAddress: "Gedung Cyber Lantai 3, Jl. Kuningan Barat No. 8, Mampang Prapatan, Jakarta Selatan",
      storePhone: "021-5551234",
      items: [
        { name: "Susu UHT Ultra Milk Rasa Cokelat Flavour 1000ml Box", qty: 3, price: 18500, subtotal: 55500 },
        { name: "Roti Tawar Kupas Sari Roti Premium Soft Bread Pack", qty: 1, price: 16000, subtotal: 16000 },
        { name: "Korek", qty: 10, price: 2000, subtotal: 20000 }
      ],
      subtotal: 91500,
      tax: 0,
      discount: 5000,
      total: 86500,
      paymentMethod: "tunai",
      cashierName: "Namira Aulia",
      transactionDate: "25/07/2026 15:35",
      footerText: "Barang yang sudah dibeli tidak dapat ditukar atau dikembalikan. Layanan konsumen hubungi WA: 0812-9999-8888",
      amountPaid: 100000,
      changeAmount: 13500,
      member: {
        name: "Budi Santoso",
        memberCode: "MEM-889977"
      }
    }
  }
];

function runTests() {
  console.log("=== RUNNING PRINTER RECEIPTS PLAIN TEXT TESTS ===");
  let failed = false;

  for (const scenario of testScenarios) {
    console.log(`\nScenario: ${scenario.name}`);
    const receipt = generatePlainTextReceipt(scenario.data, 48);
    
    // Split lines by %0A
    const lines = receipt.split("%0A");
    
    // The generator appends %0A%0A%0A%0A%0A at the end, so we will ignore the last empty lines
    let checkedLinesCount = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // If we've reached the trailing empty lines at the very end of the receipt, we can skip testing them
      if (i >= lines.length - 6 && line === "") {
        continue;
      }
      
      checkedLinesCount++;
      const len = line.length;
      if (len !== 48) {
        console.error(`FAIL: Line ${i + 1} has length ${len} (Expected: 48)`);
        console.error(`Content: "${line}"`);
        failed = true;
      }
    }

    if (!failed) {
      console.log(`PASS: Checked ${checkedLinesCount} lines. All lines are exactly 48 characters.`);
      console.log("--- PREVIEW OUTPUT ---");
      console.log(lines.join("\n"));
      console.log("----------------------");
    }
  }

  if (failed) {
    console.log("\nSOME TESTS FAILED!");
    process.exit(1);
  } else {
    console.log("\nALL TESTS PASSED SUCCESSFULLY!");
  }
}

runTests();
