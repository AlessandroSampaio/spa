use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;

use chrono::{Datelike, NaiveDate, NaiveDateTime};
use diesel::{ExpressionMethods, QueryDsl, RunQueryDsl, SelectableHelper};

use super::models::{ItemVendaRow, ResumoVendas, VendaMediaMensal};
use crate::db::DbPool;

type DbState = Arc<Mutex<Option<DbPool>>>;

// ── Helpers ───────────────────────────────────────────────────────────────────

fn month_name_pt(month: u32) -> &'static str {
    match month {
        1 => "Janeiro",
        2 => "Fevereiro",
        3 => "Março",
        4 => "Abril",
        5 => "Maio",
        6 => "Junho",
        7 => "Julho",
        8 => "Agosto",
        9 => "Setembro",
        10 => "Outubro",
        11 => "Novembro",
        12 => "Dezembro",
        _ => "Desconhecido",
    }
}

fn days_in_month(year: i32, month: u32) -> u32 {
    let first_of_next = if month == 12 {
        NaiveDate::from_ymd_opt(year + 1, 1, 1)
    } else {
        NaiveDate::from_ymd_opt(year, month + 1, 1)
    };
    first_of_next
        .unwrap()
        .pred_opt()
        .unwrap()
        .day()
}

fn six_months_ago() -> NaiveDateTime {
    let now = chrono::Local::now().naive_local();

    let raw_month = now.month() as i32 - 6;
    let (year, month) = if raw_month <= 0 {
        (now.year() - 1, (raw_month + 12) as u32)
    } else {
        (now.year(), raw_month as u32)
    };

    // Clamp day to the last day of the target month (e.g. Aug 31 → Feb 28)
    let day = now.day().min(days_in_month(year, month));

    NaiveDate::from_ymd_opt(year, month, day)
        .unwrap()
        .and_hms_opt(0, 0, 0)
        .unwrap()
}

// ── Procedures ────────────────────────────────────────────────────────────────

#[taurpc::procedures(path = "vendas")]
pub trait VendasApi {
    async fn get_resumo_by_product(procod: String) -> Result<ResumoVendas, String>;
}

// ── Impl ──────────────────────────────────────────────────────────────────────

#[derive(Clone)]
pub struct VendasImpl {
    pub db: DbState,
}

#[taurpc::resolvers]
impl VendasApi for VendasImpl {
    async fn get_resumo_by_product(self, procod_arg: String) -> Result<ResumoVendas, String> {
        let pool = self
            .db
            .lock()
            .await
            .as_ref()
            .ok_or("Sem conexão com o banco de dados")?
            .clone();

        tokio::task::spawn_blocking(move || -> Result<ResumoVendas, String> {
            use crate::schema::itevda::dsl::*;

            let mut conn = pool.get().map_err(|e| e.to_string())?;

            let cutoff = six_months_ago();

            let rows: Vec<ItemVendaRow> = itevda
                .select(ItemVendaRow::as_select())
                .filter(procod.eq(&procod_arg))
                .filter(trndat.ge(cutoff))
                .load(&mut *conn)
                .map_err(|e| e.to_string())?;

            let mut total_qty = 0.0_f64;
            let mut total_venda = 0.0_f64;
            let mut total_custo = 0.0_f64;
            // key: (year, month) → accumulated quantity
            let mut monthly: HashMap<(i32, u32), f64> = HashMap::new();

            for row in &rows {
                let qty = row.itvqtdvda.unwrap_or(0.0);
                let vlrtot = row.itvvlrtot.unwrap_or(0.0);
                let prccst = row.itvprccst.unwrap_or(0.0);

                total_qty += qty;
                total_venda += vlrtot;
                total_custo += qty * prccst;

                *monthly
                    .entry((row.trndat.year(), row.trndat.month()))
                    .or_insert(0.0) += qty;
            }

            // Sort by year then month (chronological) before building response
            let mut monthly_sorted: Vec<(i32, u32, f64)> = monthly
                .into_iter()
                .map(|((y, m), qty)| (y, m, qty))
                .collect();
            monthly_sorted.sort_by(|a, b| a.0.cmp(&b.0).then(a.1.cmp(&b.1)));

            let venda_media_mensal: Vec<VendaMediaMensal> = monthly_sorted
                .into_iter()
                .map(|(_, m, qty)| VendaMediaMensal {
                    mes: month_name_pt(m).to_string(),
                    quantidade: qty,
                })
                .collect();

            Ok(ResumoVendas {
                produto_id: procod_arg,
                quantidade_vendida: total_qty,
                total_venda,
                total_custo,
                venda_media_mensal,
            })
        })
        .await
        .map_err(|e| e.to_string())?
    }
}
