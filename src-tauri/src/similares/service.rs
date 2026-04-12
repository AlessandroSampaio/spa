use std::sync::Arc;
use tokio::sync::Mutex;

use diesel::{ExpressionMethods, OptionalExtension, QueryDsl, RunQueryDsl, SelectableHelper};

use crate::db::DbPool;
use crate::products::models::{Product, ProductRow};
use super::models::{SimilaresGroup, SimilaresRow};

type DbState = Arc<Mutex<Option<DbPool>>>;

// ── Procedures ────────────────────────────────────────────────────────────────

#[taurpc::procedures(path = "similares")]
pub trait SimilaresApi {
    async fn get_by_product(procod: String) -> Result<Option<SimilaresGroup>, String>;
}

// ── Impl ──────────────────────────────────────────────────────────────────────

#[derive(Clone)]
pub struct SimilaresImpl {
    pub db: DbState,
}

#[taurpc::resolvers]
impl SimilaresApi for SimilaresImpl {
    async fn get_by_product(self, procod: String) -> Result<Option<SimilaresGroup>, String> {
        let pool = self
            .db
            .lock()
            .await
            .as_ref()
            .ok_or("Sem conexão com o banco de dados")?
            .clone();

        tokio::task::spawn_blocking(move || -> Result<Option<SimilaresGroup>, String> {
            use crate::schema::item_similares::dsl as is_dsl;
            use crate::schema::similares::dsl as sim_dsl;
            use crate::schema::produto::dsl as prod_dsl;

            let mut conn = pool.get().map_err(|e| e.to_string())?;

            // 1. Find the group id this product belongs to.
            let group_id: Option<String> = is_dsl::item_similares
                .filter(is_dsl::procod.eq(&procod))
                .select(is_dsl::procodsim)
                .first::<String>(&mut *conn)
                .optional()
                .map_err(|e: diesel::result::Error| e.to_string())?;

            let group_id = match group_id {
                Some(id) => id,
                None => return Ok(None),
            };

            // 2. Load the similares header (description).
            let header: SimilaresRow = sim_dsl::similares
                .filter(sim_dsl::procodsim.eq(&group_id))
                .select(SimilaresRow::as_select())
                .first::<SimilaresRow>(&mut *conn)
                .map_err(|e| e.to_string())?;

            // 3. Collect all product codes in this group.
            let product_codes: Vec<String> = is_dsl::item_similares
                .filter(is_dsl::procodsim.eq(&group_id))
                .select(is_dsl::procod)
                .load::<String>(&mut *conn)
                .map_err(|e| e.to_string())?;

            // 4. Load the matching PRODUTO rows.
            let rows: Vec<ProductRow> = prod_dsl::produto
                .filter(prod_dsl::procod.eq_any(&product_codes))
                .select(ProductRow::as_select())
                .load::<ProductRow>(&mut *conn)
                .map_err(|e| e.to_string())?;

            let similares: Vec<Product> = rows.into_iter().map(Product::from).collect();

            Ok(Some(SimilaresGroup {
                id: header.procodsim,
                descricao: header.similaresdes,
                similares,
            }))
        })
        .await
        .map_err(|e| e.to_string())?
    }
}
