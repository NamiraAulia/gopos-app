-- 1. FUNGSI PEMBANTU (HELPER FUNCTIONS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE users.email = auth.jwt() ->> 'email'
      AND users.role = 'admin'
      AND users.is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_kasir()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE users.email = auth.jwt() ->> 'email'
      AND users.role = 'kasir'
      AND users.is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS integer AS $$
DECLARE
  v_uid integer;
BEGIN
  SELECT id INTO v_uid FROM public.users
  WHERE users.email = auth.jwt() ->> 'email';
  RETURN v_uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. AKTIFKAN RLS PADA SEMUA TABEL
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_adjustments ENABLE ROW LEVEL SECURITY;

-- 3. DEKLARASI POLICY KEAMANAN PER TABEL

-- TABEL: users
CREATE POLICY "Users Read All" ON public.users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users Admin Modify" ON public.users FOR ALL TO authenticated USING (public.is_admin());

-- TABEL: products
CREATE POLICY "Products Read All" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Products Admin Modify" ON public.products FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Products Cashier Update Stock" ON public.products FOR UPDATE TO authenticated USING (public.is_kasir());

-- TABEL: transactions
CREATE POLICY "Transactions Admin Read All" ON public.transactions FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Transactions Cashier Read Own" ON public.transactions FOR SELECT TO authenticated USING (public.is_kasir() AND user_id = public.current_user_id());
CREATE POLICY "Transactions Insert Cashier" ON public.transactions FOR INSERT TO authenticated WITH CHECK (public.is_admin() OR public.is_kasir());
CREATE POLICY "Transactions Update Cashier Own" ON public.transactions FOR UPDATE TO authenticated USING (public.is_admin() OR (public.is_kasir() AND user_id = public.current_user_id()));
CREATE POLICY "Transactions Admin Modify" ON public.transactions FOR ALL TO authenticated USING (public.is_admin());

-- TABEL: transaction_items
CREATE POLICY "Tx Items Read" ON public.transaction_items FOR SELECT TO authenticated USING (
  public.is_admin() OR EXISTS (
    SELECT 1 FROM public.transactions 
    WHERE transactions.id = transaction_items.transaction_id AND transactions.user_id = public.current_user_id()
  )
);
CREATE POLICY "Tx Items Insert" ON public.transaction_items FOR INSERT TO authenticated WITH CHECK (public.is_admin() OR public.is_kasir());
CREATE POLICY "Tx Items Admin Modify" ON public.transaction_items FOR ALL TO authenticated USING (public.is_admin());

-- TABEL: members
CREATE POLICY "Members Read All" ON public.members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members Insert All" ON public.members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Members Update All" ON public.members FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Members Admin Delete" ON public.members FOR DELETE TO authenticated USING (public.is_admin());

-- TABEL: shifts
CREATE POLICY "Shifts Admin Read All" ON public.shifts FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Shifts Cashier Read Own" ON public.shifts FOR SELECT TO authenticated USING (public.is_kasir() AND user_id = public.current_user_id());
CREATE POLICY "Shifts Insert Cashier" ON public.shifts FOR INSERT TO authenticated WITH CHECK (public.is_admin() OR public.is_kasir());
CREATE POLICY "Shifts Update Cashier Own" ON public.shifts FOR UPDATE TO authenticated USING (public.is_admin() OR (public.is_kasir() AND user_id = public.current_user_id()));
CREATE POLICY "Shifts Admin Modify" ON public.shifts FOR ALL TO authenticated USING (public.is_admin());

-- TABEL: expenses
CREATE POLICY "Expenses Admin Read All" ON public.expenses FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Expenses Cashier Read Own" ON public.expenses FOR SELECT TO authenticated USING (public.is_kasir() AND user_id = public.current_user_id());
CREATE POLICY "Expenses Insert Cashier" ON public.expenses FOR INSERT TO authenticated WITH CHECK (public.is_admin() OR public.is_kasir());
CREATE POLICY "Expenses Update Cashier Own" ON public.expenses FOR UPDATE TO authenticated USING (public.is_admin() OR (public.is_kasir() AND user_id = public.current_user_id()));
CREATE POLICY "Expenses Admin Modify" ON public.expenses FOR ALL TO authenticated USING (public.is_admin());

-- TABEL: refunds & refund_items
CREATE POLICY "Refunds Read All" ON public.refunds FOR SELECT TO authenticated USING (true);
CREATE POLICY "Refunds Insert Cashier" ON public.refunds FOR INSERT TO authenticated WITH CHECK (public.is_admin() OR public.is_kasir());
CREATE POLICY "Refunds Admin Modify" ON public.refunds FOR ALL TO authenticated USING (public.is_admin());

CREATE POLICY "Refund Items Read All" ON public.refund_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Refund Items Insert Cashier" ON public.refund_items FOR INSERT TO authenticated WITH CHECK (public.is_admin() OR public.is_kasir());
CREATE POLICY "Refund Items Admin Modify" ON public.refund_items FOR ALL TO authenticated USING (public.is_admin());

-- TABEL: activity_logs
CREATE POLICY "Logs Read Admin" ON public.activity_logs FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Logs Insert All" ON public.activity_logs FOR INSERT TO authenticated WITH CHECK (true);

-- TABEL: stock_adjustments
CREATE POLICY "Stock Adjustments Admin Only" ON public.stock_adjustments FOR ALL TO authenticated USING (public.is_admin());

-- TABEL: suppliers & supplier_sales
GRANT SELECT, INSERT, UPDATE, DELETE ON public.suppliers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.supplier_sales TO authenticated;

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Suppliers Read All" ON public.suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Suppliers Modify Admin" ON public.suppliers FOR ALL TO authenticated USING (public.is_admin());

CREATE POLICY "Supplier Sales Read All" ON public.supplier_sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "Supplier Sales Modify Admin" ON public.supplier_sales FOR ALL TO authenticated USING (public.is_admin());

