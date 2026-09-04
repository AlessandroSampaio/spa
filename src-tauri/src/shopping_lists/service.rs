use std::collections::HashMap;
use std::sync::{Arc, OnceLock};
use tokio::sync::Mutex;

use chrono::NaiveDateTime;
use diesel::dsl::sql;
use diesel::sql_types::{Integer, Text};
use diesel::{
    sql_query, ExpressionMethods, OptionalExtension, QueryDsl, RunQueryDsl, SelectableHelper,
};

use super::models::{
    LastPurchaseRow, NewShoppingListItemRow, NewShoppingListRow, PurchaseParameters,
    ShoppingList, ShoppingListItemDetail, ShoppingListRow,
};
use crate::db::DbPool;
use crate::local_db::LocalDbPool;
use crate::utils::{get_start_date, Interval};

type DbState = Arc<Mutex<Option<DbPool>>>;
type LocalDbState = Arc<OnceLock<LocalDbPool>>;

// Approximate days per interval — mirrors `intervalDays()` in Dashboard.tsx.
fn interval_days(interval: &Interval) -> f64 {
    match interval {
        Interval::OneWeek => 7.0,
        Interval::TwoWeeks => 14.0,
        Interval::OneMonth => 30.0,
        Interval::TwoMonths => 60.0,
        Interval::ThreeMonths => 91.0,
        Interval::SixMonths => 182.0,
    }
}

// ── Procedures ────────────────────────────────────────────────────────────────

#[taurpc::procedures(path = "shopping_lists")]
pub trait ShoppingListsApi {
    async fn create_list(name: String) -> Result<ShoppingList, String>;
    async fn get_lists() -> Result<Vec<ShoppingList>, String>;
    async fn rename_list(id: i32, name: String) -> Result<(), String>;
    async fn delete_list(id: i32) -> Result<(), String>;
    async fn add_item(list_id: i32, product_code: String) -> Result<(), String>;
    async fn remove_item(item_id: i32) -> Result<(), String>;
    async fn get_list_items(
        list_id: i32,
        interval: Interval,
        target_stock_days: i32,
    ) -> Result<Vec<ShoppingListItemDetail>, String>;
    async fn get_purchase_parameters() -> Result<Option<PurchaseParameters>, String>;
    async fn save_purchase_parameters(params: PurchaseParameters) -> Result<(), String>;
}

// ── Impl ──────────────────────────────────────────────────────────────────────

#[derive(Clone)]
pub struct ShoppingListsImpl {
    pub db: DbState,
    pub local_db: LocalDbState,
}

#[taurpc::resolvers]
impl ShoppingListsApi for ShoppingListsImpl {
    async fn create_list(self, name_arg: String) -> Result<ShoppingList, String> {
        let trimmed = name_arg.trim().to_string();
        if trimmed.is_empty() {
            return Err("Nome da lista não pode ser vazio".to_string());
        }

        let pool = self
            .local_db
            .get()
            .ok_or("Banco de dados local não disponível")?
            .clone();

        tokio::task::spawn_blocking(move || -> Result<ShoppingList, String> {
            use crate::local_schema::shopping_lists::dsl::*;

            let mut conn = pool.get().map_err(|e| e.to_string())?;

            let new_row = NewShoppingListRow { name: &trimmed };
            diesel::insert_into(shopping_lists)
                .values(&new_row)
                .execute(&mut conn)
                .map_err(|e| e.to_string())?;

            // SQLite RETURNING isn't enabled — fetch the new row id the
            // standard Diesel+SQLite way (rowid is connection-scoped, so
            // this must run on the same `conn` used for the insert above).
            let new_id: i32 = diesel::select(sql::<Integer>("last_insert_rowid()"))
                .get_result(&mut conn)
                .map_err(|e| e.to_string())?;

            shopping_lists
                .filter(id.eq(new_id))
                .select(ShoppingListRow::as_select())
                .first::<ShoppingListRow>(&mut conn)
                .map(|row| ShoppingList {
                    id: row.id,
                    name: row.name,
                    created_at: row.created_at,
                    item_count: 0,
                })
                .map_err(|e| e.to_string())
        })
        .await
        .map_err(|e| e.to_string())?
    }

