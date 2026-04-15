use chrono::{Datelike, NaiveDate, NaiveDateTime};

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, specta::Type)]
pub enum Interval {
    OneWeek,
    TwoWeeks,
    OneMonth,
    TwoMonths,
    ThreeMonths,
    SixMonths,
}

pub fn month_name(month: u32) -> &'static str {
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
        _ => "Unknown",
    }
}

pub fn days_in_month(year: i32, month: u32) -> u32 {
    let first_of_next = if month == 12 {
        NaiveDate::from_ymd_opt(year + 1, 1, 1)
    } else {
        NaiveDate::from_ymd_opt(year, month + 1, 1)
    };
    first_of_next.unwrap().pred_opt().unwrap().day()
}

pub fn get_start_date(interval: Interval) -> NaiveDateTime {
    let now = chrono::Local::now().naive_local();

    match interval {
        Interval::OneWeek => now - chrono::Duration::weeks(1),
        Interval::TwoWeeks => now - chrono::Duration::weeks(2),
        Interval::OneMonth => subtract_months(&now, 1),
        Interval::TwoMonths => subtract_months(&now, 2),
        Interval::ThreeMonths => subtract_months(&now, 3),
        Interval::SixMonths => subtract_months(&now, 6),
    }
    .date()
    .and_hms_opt(0, 0, 0)
    .unwrap()
}

fn subtract_months(from: &NaiveDateTime, months: i32) -> NaiveDateTime {
    let raw_month = from.month() as i32 - months;
    let (year, month) = if raw_month <= 0 {
        (from.year() - 1, (raw_month + 12) as u32)
    } else {
        (from.year(), raw_month as u32)
    };

    // Clamp day to the last day of the target month (e.g. Aug 31 → Feb 28)
    let day = from.day().min(days_in_month(year, month));

    NaiveDate::from_ymd_opt(year, month, day)
        .unwrap()
        .and_hms_opt(0, 0, 0)
        .unwrap()
}
