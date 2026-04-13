use diesel::prelude::*;

use crate::products::models::Product;

// ── IPC types ─────────────────────────────────────────────────────────────────

#[taurpc::ipc_type]
pub struct SimilarGroup {
    pub id: String,
    pub description: Option<String>,
    pub products: Vec<Product>,
}

// ── DB-only types ─────────────────────────────────────────────────────────────

#[derive(Queryable, Selectable)]
#[diesel(table_name = crate::schema::similares)]
pub struct SimilarRow {
    #[diesel(column_name = "procodsim")]
    pub group_code: String,
    #[diesel(column_name = "similaresdes")]
    pub description: Option<String>,
}
