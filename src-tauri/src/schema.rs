// Schema parcial da tabela PRODUTO — apenas as colunas utilizadas pelo backend.
// O Diesel não exige mapear todas as colunas; colunas não declaradas aqui
// são simplesmente ignoradas nas queries, sem afetar o banco de dados.

diesel::table! {
    produto (procod) {
        procod -> Text,
        prodes -> Nullable<Text>,
        proprccst -> Nullable<Double>,
        proprcvdavar -> Nullable<Double>,
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
