use candid::{CandidType, Deserialize, Principal};
use ic_cdk::api::time;
use ic_cdk_macros::{init, post_upgrade, pre_upgrade, query, update};
use serde::Serialize;
use std::cell::RefCell;
use std::collections::HashMap;

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct Loan {
    pub id: u64,
    pub borrower: Principal,
    pub collateral_amount: u64,
    pub loan_amount: u64,
    pub interest_rate: f64,
    pub created_at: u64,
    pub due_date: u64,
    pub status: LoanStatus,
    pub ltv_ratio: f64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug, PartialEq)]
pub enum LoanStatus {
    Active,
    Repaid,
    Liquidated,
    Defaulted,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct UserProfile {
    pub user_principal: Principal,  // Changed from 'principal' to 'user_principal'
    pub total_collateral: u64,
    pub active_loans: Vec<u64>,
    pub credit_score: u32,
    pub created_at: u64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct LoanRequest {
    pub collateral_amount: u64,
    pub requested_amount: u64,
    pub loan_duration_days: u32,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct MarketData {
    pub btc_price_usd: f64,
    pub last_updated: u64,
}

thread_local! {
    static LOANS: RefCell<HashMap<u64, Loan>> = RefCell::new(HashMap::new());
    static USERS: RefCell<HashMap<Principal, UserProfile>> = RefCell::new(HashMap::new());
    static LOAN_COUNTER: RefCell<u64> = RefCell::new(0);
    static MARKET_DATA: RefCell<MarketData> = RefCell::new(MarketData {
        btc_price_usd: 45000.0,
        last_updated: 0,
    });
}

const MAX_LTV_RATIO: f64 = 0.7;
const INTEREST_RATE: f64 = 0.08;

#[init]
fn init() {
    ic_cdk::println!("BBL DeFi App initialized");
}

#[update]
fn create_user_profile() -> Result<UserProfile, String> {
    let caller = ic_cdk::caller();
    
    USERS.with(|users| {
        let mut users_map = users.borrow_mut();
        
        if users_map.contains_key(&caller) {
            return Err("User profile already exists".to_string());
        }
        
        let profile = UserProfile {
            user_principal: caller,
            total_collateral: 0,
            active_loans: Vec::new(),
            credit_score: 750,
            created_at: time(),
        };
        
        users_map.insert(caller, profile.clone());
        Ok(profile)
    })
}

#[update]
fn request_loan(loan_request: LoanRequest) -> Result<Loan, String> {
    let caller = ic_cdk::caller();
    
    if loan_request.collateral_amount == 0 {
        return Err("Collateral amount must be greater than 0".to_string());
    }
    
    if loan_request.requested_amount == 0 {
        return Err("Loan amount must be greater than 0".to_string());
    }
    
    let btc_price = MARKET_DATA.with(|data| data.borrow().btc_price_usd);
    let collateral_value_usd = (loan_request.collateral_amount as f64 / 100_000_000.0) * btc_price;
    let collateral_value_cents = (collateral_value_usd * 100.0) as u64;
    let ltv_ratio = loan_request.requested_amount as f64 / collateral_value_cents as f64;
    
    if ltv_ratio > MAX_LTV_RATIO {
        return Err(format!("LTV ratio too high: {:.2}. Maximum: {:.2}", ltv_ratio, MAX_LTV_RATIO));
    }
    
    let loan_id = LOAN_COUNTER.with(|counter| {
        let mut c = counter.borrow_mut();
        *c += 1;
        *c
    });
    
    let loan = Loan {
        id: loan_id,
        borrower: caller,
        collateral_amount: loan_request.collateral_amount,
        loan_amount: loan_request.requested_amount,
        interest_rate: INTEREST_RATE,
        created_at: time(),
        due_date: time() + (loan_request.loan_duration_days as u64 * 24 * 60 * 60 * 1_000_000_000),
        status: LoanStatus::Active,
        ltv_ratio,
    };
    
    LOANS.with(|loans| {
        loans.borrow_mut().insert(loan_id, loan.clone());
    });
    
    USERS.with(|users| {
        let mut users_map = users.borrow_mut();
        if let Some(profile) = users_map.get_mut(&caller) {
            profile.active_loans.push(loan_id);
            profile.total_collateral += loan_request.collateral_amount;
        }
    });
    
    Ok(loan)
}

#[update]
fn repay_loan(loan_id: u64) -> Result<String, String> {
    let caller = ic_cdk::caller();
    
    LOANS.with(|loans| {
        let mut loans_map = loans.borrow_mut();
        
        match loans_map.get_mut(&loan_id) {
            Some(loan) => {
                if loan.borrower != caller {
                    return Err("Not authorized".to_string());
                }
                
                if loan.status != LoanStatus::Active {
                    return Err("Loan not active".to_string());
                }
                
                let time_elapsed = (time() - loan.created_at) as f64 / (365.25 * 24.0 * 60.0 * 60.0 * 1_000_000_000.0);
                let interest_amount = (loan.loan_amount as f64 * loan.interest_rate * time_elapsed) as u64;
                let total_due = loan.loan_amount + interest_amount;
                
                loan.status = LoanStatus::Repaid;
                
                USERS.with(|users| {
                    let mut users_map = users.borrow_mut();
                    if let Some(profile) = users_map.get_mut(&caller) {
                        profile.active_loans.retain(|&id| id != loan_id);
                        profile.total_collateral -= loan.collateral_amount;
                    }
                });
                
                Ok(format!("Loan repaid. Total: ${:.2}", total_due as f64 / 100.0))
            }
            None => Err("Loan not found".to_string()),
        }
    })
}

#[query]
fn get_user_loans(user: Principal) -> Vec<Loan> {
    LOANS.with(|loans| {
        loans
            .borrow()
            .values()
            .filter(|loan| loan.borrower == user)
            .cloned()
            .collect()
    })
}

#[query]
fn get_loan(loan_id: u64) -> Option<Loan> {
    LOANS.with(|loans| loans.borrow().get(&loan_id).cloned())
}

#[query]
fn get_user_profile(user: Principal) -> Option<UserProfile> {
    USERS.with(|users| users.borrow().get(&user).cloned())
}

#[update]
fn update_btc_price(new_price: f64) -> Result<String, String> {
    if new_price <= 0.0 {
        return Err("Invalid price".to_string());
    }
    
    MARKET_DATA.with(|data| {
        let mut market_data = data.borrow_mut();
        market_data.btc_price_usd = new_price;
        market_data.last_updated = time();
    });
    
    Ok("BTC price updated".to_string())
}

#[query]
fn get_btc_price() -> MarketData {
    MARKET_DATA.with(|data| data.borrow().clone())
}

#[query]
fn calculate_max_loan(collateral_amount: u64) -> u64 {
    let btc_price = MARKET_DATA.with(|data| data.borrow().btc_price_usd);
    let collateral_value_usd = (collateral_amount as f64 / 100_000_000.0) * btc_price;
    let max_loan_usd = collateral_value_usd * MAX_LTV_RATIO;
    (max_loan_usd * 100.0) as u64
}

#[pre_upgrade]
fn pre_upgrade() {}

#[post_upgrade]
fn post_upgrade() {}

ic_cdk::export_candid!();
