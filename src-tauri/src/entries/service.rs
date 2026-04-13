use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;

use chrono::Datelike;
use diesel::{RunQueryDsl, sql_query};
use diesel::sql_types::{Text, Timestamp};

use super::models::{EntriesSummary, EntryItemRow, MonthlyEntries};
use crate::db::DbPool;
use crate::utils::{month_name, six_months_ago};

type DbState = Arc<Mutex<Option<DbPool>>>;

// ── Procedures ────────────────────────────────────────────────────────────────

#[taurpc::procedures(path = "entries")]
pub trait EntriesApi {
    async fn get_summary_by_product(procod: String) -> Result<EntriesSummary, String>;
}

// ── Impl ──────────────────────────────────────────────────────────────────────

#[derive(Clone)]
pub struct EntriesImpl {
    pub db: DbState,
}

#[taurpc::resolvers]
impl EntriesApi for EntriesImpl {
    async fn get_summary_by_product(self, procod_arg: String) -> Result<EntriesSummary, String> {
        let pool = self
            .db
            .lock()
            .await
            .as_ref()
            .ok_or("Sem conexão com o banco de dados")?
            .clone();

        tokio::task::spawn_blocking(move || -> Result<EntriesSummary, String> {
            let mut conn = pool.get().map_err(|e| e.to_string())?;

            let cutoff = six_months_ago();

            let rows: Vec<EntryItemRow> = sql_query(
                "SELECT e.ENTDAT AS date, \
                        ie.ITEQTDEMB AS quantity_emb, \
                        ie.ITEUNIEMB AS units_emb, \
                        ie.ITEVLRTOT AS total_value \
                 FROM ITEM_ENTRADA ie \
                 INNER JOIN ENTRADA e \
                         ON ie.FORCOD = e.FORCOD \
                        AND ie.ENTSER = e.ENTSER \
                        AND ie.ENTDOC = e.ENTDOC \
                        AND ie.ENTTNF = e.ENTTNF \
                 WHERE ie.PROCOD = ? \
                   AND e.ENTDAT >= ?",
            )
            .bind::<Text, _>(&procod_arg)
            .bind::<Timestamp, _>(cutoff)
            .load(&mut *conn)
            .map_err(|e| e.to_string())?;

            let mut total_qty = 0.0_f64;
            let mut total_value = 0.0_f64;
            // key: (year, month) → accumulated quantity
            let mut monthly: HashMap<(i32, u32), f64> = HashMap::new();

            for row in &rows {
                let qty_emb = row.quantity_emb.unwrap_or(0.0);
                let units_emb = row.units_emb.unwrap_or(1.0);
                let qty = qty_emb * units_emb;

                total_qty += qty;
                total_value += row.total_value.unwrap_or(0.0);

                if let Some(date) = row.date {
                    *monthly.entry((date.year(), date.month())).or_insert(0.0) += qty;
                }
            }

            let mut monthly_sorted: Vec<(i32, u32, f64)> = monthly
                .into_iter()
                .map(|((y, m), qty)| (y, m, qty))
                .collect();
            monthly_sorted.sort_by(|a, b| a.0.cmp(&b.0).then(a.1.cmp(&b.1)));

            let monthly_entries: Vec<MonthlyEntries> = monthly_sorted
                .into_iter()
                .map(|(_, m, qty)| MonthlyEntries {
                    month: month_name(m).to_string(),
                    quantity: qty,
                })
                .collect();

            Ok(EntriesSummary {
                product_id: procod_arg,
                quantity_purchased: total_qty,
                total_value,
                monthly_entries,
            })
        })
        .await
        .map_err(|e| e.to_string())?
    }
}
