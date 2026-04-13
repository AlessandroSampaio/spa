use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;

use diesel::{ExpressionMethods, OptionalExtension, QueryDsl, RunQueryDsl, SelectableHelper};

use crate::db::DbPool;
use crate::products::models::{Product, ProductRow};
use crate::stock::models::StockRow;
use super::models::{SimilarGroup, SimilarProduct, SimilarRow};

type DbState = Arc<Mutex<Option<DbPool>>>;

// ── Procedures ────────────────────────────────────────────────────────────────

#[taurpc::procedures(path = "similar")]
pub trait SimilarApi {
    async fn get_by_product(procod: String, include_stock: bool) -> Result<Option<SimilarGroup>, String>;
}

// ── Impl ──────────────────────────────────────────────────────────────────────

#[derive(Clone)]
pub struct SimilarImpl {
    pub db: DbState,
}

#[taurpc::resolvers]
impl SimilarApi for SimilarImpl {
    async fn get_by_product(self, procod: String, include_stock: bool) -> Result<Option<SimilarGroup>, String> {
        let pool = self
            .db
            .lock()
            .await
            .as_ref()
            .ok_or("Sem conexão com o banco de dados")?
            .clone();

        tokio::task::spawn_blocking(move || -> Result<Option<SimilarGroup>, String> {
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

            // 2. Load the similar group header (description).
            let header: SimilarRow = sim_dsl::similares
                .filter(sim_dsl::procodsim.eq(&group_id))
                .select(SimilarRow::as_select())
                .first::<SimilarRow>(&mut *conn)
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

            // 5. Optionally load stock for all products in a single query.
            let mut stock_map: HashMap<String, StockRow> = HashMap::new();
            if include_stock {
                use crate::schema::estoque::dsl as est_dsl;

                let stock_rows: Vec<StockRow> = est_dsl::estoque
                    .filter(est_dsl::procod.eq_any(&product_codes))
                    .select(StockRow::as_select())
                    .load::<StockRow>(&mut *conn)
                    .map_err(|e| e.to_string())?;

                for row in stock_rows {
                    stock_map.insert(row.product_code.clone(), row);
                }
            }

            // 6. Build SimilarProduct list, attaching stock when available.
            let products: Vec<SimilarProduct> = rows
                .into_iter()
                .map(|row| {
                    let mut sp = SimilarProduct::from(Product::from(row));
                    if include_stock {
                        sp.stock = stock_map.remove(&sp.procod).map(crate::stock::models::Stock::from);
                    }
                    sp
                })
                .collect();

            Ok(Some(SimilarGroup {
                id: header.group_code,
                description: header.description,
                products,
            }))
        })
        .await
        .map_err(|e| e.to_string())?
    }
}
