export const idlFactory = ({ IDL }) => {
  const UserProfile = IDL.Record({
    'user_principal' : IDL.Principal,
    'total_collateral' : IDL.Nat64,
    'created_at' : IDL.Nat64,
    'active_loans' : IDL.Vec(IDL.Nat64),
    'credit_score' : IDL.Nat32,
  });
  const Result_1 = IDL.Variant({ 'Ok' : UserProfile, 'Err' : IDL.Text });
  const MarketData = IDL.Record({
    'last_updated' : IDL.Nat64,
    'btc_price_usd' : IDL.Float64,
  });
  const LoanStatus = IDL.Variant({
    'Repaid' : IDL.Null,
    'Active' : IDL.Null,
    'Defaulted' : IDL.Null,
    'Liquidated' : IDL.Null,
  });
  const Loan = IDL.Record({
    'id' : IDL.Nat64,
    'collateral_amount' : IDL.Nat64,
    'status' : LoanStatus,
    'created_at' : IDL.Nat64,
    'borrower' : IDL.Principal,
    'loan_amount' : IDL.Nat64,
    'interest_rate' : IDL.Float64,
    'due_date' : IDL.Nat64,
    'ltv_ratio' : IDL.Float64,
  });
  const Result_2 = IDL.Variant({ 'Ok' : IDL.Text, 'Err' : IDL.Text });
  const LoanRequest = IDL.Record({
    'collateral_amount' : IDL.Nat64,
    'requested_amount' : IDL.Nat64,
    'loan_duration_days' : IDL.Nat32,
  });
  const Result = IDL.Variant({ 'Ok' : Loan, 'Err' : IDL.Text });
  return IDL.Service({
    'calculate_max_loan' : IDL.Func([IDL.Nat64], [IDL.Nat64], ['query']),
    'create_user_profile' : IDL.Func([], [Result_1], []),
    'get_btc_price' : IDL.Func([], [MarketData], ['query']),
    'get_loan' : IDL.Func([IDL.Nat64], [IDL.Opt(Loan)], ['query']),
    'get_user_loans' : IDL.Func([IDL.Principal], [IDL.Vec(Loan)], ['query']),
    'get_user_profile' : IDL.Func(
        [IDL.Principal],
        [IDL.Opt(UserProfile)],
        ['query'],
      ),
    'repay_loan' : IDL.Func([IDL.Nat64], [Result_2], []),
    'request_loan' : IDL.Func([LoanRequest], [Result], []),
    'update_btc_price' : IDL.Func([IDL.Float64], [Result_2], []),
  });
};
export const init = ({ IDL }) => { return []; };
