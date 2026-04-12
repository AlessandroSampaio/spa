use diesel::prelude::*;

// ── IPC types ─────────────────────────────────────────────────────────────────

#[taurpc::ipc_type]
pub struct Product {
    pub procod: String,
    pub prodes: Option<String>,
    pub proprccst: f64,
    pub proprcvdavar: f64,
}

#[taurpc::ipc_type]
pub struct ProductsFilter {
    pub search: Option<String>,
    pub limit: Option<i32>,
    pub offset: Option<i32>,
}

// ── DB-only types ─────────────────────────────────────────────────────────────

#[derive(Queryable, Selectable)]
#[diesel(table_name = crate::schema::produto)]
pub struct ProductRow {
    pub procod: String,
    pub prodes: Option<String>,
    pub proprccst: Option<f64>,
    pub proprcvdavar: Option<f64>,
}

impl From<ProductRow> for Product {
    fn from(r: ProductRow) -> Self {
        Product {
            procod: r.procod,
            prodes: r.prodes,
            proprccst: r.proprccst.unwrap_or(0.0),
            proprcvdavar: r.proprcvdavar.unwrap_or(0.0),
        }
    }
}
