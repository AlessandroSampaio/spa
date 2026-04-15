use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;

use chrono::Datelike;
use diesel::{ExpressionMethods, QueryDsl, RunQueryDsl, SelectableHelper};

use super::models::{MonthlySales, SaleItemRow, SalesSummary};
use crate::db::DbPool;
use crate::utils::{get_start_date, month_name, Interval};

type DbState = Arc<Mutex<Option<DbPool>>>;

// ── Procedures ────────────────────────────────────────────────────────────────

#[taurpc::procedures(path = "sales")]
pub trait SalesApi {
    async fn get_summary_by_product(procod: String, interval: Interval) -> Result<SalesSummary, String>;
}

// ── Impl ──────────────────────────────────────────────────────────────────────

#[derive(Clone)]
pub struct SalesImpl {
    pub db: DbState,
}

#[taurpc::resolvers]
impl SalesApi for SalesImpl {
    async fn get_summary_by_product(self, procod_arg: String, interval: Interval) -> Result<SalesSummary, String> {
        let pool = self
            .db
            .lock()
            .await
            .as_ref()
            .ok_or("Sem conexão com o banco de dados")?
            .clone();

        tokio::task::spawn_blocking(move || -> Result<SalesSummary, String> {
            use crate::schema::itevda::dsl::*;

            let mut conn = pool.get().map_err(|e| e.to_string())?;

            let cutoff = get_start_date(interval);

            let rows: Vec<SaleItemRow> = itevda
                .select(SaleItemRow::as_select())
                .filter(procod.eq(&procod_arg))
                .filter(trndat.ge(cutoff))
                .load(&mut *conn)
                .map_err(|e| e.to_string())?;

            let mut total_qty = 0.0_f64;
            let mut total_sales = 0.0_f64;
            let mut total_cost = 0.0_f64;
            // key: (year, month) → accumulated quantity
            let mut monthly: HashMap<(i32, u32), f64> = HashMap::new();

            for row in &rows {
                let qty = row.quantity_sold.unwrap_or(0.0);
                let total_value = row.total_value.unwrap_or(0.0);
                let cost_price = row.cost_price.unwrap_or(0.0);

                total_qty += qty;
                total_sales += total_value;
                total_cost += qty * cost_price;

                *monthly
                    .entry((row.date.year(), row.date.month()))
                    .or_insert(0.0) += qty;
            }

            // Sort by year then month (chronological) before building response
            let mut monthly_sorted: Vec<(i32, u32, f64)> = monthly
                .into_iter()
                .map(|((y, m), qty)| (y, m, qty))
                .collect();
            monthly_sorted.sort_by(|a, b| a.0.cmp(&b.0).then(a.1.cmp(&b.1)));

            let monthly_sales: Vec<MonthlySales> = monthly_sorted
                .into_iter()
                .map(|(_, m, qty)| MonthlySales {
                    month: month_name(m).to_string(),
                    quantity: qty,
                })
                .collect();

            Ok(SalesSummary {
                product_id: procod_arg,
                quantity_sold: total_qty,
                total_sales,
                total_cost,
                monthly_sales,
            })
        })
        .await
        .map_err(|e| e.to_string())?
    }
}
