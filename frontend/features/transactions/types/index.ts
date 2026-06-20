export interface TransactionItem {
    id: number;
    product_name: string;
    unit_price: number;
    qty: number;
    subtotal: number;

};

export interface Transaction {
    id: number;
    transaction_code: string;
    created_at: string;
    total_amount: number;
    payment_method: string;
    status: string;
    items: TransactionItem[];
};