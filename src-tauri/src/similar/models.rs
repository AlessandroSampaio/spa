use diesel::prelude::*;

use crate::products::models::Product;
use crate::stock::models::Stock;

// ── IPC types ─────────────────────────────────────────────────────────────────

/// Produto dentro de um grupo de similares, com estoque opcional.
/// Os campos de produto são expostos diretamente para manter compatibilidade
/// com o frontend (ex.: `similar.procod` continua funcionando).
#[taurpc::ipc_type]
pub struct SimilarProduct {
    pub procod: String,
    pub prodes: Option<String>,
    pub proprccst: f64,
    pub proprcvdavar: f64,
    /// Preenchido apenas quando `include_stock = true` em `get_by_product`.
    pub stock: Option<Stock>,
}

impl From<Product> for SimilarProduct {
    fn from(p: Product) -> Self {
        SimilarProduct {
            procod: p.procod,
            prodes: p.prodes,
            proprccst: p.proprccst,
            proprcvdavar: p.proprcvdavar,
            stock: None,
        }
    }
}

#[taurpc::ipc_type]
pub struct SimilarGroup {
    pub id: String,
    pub description: Option<String>,
    pub products: Vec<SimilarProduct>,
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