    async fn get_lists(self) -> Result<Vec<ShoppingList>, String> {
        let pool = self
            .local_db
            .get()
            .ok_or("Banco de dados local não disponível")?
            .clone();

        tokio::task::spawn_blocking(move || -> Result<Vec<ShoppingList>, String> {
            use crate::local_schema::shopping_list_items::dsl as sli;
            use crate::local_schema::shopping_lists::dsl as sl;

            let mut conn = pool.get().map_err(|e| e.to_string())?;

            let lists: Vec<ShoppingListRow> = sl::shopping_lists
                .select(ShoppingListRow::as_select())
                .order(sl::created_at.desc())
                .load(&mut conn)
                .map_err(|e| e.to_string())?;

            let item_list_ids: Vec<i32> = sli::shopping_list_items
                .select(sli::list_id)
                .load(&mut conn)
                .map_err(|e| e.to_string())?;

            let mut count_map: HashMap<i32, i32> = HashMap::new();
            for lid in item_list_ids {
                *count_map.entry(lid).or_insert(0) += 1;
            }

            Ok(lists
                .into_iter()
                .map(|row| ShoppingList {
                    item_count: count_map.get(&row.id).copied().unwrap_or(0),
                    id: row.id,
                    name: row.name,
                    created_at: row.created_at,
                })
                .collect())
        })
        .await
        .map_err(|e| e.to_string())?
    }

    async fn rename_list(self, id_arg: i32, name_arg: String) -> Result<(), String> {
        let trimmed = name_arg.trim().to_string();
        if trimmed.is_empty() {
            return Err("Nome da lista não pode ser vazio".to_string());
        }

        let pool = self
            .local_db
            .get()
            .ok_or("Banco de dados local não disponível")?
            .clone();

        tokio::task::spawn_blocking(move || -> Result<(), String> {
            use crate::local_schema::shopping_lists::dsl::*;

            let mut conn = pool.get().map_err(|e| e.to_string())?;
            diesel::update(shopping_lists.filter(id.eq(id_arg)))
                .set(name.eq(trimmed))
                .execute(&mut conn)
                .map_err(|e| e.to_string())?;
            Ok(())
        })
        .await
        .map_err(|e| e.to_string())?
    }

    async fn delete_list(self, id_arg: i32) -> Result<(), String> {
        let pool = self
            .local_db
            .get()
            .ok_or("Banco de dados local não disponível")?
            .clone();

        tokio::task::spawn_blocking(move || -> Result<(), String> {
            use crate::local_schema::shopping_lists::dsl::*;

            let mut conn = pool.get().map_err(|e| e.to_string())?;
            // ON DELETE CASCADE removes matching shopping_list_items rows.
            diesel::delete(shopping_lists.filter(id.eq(id_arg)))
                .execute(&mut conn)
                .map_err(|e| e.to_string())?;
            Ok(())
        })
        .await
        .map_err(|e| e.to_string())?
    }

    async fn add_item(self, list_id_arg: i32, product_code_arg: String) -> Result<(), String> {
        let pool = self
            .local_db
            .get()
            .ok_or("Banco de dados local não disponível")?
            .clone();

        tokio::task::spawn_blocking(move || -> Result<(), String> {
            use crate::local_schema::shopping_list_items::dsl::*;

            let mut conn = pool.get().map_err(|e| e.to_string())?;
            let new_row = NewShoppingListItemRow {
                list_id: list_id_arg,
                product_code: &product_code_arg,
            };

            // Idempotent add: silently no-ops if (list_id, product_code)
            // already exists, relying on the UNIQUE constraint.
            diesel::insert_into(shopping_list_items)
                .values(&new_row)
                .on_conflict((list_id, product_code))
                .do_nothing()
                .execute(&mut conn)
                .map_err(|e| e.to_string())?;
            Ok(())
        })
        .await
        .map_err(|e| e.to_string())?
    }

