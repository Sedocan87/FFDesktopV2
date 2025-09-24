use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct Client {
    pub id: i32,
    pub name: String,
    pub email: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Project {
    pub id: i32,
    pub name: String,
    pub client_id: i32,
    pub rate: Option<f64>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct TimeEntry {
    pub id: i32,
    pub project_id: i32,
    pub start_time: String,
    pub end_time: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Invoice {
    pub id: String,
    pub client_name: String,
    pub issue_date: String,
    pub due_date: String,
    pub amount: f64,
    pub status: String,
    pub currency: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Expense {
    pub id: i32,
    pub project_id: i32,
    pub description: String,
    pub amount: f64,
    pub date: String,
    pub is_billed: bool,
    pub is_billable: bool,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct UserProfile {
    pub company_name: String,
    pub company_email: String,
    pub company_address: String,
    pub logo: Option<Vec<u8>>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct RecurringInvoice {
    pub id: i32,
    pub client_name: String,
    pub frequency: String,
    pub next_due_date: String,
    pub amount: f64,
    pub currency: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct TaxSettings {
    pub rate: f64,
    pub internal_cost_rate: f64,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct CurrencySettings {
    pub default: String,
    pub invoice_language: String,
}