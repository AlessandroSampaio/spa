use std::sync::Arc;
use tokio::sync::Mutex;

use diesel::{ExpressionMethods, OptionalExtension, QueryDsl, RunQueryDsl, SelectableHelper};

use crate::db::DbPool;
use super::models::{Stock, StockRow};

type DbState = Arc<Mutex<Option<DbPool>>>;

// ── Procedures ────────────────────────────────────────────────────────────────

#[taurpc::procedures(path = "stock")]
pub trait StockApi {
    async fn get_by_product(procod: String) -> Result<Option<Stock>, String>;
}

// ── Impl ──────────────────────────────────────────────────────────────────────

#[derive(Clone)]
pub struct StockImpl {
    pub db: DbState,
}

#[taurpc::resolvers]
impl StockApi for StockImpl {
    async fn get_by_product(self, procod: String) -> Result<Option<Stock>, String> {
        let pool = self
            .db
            .lock()
            .await
            .as_ref()
            .ok_or("Sem conexão com o banco de dados")?
            .clone();

        tokio::task::spawn_blocking(move || -> Result<Option<Stock>, String> {
            use crate::schema::estoque::dsl;

            let mut conn = pool.get().map_err(|e| e.to_string())?;

            let row: Option<StockRow> = dsl::estoque
                .filter(dsl::procod.eq(&procod))
                .select(StockRow::as_select())
                .first::<StockRow>(&mut *conn)
                .optional()
                .map_err(|e| e.to_string())?;

            Ok(row.map(Stock::from))
        })
        .await
        .map_err(|e| e.to_string())?
    }
}