    async fn remove_item(self, item_id_arg: i32) -> Result<(), String> {
        let pool = self
            .local_db
            .get()
            .ok_or("Banco de dados local não disponível")?
            .clone();

        tokio::task::spawn_blocking(move || -> Result<(), String> {
            use crate::local_schema::shopping_list_items::dsl::*;

            let mut conn = pool.get().map_err(|e| e.to_string())?;
            diesel::delete(shopping_list_items.filter(id.eq(item_id_arg)))
                .execute(&mut conn)
                .map_err(|e| e.to_string())?;
            Ok(())
        })
        .await
        .map_err(|e| e.to_string())?
    }

    async fn get_list_items(
        self,
        list_id_arg: i32,
        interval: Interval,
        target_stock_days: i32,
    ) -> Result<Vec<ShoppingListItemDetail>, String> {
        // 1. Load (item_id, product_code) pairs for this list from local SQLite.
        let local_pool = self
            .local_db
            .get()
            .ok_or("Banco de dados local não disponível")?
            .clone();

        let items: Vec<(i32, String)> = tokio::task::spawn_blocking(
            move || -> Result<Vec<(i32, String)>, String> {
                use crate::local_schema::shopping_list_items::dsl::*;

                let mut conn = local_pool.get().map_err(|e| e.to_string())?;
                shopping_list_items
                    .filter(list_id.eq(list_id_arg))
                    .order(added_at.asc())
                    .select((id, product_code))
                    .load::<(i32, String)>(&mut conn)
                    .map_err(|e| e.to_string())
            },
        )
        .await
        .map_err(|e| e.to_string())??;

        if items.is_empty() {
            return Ok(vec![]);
        }

        let codes: Vec<String> = items.iter().map(|(_, code)| code.clone()).collect();

        // 2. Batch-query Firebird for description/stock/sales/last purchase.
        let fb_pool = self
            .db
            .lock()
            .await
            .as_ref()
            .ok_or("Sem conexão com o banco de dados")?
            .clone();

        tokio::task::spawn_blocking(move || -> Result<Vec<ShoppingListItemDetail>, String> {
            let mut conn = fb_pool.get().map_err(|e| e.to_string())?;

            // 2a. Descriptions (batched, same eq_any pattern as similar::service).
            let desc_map: HashMap<String, Option<String>> = {
                use crate::schema::produto::dsl as p;
                p::produto
                    .filter(p::procod.eq_any(&codes))
                    .select((p::procod, p::prodes))
                    .load::<(String, Option<String>)>(&mut *conn)
                    .map_err(|e| e.to_string())?
                    .into_iter()
                    .collect()
            };

            // 2b. Stock balances (batched, same eq_any pattern as similar::service).
            let stock_map: HashMap<String, f64> = {
                use crate::schema::estoque::dsl as e;
                e::estoque
                    .filter(e::procod.eq_any(&codes))
                    .select((e::procod, e::estatusdo))
                    .load::<(String, f64)>(&mut *conn)
                    .map_err(|e| e.to_string())?
                    .into_iter()
                    .collect()
            };

            // 2c. Average daily sales within the selected interval — one
            // batched query over itevda, aggregated in Rust (same style as
            // sales::service::get_summary_by_product).
            let cutoff = get_start_date(interval.clone());
            let days = interval_days(&interval);

            let sales_map: HashMap<String, f64> = {
                use crate::schema::itevda::dsl as s;
                let rows: Vec<(Option<String>, Option<f64>)> = s::itevda
                    .filter(s::procod.eq_any(&codes))
                    .filter(s::trndat.ge(cutoff))
                    .select((s::procod, s::itvqtdvda))
                    .load(&mut *conn)
                    .map_err(|e| e.to_string())?;

                let mut totals: HashMap<String, f64> = HashMap::new();
                for (code, qty) in rows {
                    if let Some(code) = code {
                        *totals.entry(code).or_insert(0.0) += qty.unwrap_or(0.0);
                    }
                }
                totals
                    .into_iter()
                    .map(|(code, total)| (code, total / days))
                    .collect()
            };

            // 2d. Last purchase date — one raw query batched across all
            // codes via a dynamically-bound IN (...) clause (BoxedSqlQuery
            // supports binding a variable number of parameters in a loop).
            let placeholders = codes.iter().map(|_| "?").collect::<Vec<_>>().join(", ");
            let sql_text = format!(
                "SELECT ie.PROCOD AS product_code, MAX(e.ENTDAT) AS last_purchase \
                 FROM ITEM_ENTRADA ie \
                 INNER JOIN ENTRADA e \
                         ON ie.FORCOD = e.FORCOD \
                        AND ie.ENTSER = e.ENTSER \
                        AND ie.ENTDOC = e.ENTDOC \
                        AND ie.ENTTNF = e.ENTTNF \
                 WHERE ie.PROCOD IN ({}) \
                 GROUP BY ie.PROCOD",
                placeholders
            );

            let mut query = sql_query(sql_text).into_boxed::<rsfbclient_diesel::backend::Fb>();
            for code in &codes {
                query = query.bind::<Text, _>(code.clone());
            }
            let purchase_rows: Vec<LastPurchaseRow> =
                query.load(&mut *conn).map_err(|e| e.to_string())?;

            let purchase_map: HashMap<String, NaiveDateTime> = purchase_rows
                .into_iter()
                .filter_map(|r| r.last_purchase.map(|d| (r.product_code, d)))
                .collect();

            // 3. Merge everything, one row per list item, preserving added_at order.
            let result = items
                .into_iter()
                .map(|(item_id, code)| {
                    let stock_balance = stock_map.get(&code).copied();
                    let avg_daily_sales = sales_map.get(&code).copied().unwrap_or(0.0);
                    let last_purchase_date = purchase_map
                        .get(&code)
                        .map(|d| d.format("%Y-%m-%d").to_string());

                    let suggested_purchase_qty = Some(
                        (avg_daily_sales * target_stock_days as f64
                            - stock_balance.unwrap_or(0.0))
                        .max(0.0)
                        .ceil(),
                    );

                    ShoppingListItemDetail {
                        item_id,
                        description: desc_map.get(&code).cloned().flatten(),
                        stock_balance,
                        last_purchase_date,
                        avg_daily_sales: Some(avg_daily_sales),
                        suggested_purchase_qty,
                        product_code: code,
                    }
                })
                .collect();

            Ok(result)
        })
        .await
        .map_err(|e| e.to_string())?
    }

