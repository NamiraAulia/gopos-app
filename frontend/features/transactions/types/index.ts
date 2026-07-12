export interface TransactionItem {
    id: number;
    product_id: number;
    product_name: string;
    unit_price: number;
    qty: number;
    subtotal: number;
    unit_choice: string;
}

export interface UserRelation {
    id: number;
    name: string;
    email: string;
    role: string;
}

export interface MemberRelation {
    id: number;
    name: string;
    phone?: string;
}

export interface Transaction {
    id: number;
    transaction_code: string;
    created_at: string;
    total_amount: number;
    amount_paid: number;
    change_amount: number;
    discount_amount: number;
    payment_method: string;
    status: string;
    items: TransactionItem[];
    user?: UserRelation;
    member?: MemberRelation;
}