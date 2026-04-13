use diesel::prelude::*;

// ── IPC types ─────────────────────────────────────────────────────────────────

#[taurpc::ipc_type]
pub struct Stock {
    pub product_code: String,
    pub quantity: f64,
}

// ── DB-only types ─────────────────────────────────────────────────────────────

#[derive(Queryable, Selectable)]
#[diesel(table_name = crate::schema::estoque)]
pub struct StockRow {
    #[diesel(column_name = "procod")]
    pub product_code: String,
    #[diesel(column_name = "estatusdo")]
    pub quantity: f64,
}

impl From<StockRow> for Stock {
    fn from(row: StockRow) -> Self {
        Stock {
            product_code: row.product_code,
            quantity: row.quantity,
        }
    }
}