    async fn get_purchase_parameters(self) -> Result<Option<PurchaseParameters>, String> {
        let pool = self
            .local_db
            .get()
            .ok_or("Banco de dados local não disponível")?
            .clone();

        tokio::task::spawn_blocking(move || -> Result<Option<PurchaseParameters>, String> {
            use crate::local_schema::purchase_parameters::dsl::*;

            let mut conn = pool.get().map_err(|e| e.to_string())?;
            purchase_parameters
                .select(target_stock_days)
                .filter(id.eq(1))
                .first::<i32>(&mut conn)
                .optional()
                .map(|opt| opt.map(|days| PurchaseParameters { target_stock_days: days }))
                .map_err(|e| e.to_string())
        })
        .await
        .map_err(|e| e.to_string())?
    }

    async fn save_purchase_parameters(self, params: PurchaseParameters) -> Result<(), String> {
        let pool = self
            .local_db
            .get()
            .ok_or("Banco de dados local não disponível")?
            .clone();

        tokio::task::spawn_blocking(move || -> Result<(), String> {
            use crate::local_schema::purchase_parameters::dsl::*;

            let mut conn = pool.get().map_err(|e| e.to_string())?;
            diesel::replace_into(purchase_parameters)
                .values((id.eq(1), target_stock_days.eq(params.target_stock_days)))
                .execute(&mut conn)
                .map_err(|e| e.to_string())?;
            Ok(())
        })
        .await
        .map_err(|e| e.to_string())?
    }
}
