use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Default, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Client {
    pub id: String,
    pub name: String,
    pub email: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Default, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Project {
    pub id: String,
    pub name: String,
    pub client_id: String,
    pub rate: Option<f64>,
}

#[derive(Serialize, Deserialize, Debug, Default, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TimeEntry {
    pub id: String,
    pub project_id: String,
    pub start_time: String,
    pub end_time: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Default, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Invoice {
    pub id: String,
    pub client_name: String,
    pub issue_date: String,
    pub due_date: String,
    pub amount: f64,
    pub status: String,
    pub currency: String,
}

#[derive(Serialize, Deserialize, Debug, Default, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Expense {
    pub id: String,
    pub project_id: String,
    pub description: String,
    pub amount: f64,
    pub date: String,
    pub is_billed: bool,
    pub is_billable: bool,
}

#[derive(Serialize, Deserialize, Debug, Default, Clone)]
pub struct UserProfile {
    #[serde(rename = "companyName")]
    pub company_name: String,
    #[serde(rename = "companyEmail")]
    pub company_email: String,
    #[serde(rename = "companyAddress")]
    pub company_address: String,
    pub logo: Option<Vec<u8>>,
}

#[derive(Serialize, Deserialize, Debug, Default, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RecurringInvoice {
    pub id: String,
    pub client_name: String,
    pub frequency: String,
    pub next_due_date: String,
    pub amount: f64,
    pub currency: String,
    pub status: String,
}

#[derive(Serialize, Deserialize, Debug, Default, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TaxSettings {
    pub rate: f64,
    pub internal_cost_rate: f64,
}

#[derive(Serialize, Deserialize, Debug, Default, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CurrencySettings {
    #[serde(rename = "default")]
    pub default_currency: String,
    #[serde(rename = "invoiceLanguage")]
    pub invoice_language: String,
}