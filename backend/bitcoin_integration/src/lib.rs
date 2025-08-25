use candid::{CandidType, Deserialize};
use ic_cdk_macros::{query, update};
use serde::Serialize;

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct BitcoinAddress {
    pub address: String,
    pub network: String,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct BitcoinBalance {
    pub address: String,
    pub balance_satoshis: u64,
}

#[query]
fn get_bitcoin_address() -> BitcoinAddress {
    BitcoinAddress {
        address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh".to_string(),
        network: "testnet".to_string(),
    }
}

#[query]
fn get_bitcoin_balance(address: String) -> BitcoinBalance {
    BitcoinBalance {
        address,
        balance_satoshis: 50000000,
    }
}

#[update]
fn verify_bitcoin_transaction(tx_id: String) -> Result<bool, String> {
    if tx_id.is_empty() {
        return Err("Invalid transaction ID".to_string());
    }
    Ok(true)
}

ic_cdk::export_candid!();
