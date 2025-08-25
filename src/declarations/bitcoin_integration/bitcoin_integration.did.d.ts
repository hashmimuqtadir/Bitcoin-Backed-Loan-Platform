import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface BitcoinAddress { 'network' : string, 'address' : string }
export interface BitcoinBalance {
  'balance_satoshis' : bigint,
  'address' : string,
}
export type Result = { 'Ok' : boolean } |
  { 'Err' : string };
export interface _SERVICE {
  'get_bitcoin_address' : ActorMethod<[], BitcoinAddress>,
  'get_bitcoin_balance' : ActorMethod<[string], BitcoinBalance>,
  'verify_bitcoin_transaction' : ActorMethod<[string], Result>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
