import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Principal } from '@dfinity/principal';
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  Bitcoin, 
  Plus,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

interface Loan {
  id: bigint;
  borrower: Principal;
  collateral_amount: bigint;
  loan_amount: bigint;
  interest_rate: number;
  created_at: bigint;
  due_date: bigint;
  status: { Active: null } | { Repaid: null } | { Liquidated: null } | { Defaulted: null };
  ltv_ratio: number;
}

interface UserProfile {
  user_principal: Principal;
  total_collateral: bigint;
  active_loans: bigint[];
  credit_score: number;
  created_at: bigint;
}

interface DashboardProps {
  actor: any;
  principal: Principal | null;
  isAuthenticated: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ actor, principal, isAuthenticated }) => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [btcPrice, setBtcPrice] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isAuthenticated && actor && principal) {
      loadUserData();
      loadBtcPrice();
    }
  }, [isAuthenticated, actor, principal]);

  const loadUserData = async () => {
    if (!actor || !principal) return;
    
    setLoading(true);
    setError('');
    try {
      // Load user profile
      const userProfile = await actor.get_user_profile(principal);
      if (userProfile.length > 0) {
        setProfile(userProfile[0]);
      }

      // Load user loans
      const userLoans = await actor.get_user_loans(principal);
      setLoans(userLoans);
    } catch (error: any) {
      console.error('Error loading user data:', error);
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const loadBtcPrice = async () => {
    if (!actor) return;
    
    try {
      const marketData = await actor.get_btc_price();
      setBtcPrice(marketData.btc_price_usd);
    } catch (error) {
      console.error('Error loading BTC price:', error);
    }
  };

  const createProfile = async () => {
    if (!actor) return;
    
    setLoading(true);
    try {
      const result = await actor.create_user_profile();
      if ('Ok' in result) {
        await loadUserData();
      } else {
        setError(result.Err || 'Failed to create profile');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    loadUserData();
    loadBtcPrice();
  };

  const formatCurrency = (amount: bigint | number) => {
    const value = typeof amount === 'bigint' ? Number(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value / 100);
  };

  const formatBtc = (satoshis: bigint) => {
    return (Number(satoshis) / 100_000_000).toFixed(8) + ' BTC';
  };

  const getStatusColor = (status: Loan['status']) => {
    if ('Active' in status) return 'bg-green-100 text-green-800 border-green-200';
    if ('Repaid' in status) return 'bg-blue-100 text-blue-800 border-blue-200';
    if ('Liquidated' in status) return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusText = (status: Loan['status']) => {
    if ('Active' in status) return 'Active';
    if ('Repaid' in status) return 'Repaid';
    if ('Liquidated' in status) return 'Liquidated';
    if ('Defaulted' in status) return 'Defaulted';
    return 'Unknown';
  };

  const formatDate = (nanoseconds: bigint) => {
    const milliseconds = Number(nanoseconds) / 1_000_000;
    return new Date(milliseconds).toLocaleDateString();
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-16">
        <Bitcoin size={80} className="mx-auto text-blue-600 mb-6" />
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          Welcome to BBL DeFi
        </h2>
        <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
          Take out loans against your Bitcoin holdings with secure, fast transactions on the Internet Computer
        </p>
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-lg mx-auto">
          <h3 className="text-xl font-semibold mb-4">Get Started</h3>
          <p className="text-gray-600 mb-6">
            Connect your Internet Identity to start borrowing against your Bitcoin
          </p>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Features:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 70% max loan-to-value ratio</li>
              <li>• 8% annual interest rate</li>
              <li>• Flexible loan durations</li>
              <li>• Secure Bitcoin collateral</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (!profile && !loading) {
    return (
      <div className="text-center py-16">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md mx-auto">
          <div className="text-blue-600 mb-4">
            <User size={64} className="mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Create Your Profile</h2>
          <p className="text-gray-600 mb-8">
            Create a user profile to start taking out Bitcoin-backed loans
          </p>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
          <button
            onClick={createProfile}
            disabled={loading}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Plus size={20} />
                <span>Create Profile</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your Bitcoin-backed loans</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={refreshData}
            className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
            title="Refresh data"
          >
            <RefreshCw size={20} />
          </button>
          <Link
            to="/loan/new"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 shadow-md hover:shadow-lg transform hover:scale-105 transition-transform"
          >
            <Plus size={20} />
            <span>New Loan</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="text-red-600" size={20} />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">BTC Price</p>
              <p className="text-2xl font-bold text-gray-800">
                ${btcPrice.toLocaleString()}
              </p>
              <p className="text-xs text-green-600 mt-1">Live price</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <TrendingUp className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Collateral</p>
              <p className="text-2xl font-bold text-gray-800">
                {profile ? formatBtc(profile.total_collateral) : '0 BTC'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                ≈ ${profile ? ((Number(profile.total_collateral) / 100_000_000) * btcPrice).toLocaleString() : '0'}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <Bitcoin className="text-orange-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Active Loans</p>
              <p className="text-2xl font-bold text-gray-800">
                {profile?.active_loans.length || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Outstanding</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Clock className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Credit Score</p>
              <p className="text-2xl font-bold text-gray-800">
                {profile?.credit_score || 'N/A'}
              </p>
              <p className="text-xs text-yellow-600 mt-1">Good</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <AlertTriangle className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Loans Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">Your Loans</h2>
            <a
              href="http://127.0.0.1:8000/_/candid"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              <span>View API</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading loans...</p>
          </div>
        ) : loans.length === 0 ? (
          <div className="p-8 text-center">
            <Bitcoin size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">No loans found</p>
            <Link
              to="/loan/new"
              className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800"
            >
              <Plus size={16} />
              <span>Create your first loan</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Loan ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Collateral
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Loan Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    LTV Ratio
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loans.map((loan) => (
                  <tr key={loan.id.toString()} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-mono text-gray-900">
                      #{loan.id.toString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div>
                        <div className="font-semibold">{formatBtc(loan.collateral_amount)}</div>
                        <div className="text-xs text-gray-500">
                          ≈ ${((Number(loan.collateral_amount) / 100_000_000) * btcPrice).toLocaleString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {formatCurrency(loan.loan_amount)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className={`font-semibold ${loan.ltv_ratio > 0.6 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {(loan.ltv_ratio * 100).toFixed(1)}%
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatDate(loan.due_date)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(loan.status)}`}>
                        {getStatusText(loan.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Link
                        to={`/loan/${loan.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                      >
                        View Details →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;