use std::sync::Arc;
use tokio::sync::Mutex;

use diesel::{
    ExpressionMethods, OptionalExtension, QueryDsl, RunQueryDsl, SelectableHelper,
    TextExpressionMethods,
};

use super::models::{Product, ProductRow, ProductsFilter};
use crate::db::DbPool;

type DbState = Arc<Mutex<Option<DbPool>>>;

// ── Procedures ────────────────────────────────────────────────────────────────

#[taurpc::procedures(path = "products")]
pub trait ProductsApi {
    async fn get_all(filter: ProductsFilter) -> Result<Vec<Product>, String>;
    async fn get_by_code(procod: String) -> Result<Option<Product>, String>;
}

// ── Impl ──────────────────────────────────────────────────────────────────────

#[derive(Clone)]
pub struct ProductsImpl {
    pub db: DbState,
}

#[taurpc::resolvers]
impl ProductsApi for ProductsImpl {
    async fn get_all(self, filter: ProductsFilter) -> Result<Vec<Product>, String> {
        let pool = self
            .db
            .lock()
            .await
            .as_ref()
            .ok_or("Sem conexão com o banco de dados")?
            .clone();

        tokio::task::spawn_blocking(move || -> Result<Vec<Product>, String> {
            use crate::schema::produto::dsl::*;

            let mut conn = pool.get().map_err(|e| e.to_string())?;

            let limit = filter.limit.unwrap_or(100).min(500) as i64;
            let offset = filter.offset.unwrap_or(0) as i64;

            let rows: Vec<ProductRow> = if let Some(search) = filter.search {
                let pattern = format!("%{}%", search.to_uppercase());
                produto
                    .select(ProductRow::as_select())
                    .filter(prodes.like(pattern))
                    .order(prodes.asc())
                    .limit(limit)
                    .offset(offset)
                    .load(&mut *conn)
                    .map_err(|e: diesel::result::Error| e.to_string())?
            } else {
                produto
                    .select(ProductRow::as_select())
                    .order(prodes.asc())
                    .limit(limit)
                    .offset(offset)
                    .load(&mut *conn)
                    .map_err(|e: diesel::result::Error| e.to_string())?
            };

            Ok(rows.into_iter().map(Product::from).collect())
        })
        .await
        .map_err(|e| e.to_string())?
    }

    async fn get_by_code(self, procod_arg: String) -> Result<Option<Product>, String> {
        let pool = self
            .db
            .lock()
            .await
            .as_ref()
            .ok_or("Sem conexão com o banco de dados")?
            .clone();

        tokio::task::spawn_blocking(move || -> Result<Option<Product>, String> {
            use crate::schema::produto::dsl::*;

            let mut conn = pool.get().map_err(|e| e.to_string())?;

            produto
                .select(ProductRow::as_select())
                .filter(procod.eq(procod_arg))
                .first::<ProductRow>(&mut *conn)
                .optional()
                .map(|opt: Option<ProductRow>| opt.map(Product::from))
                .map_err(|e: diesel::result::Error| e.to_string())
        })
        .await
        .map_err(|e| e.to_string())?
    }
}
