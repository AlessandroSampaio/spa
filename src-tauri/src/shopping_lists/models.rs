use chrono::NaiveDateTime;
use diesel::prelude::*;
use diesel::sql_types::{Nullable, Text, Timestamp};

// ── IPC types ─────────────────────────────────────────────────────────────────

#[taurpc::ipc_type]
pub struct ShoppingList {
    pub id: i32,
    pub name: String,
    pub created_at: String,
    pub item_count: i32,
}

#[taurpc::ipc_type]
pub struct ShoppingListItemDetail {
    pub item_id: i32,
    pub product_code: String,
    pub description: Option<String>,
    pub cost_price: Option<f64>,
    pub sale_price: Option<f64>,
    pub stock_balance: Option<f64>,
    pub last_purchase_date: Option<String>,
    pub avg_daily_sales: Option<f64>,
    pub suggested_purchase_qty: Option<f64>,
}

#[taurpc::ipc_type]
pub struct PurchaseParameters {
    pub target_stock_days: i32,
}

// ── DB-only types (local SQLite) ─────────────────────────────────────────────

#[derive(Queryable, Selectable)]
#[diesel(table_name = crate::local_schema::shopping_lists)]
pub struct ShoppingListRow {
    pub id: i32,
    pub name: String,
    pub created_at: String,
}

#[derive(Insertable)]
#[diesel(table_name = crate::local_schema::shopping_lists)]
pub struct NewShoppingListRow<'a> {
    pub name: &'a str,
}

#[derive(Insertable)]
#[diesel(table_name = crate::local_schema::shopping_list_items)]
pub struct NewShoppingListItemRow<'a> {
    pub list_id: i32,
    pub product_code: &'a str,
}

// ── DB-only types (Firebird, raw SQL result) ─────────────────────────────────

#[derive(QueryableByName)]
pub struct LastPurchaseRow {
    #[diesel(sql_type = Text)]
    pub product_code: String,
    #[diesel(sql_type = Nullable<Timestamp>)]
    pub last_purchase: Option<NaiveDateTime>,
}
