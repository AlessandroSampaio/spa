use diesel::prelude::*;

use crate::products::models::Product;

// ── IPC types ─────────────────────────────────────────────────────────────────

#[taurpc::ipc_type]
pub struct SimilaresGroup {
    pub id: String,
    pub descricao: Option<String>,
    pub similares: Vec<Product>,
}

// ── DB-only types ─────────────────────────────────────────────────────────────

#[derive(Queryable, Selectable)]
#[diesel(table_name = crate::schema::similares)]
pub struct SimilaresRow {
    pub procodsim: String,
    pub similaresdes: Option<String>,
}

