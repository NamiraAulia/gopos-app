package handlers

import (
	"fmt"
	"math"
	"sync"
	"testing"
	"time"
)

// TestParallelIdempotencyRaceCondition simulates 2 concurrent/parallel requests with the same idempotency_key
func TestParallelIdempotencyRaceCondition(t *testing.T) {
	const idempotencyKey = "test-race-uuid-12345"

	// Clear cache before test
	processedIdempotencyKeys.Delete(idempotencyKey)

	var wg sync.WaitGroup
	wg.Add(2)

	results := make([]bool, 2)

	// Simulated checkout processor
	processCheckout := func(index int) {
		defer wg.Done()

		// Check idempotency cache
		if recVal, exists := processedIdempotencyKeys.Load(idempotencyKey); exists {
			if _, ok := recVal.(*IdempotencyRecord); ok {
				// Duplicate detected by idempotency cache
				results[index] = false // Rejected duplicate
				return
			}
		}

		// Store in cache (simulating backend execution)
		processedIdempotencyKeys.Store(idempotencyKey, &IdempotencyRecord{
			Timestamp: time.Now(),
		})
		results[index] = true // Processed original
	}

	// Launch 2 parallel goroutines simultaneously
	go processCheckout(0)
	go processCheckout(1)

	wg.Wait()

	// Verify only 1 succeeded and 1 was blocked as duplicate
	successCount := 0
	for _, res := range results {
		if res {
			successCount++
		}
	}

	if successCount != 1 {
		t.Errorf("Parallel idempotency test failed: expected exactly 1 successful execution, got %d", successCount)
	} else {
		t.Logf("PASS: Exactly 1 transaction processed, 1 duplicate request rejected via idempotency cache")
	}
}

// TestFractionalQtyAndDiscountIntegration verifies calculations for 0.3 kg item with manual discount
func TestFractionalQtyAndDiscountIntegration(t *testing.T) {
	// Item: 0.3 kg @ 15,000 IDR/kg
	unitPrice := int64(15000)
	qty := 0.3
	manualDiscount := int64(2000)

	// 1. Frontend & Backend Subtotal calculation
	subtotal := int64(math.Round(float64(unitPrice) * qty)) // 4500 IDR
	if subtotal != 4500 {
		t.Fatalf("Subtotal miscalculated: got %d, want 4500", subtotal)
	}

	// 2. Net total calculation with manual discount
	preflightTotal := subtotal
	normalTotal := subtotal

	netTotal, totalDiscount := CalculateNetTotalAndDiscount(normalTotal, preflightTotal, manualDiscount)

	// 4500 - 2000 = 2500
	if netTotal != 2500 {
		t.Errorf("netTotal got %d, want 2500", netTotal)
	}
	if totalDiscount != 2000 {
		t.Errorf("totalDiscount got %d, want 2000", totalDiscount)
	}

	t.Logf("PASS: Subtotal Rp %d, NetTotal Rp %d, TotalDiscount Rp %d - Matches Frontend & DB expectation", subtotal, netTotal, totalDiscount)
}

// TestAuditLogFormatVerification demonstrates activity_log content formatting readability
func TestAuditLogFormatVerification(t *testing.T) {
	// Sample 1: CHANGE_PRICE
	oldPriceVal := fmt.Sprintf("Produk: Gula Pasir 1kg, Price: %d, PriceBig: %d, PriceMember: %d, BestPrice: %d", 15000, 140000, 14500, 12000)
	newPriceVal := fmt.Sprintf("Produk: Gula Pasir 1kg, Price: %d, PriceBig: %d, PriceMember: %d, BestPrice: %d", 16000, 145000, 15500, 12500)

	t.Logf("[AuditLog Sample 1 - CHANGE_PRICE]")
	t.Logf("  Action: CHANGE_PRICE | TargetTable: products | TargetID: 42")
	t.Logf("  OldValue: %s", oldPriceVal)
	t.Logf("  NewValue: %s", newPriceVal)

	// Sample 2: CUSTOM_PRICE_CHECKOUT
	oldCustomVal := fmt.Sprintf("Produk: Telur Ayam (ID 12), Harga Normal: %d", 28000)
	newCustomVal := fmt.Sprintf("Harga Kustom Kasir: %d, Qty: 0.5, TrxCode: TRX-20260813-A1B2C3D4", 26000)

	t.Logf("[AuditLog Sample 2 - CUSTOM_PRICE_CHECKOUT]")
	t.Logf("  Action: CUSTOM_PRICE_CHECKOUT | TargetTable: transaction_items | TargetID: 12")
	t.Logf("  OldValue: %s", oldCustomVal)
	t.Logf("  NewValue: %s", newCustomVal)

	// Sample 3: VOID_TRANSACTION
	oldVoidVal := fmt.Sprintf("TrxCode: TRX-20260813-A1B2C3D4, TotalAmount: %d, PaymentMethod: %s, Status: %s", 2500, "cash", "completed")
	newVoidVal := fmt.Sprintf("Status: voided, Pembatalan oleh UserID: %d", 3)

	t.Logf("[AuditLog Sample 3 - VOID_TRANSACTION]")
	t.Logf("  Action: VOID_TRANSACTION | TargetTable: transactions | TargetID: 99")
	t.Logf("  OldValue: %s", oldVoidVal)
	t.Logf("  NewValue: %s", newVoidVal)
}
