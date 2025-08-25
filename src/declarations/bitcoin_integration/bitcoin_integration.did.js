export const idlFactory = ({ IDL }) => {
  const BitcoinAddress = IDL.Record({
    'network' : IDL.Text,
    'address' : IDL.Text,
  });
  const BitcoinBalance = IDL.Record({
    'balance_satoshis' : IDL.Nat64,
    'address' : IDL.Text,
  });
  const Result = IDL.Variant({ 'Ok' : IDL.Bool, 'Err' : IDL.Text });
  return IDL.Service({
    'get_bitcoin_address' : IDL.Func([], [BitcoinAddress], ['query']),
    'get_bitcoin_balance' : IDL.Func([IDL.Text], [BitcoinBalance], ['query']),
    'verify_bitcoin_transaction' : IDL.Func([IDL.Text], [Result], []),
  });
};
export const init = ({ IDL }) => { return []; };
