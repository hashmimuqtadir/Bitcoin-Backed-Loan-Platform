import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Loan {
  'id' : bigint,
  'collateral_amount' : bigint,
  'status' : LoanStatus,
  'created_at' : bigint,
  'borrower' : Principal,
  'loan_amount' : bigint,
  'interest_rate' : number,
  'due_date' : bigint,
  'ltv_ratio' : number,
}
export interface LoanRequest {
  'collateral_amount' : bigint,
  'requested_amount' : bigint,
  'loan_duration_days' : number,
}
export type LoanStatus = { 'Repaid' : null } |
  { 'Active' : null } |
  { 'Defaulted' : null } |
  { 'Liquidated' : null };
export interface MarketData {
  'last_updated' : bigint,
  'btc_price_usd' : number,
}
export type Result = { 'Ok' : Loan } |
  { 'Err' : string };
export type Result_1 = { 'Ok' : UserProfile } |
  { 'Err' : string };
export type Result_2 = { 'Ok' : string } |
  { 'Err' : string };
export interface UserProfile {
  'user_principal' : Principal,
  'total_collateral' : bigint,
  'created_at' : bigint,
  'active_loans' : BigUint64Array | bigint[],
  'credit_score' : number,
}
export interface _SERVICE {
  'calculate_max_loan' : ActorMethod<[bigint], bigint>,
  'create_user_profile' : ActorMethod<[], Result_1>,
  'get_btc_price' : ActorMethod<[], MarketData>,
  'get_loan' : ActorMethod<[bigint], [] | [Loan]>,
  'get_user_loans' : ActorMethod<[Principal], Array<Loan>>,
  'get_user_profile' : ActorMethod<[Principal], [] | [UserProfile]>,
  'repay_loan' : ActorMethod<[bigint], Result_2>,
  'request_loan' : ActorMethod<[LoanRequest], Result>,
  'update_btc_price' : ActorMethod<[number], Result_2>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
