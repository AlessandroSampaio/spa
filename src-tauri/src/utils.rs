use chrono::{Datelike, NaiveDate, NaiveDateTime};

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

pub fn six_months_ago() -> NaiveDateTime {
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
