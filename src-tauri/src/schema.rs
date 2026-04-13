// Schema parcial da tabela PRODUTO — apenas as colunas utilizadas pelo backend.
// O Diesel não exige mapear todas as colunas; colunas não declaradas aqui
// são simplesmente ignoradas nas queries, sem afetar o banco de dados.

diesel::table! {
    use diesel::sql_types::*;

    produto (procod) {
        procod -> Text,
        prodes -> Nullable<Text>,
        proprccst -> Nullable<Double>,
        proprcvdavar -> Nullable<Double>,
        proforlin -> Nullable<Text>,
        prodatforlin -> Nullable<Timestamp>,
    }
}

diesel::table! {
    similares (procodsim) {
        procodsim -> Text,
        similaresdes -> Nullable<Text>,
    }
}

diesel::table! {
    item_similares (procodsim, procod) {
        procodsim -> Text,
        procod -> Text,
    }
}

diesel::table! {
    estoque (procod) {
        procod -> Text,
        estatusdo -> Double,
    }
}

diesel::table! {
    use diesel::sql_types::*;

    entrada (forcod, entser, entdoc, enttnf) {
        forcod -> Text,
        entser -> Text,
        entdoc -> Text,
        enttnf -> Text,
        entdat -> Nullable<Timestamp>,
    }
}

diesel::table! {
    use diesel::sql_types::*;

    item_entrada (forcod, entser, entdoc, enttnf, iteseq) {
        forcod    -> Text,
        entser    -> Text,
        entdoc    -> Text,
        enttnf    -> Text,
        iteseq    -> Integer,
        procod    -> Text,
        iteuniemb -> Nullable<Double>,
        iteqtdemb -> Nullable<Double>,
        itevlrtot -> Nullable<Double>,
    }
}

diesel::table! {
    use diesel::sql_types::*;

    itevda (id) {
        id -> Integer,
        trndat -> Timestamp,
        procod -> Nullable<Text>,
        itvqtdvda -> Nullable<Double>,
        itvvlruni -> Nullable<Double>,
        itvvlrdcn -> Nullable<Double>,
        itvvlracr -> Nullable<Double>,
        itvvlrtot -> Nullable<Double>,
        itvprccst -> Nullable<Double>,
    }
}
