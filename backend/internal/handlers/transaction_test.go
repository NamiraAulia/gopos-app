package handlers

import (
	"math"
	"testing"
)

// CalculateSubtotal calculates item subtotal using math.Round to prevent float truncation loss
func CalculateSubtotal(unitPrice int64, qty float64) int64 {
	return int64(math.Round(float64(unitPrice) * qty))
}

func TestSubtotalFractionalRounding(t *testing.T) {
	tests := []struct {
		name      string
		unitPrice int64
		qty       float64
		expected  int64
	}{
		{
			name:      "0.3 kg of item at 15000 IDR",
			unitPrice: 15000,
			qty:       0.3,
			expected:  4500, // 15000 * 0.3 = 4500. Direct truncation without math.Round gives 4499 due to IEEE 754 precision
		},
		{
			name:      "0.7 kg of item at 10000 IDR",
			unitPrice: 10000,
			qty:       0.7,
			expected:  7000,
		},
		{
			name:      "0.33333 kg of item at 30000 IDR",
			unitPrice: 30000,
			qty:       0.3333333333333333,
			expected:  10000,
		},
		{
			name:      "0.5 kg of item at 17500 IDR",
			unitPrice: 17500,
			qty:       0.5,
			expected:  8750,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := CalculateSubtotal(tt.unitPrice, tt.qty)
			if result != tt.expected {
				t.Errorf("CalculateSubtotal(%d, %f) = %d; want %d", tt.unitPrice, tt.qty, result, tt.expected)
			}
		})
	}
}

func TestCalculateNetTotalAndDiscount(t *testing.T) {
	tests := []struct {
		name                 string
		normalTotal          int64
		preflightTotal       int64
		reqDiscount          int64
		expectedNetTotal     int64
		expectedDiscountAmount int64
	}{
		{
			name:                 "Diskon normal (total 50.000, diskon 5.000 -> netTotal 45.000)",
			normalTotal:          50000,
			preflightTotal:       50000,
			reqDiscount:          5000,
			expectedNetTotal:     45000,
			expectedDiscountAmount: 5000,
		},
		{
			name:                 "Diskon melebihi total (total 10.000, diskon 15.000 -> netTotal 0, discount 10.000)",
			normalTotal:          10000,
			preflightTotal:       10000,
			reqDiscount:          15000,
			expectedNetTotal:     0,
			expectedDiscountAmount: 10000,
		},
		{
			name:                 "Tanpa diskon manual (discount_amount 0 -> netTotal 50.000)",
			normalTotal:          50000,
			preflightTotal:       50000,
			reqDiscount:          0,
			expectedNetTotal:     50000,
			expectedDiscountAmount: 0,
		},
		{
			name:                 "Kombinasi diskon promo barang (normal 60k, preflight 50k) dan diskon manual 5k",
			normalTotal:          60000,
			preflightTotal:       50000,
			reqDiscount:          5000,
			expectedNetTotal:     45000,
			expectedDiscountAmount: 15000, // 10.000 promo + 5.000 manual
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gotNetTotal, gotDiscount := CalculateNetTotalAndDiscount(tt.normalTotal, tt.preflightTotal, tt.reqDiscount)
			if gotNetTotal != tt.expectedNetTotal {
				t.Errorf("netTotal got %d, want %d", gotNetTotal, tt.expectedNetTotal)
			}
			if gotDiscount != tt.expectedDiscountAmount {
				t.Errorf("totalDiscount got %d, want %d", gotDiscount, tt.expectedDiscountAmount)
			}
		})
	}
}

func CalculateRealExpectedCash(totalCashExpected, totalRefundedCash int64) int64 {
	return totalCashExpected - totalRefundedCash
}

func TestShiftCashCalculation(t *testing.T) {
	// Skenario 1: Kasir awal 100k, Retur Cash 20k -> realExpected 80k
	initialExpected := int64(100000)
	cashRefund := int64(20000)
	realExpectedCash := CalculateRealExpectedCash(initialExpected, cashRefund)
	if realExpectedCash != 80000 {
		t.Errorf("Retur Tunai: expected %d, got %d", 80000, realExpectedCash)
	}

	// Skenario 2: Transaksi QRIS 50k di-retur (non-tunai). totalRefundedCash tetap 0.
	// Expected saldo kas laci tetap 100k.
	qrisRefundedCash := int64(0)
	realExpectedQRIS := CalculateRealExpectedCash(initialExpected, qrisRefundedCash)
	if realExpectedQRIS != 100000 {
		t.Errorf("Retur Non-Tunai QRIS tidak boleh mempengaruhi kas fisik, got %d, want 100000", realExpectedQRIS)
	}
}
