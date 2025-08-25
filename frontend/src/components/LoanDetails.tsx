import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle, 
  DollarSign, 
  Calendar, 
  Percent,
  Bitcoin,
  Clock,
  TrendingUp
} from 'lucide-react';

interface Loan {
  id: bigint;
  borrower: any;
  collateral_amount: bigint;
  loan_amount: bigint;
  interest_rate: number;
  created_at: bigint;
  due_date: bigint;
  status: { Active: null } | { Repaid: null } | { Liquidated: null } | { Defaulted: null };
  ltv_ratio: number;
}

interface LoanDetailsProps {
  actor: any;
  isAuthenticated: boolean;
}

const LoanDetails: React.FC<LoanDetailsProps> = ({ actor, isAuthenticated }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loan, setLoan] = useState<Loan | null>(null);
  const [btcPrice, setBtcPrice] = useState<number>(45000);
  const [loading, setLoading] = useState(true);
  const [repaying, setRepaying] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (id && actor) {
      loadLoan();
      loadBtcPrice();
    }
  }, [id, actor]);

  const loadLoan = async () => {
    if (!id || !actor) return;

    try {
      const loanData = await actor.get_loan(BigInt(id));
      if (loanData.length > 0) {
        setLoan(loanData[0]);
      } else {
        setError('Loan not found');
      }
    } catch (error) {
      console.error('Error loading loan:', error);
      setError('Failed to load loan details');
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

  const repayLoan = async () => {
    if (!loan || !actor) return;

    setRepaying(true);
    setError('');

    try {
      const result = await actor.repay_loan(loan.id);
      if ('Ok' in result) {
        await loadLoan(); // Refresh loan data
        alert('Loan repaid successfully! 🎉');
      } else {
        setError(result.Err || 'Failed to repay loan');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to repay loan');
    } finally {
      setRepaying(false);
    }
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

  const formatDate = (nanoseconds: bigint) => {
    const milliseconds = Number(nanoseconds) / 1_000_000;
    return new Date(milliseconds).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateTimeRemaining = (dueDate: bigint) => {
    const dueDateMs = Number(dueDate) / 1_000_000;
    const now = Date.now();
    const diff = dueDateMs - now;
    
    if (diff <= 0) return 'Overdue';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} days, ${hours} hours`;
    return `${hours} hours`;
  };

  const calculateTotalDue = (loan: Loan) => {
    if ('Repaid' in loan.status) return loan.loan_amount;
    
    const timeElapsed = (Date.now() * 1_000_000 - Number(loan.created_at)) / (365.25 * 24 * 60 * 60 * 1_000_000_000);
    const interest = Number(loan.loan_amount) * loan.interest_rate * timeElapsed;
    return BigInt(Math.floor(Number(loan.loan_amount) + interest));
  };

  const getStatusColor = (status: Loan['status']) => {
    if ('Active' in status) return 'text-green-600 bg-green-100 border-green-200';
    if ('Repaid' in status) return 'text-blue-600 bg-blue-100 border-blue-200';
    if ('Liquidated' in status) return 'text-red-600 bg-red-100 border-red-200';
    return 'text-gray-600 bg-gray-100 border-gray-200';
  };

  const getStatusText = (status: Loan['status']) => {
    if ('Active' in status) return 'Active';
    if ('Repaid' in status) return 'Repaid';
    if ('Liquidated' in status) return 'Liquidated';
    if ('Defaulted' in status) return 'Defaulted';
    return 'Unknown';
  };

  const getStatusIcon = (status: Loan['status']) => {
    if ('Active' in status) return <Clock className="text-green-600" size={20} />;
    if ('Repaid' in status) return <CheckCircle className="text-blue-600" size={20} />;
    return <AlertCircle className="text-red-600" size={20} />;
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <AlertCircle className="mx-auto text-yellow-600 mb-6" size={64} />
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please connect your wallet to view loan details.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading loan details...</p>
        </div>
      </div>
    );
  }

  if (error && !loan) {
    return (
      <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <AlertCircle className="mx-auto text-red-600 mb-6" size={64} />
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <AlertCircle className="mx-auto text-gray-600 mb-6" size={64} />
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Loan Not Found</h2>
          <p className="text-gray-600 mb-6">The requested loan could not be found.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const totalDue = calculateTotalDue(loan);
  const currentCollateralValue = (Number(loan.collateral_amount) / 100_000_000) * btcPrice;
  const currentLTV = (Number(loan.loan_amount) / 100) / currentCollateralValue * 100;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Dashboard</span>
          </button>
          <div className="h-6 border-l border-gray-300"></div>
          <h1 className="text-3xl font-bold text-gray-800">
            Loan #{loan.id.toString()}
          </h1>
        </div>
        <div className="flex items-center space-x-3">
          {getStatusIcon(loan.status)}
          <span className={`px-4 py-2 rounded-full border font-semibold ${getStatusColor(loan.status)}`}>
            {getStatusText(loan.status)}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="text-red-600" size={20} />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Loan Overview */}
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Loan Overview</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b">
                  <div className="flex items-center space-x-2">
                    <DollarSign size={18} className="text-green-600" />
                    <span className="text-gray-600 font-medium">Loan Amount</span>
                  </div>
                  <span className="font-bold text-lg">{formatCurrency(loan.loan_amount)}</span>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b">
                  <div className="flex items-center space-x-2">
                    <Percent size={18} className="text-blue-600" />
                    <span className="text-gray-600 font-medium">Interest Rate</span>
                  </div>
                  <span className="font-bold text-lg">{(loan.interest_rate * 100).toFixed(1)}% APR</span>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b">
                  <div className="flex items-center space-x-2">
                    <Calendar size={18} className="text-blue-600" />
                    <span className="text-gray-600 font-medium">Created</span>
                  </div>
                  <span className="font-semibold">{formatDate(loan.created_at)}</span>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b">
                  <div className="flex items-center space-x-2">
                    <Calendar size={18} className="text-red-600" />
                    <span className="text-gray-600 font-medium">Due Date</span>
                  </div>
                  <span className="font-semibold">{formatDate(loan.due_date)}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b">
                  <div className="flex items-center space-x-2">
                    <Bitcoin size={18} className="text-orange-600" />
                    <span className="text-gray-600 font-medium">Collateral</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">{formatBtc(loan.collateral_amount)}</div>
                    <div className="text-sm text-gray-500">≈ ${currentCollateralValue.toLocaleString()}</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b">
                  <div className="flex items-center space-x-2">
                    <TrendingUp size={18} className="text-purple-600" />
                    <span className="text-gray-600 font-medium">Current LTV</span>
                  </div>
                  <span className={`font-bold text-lg ${currentLTV > 70 ? 'text-red-600' : currentLTV > 60 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {currentLTV.toFixed(1)}%
                  </span>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b">
                  <div className="flex items-center space-x-2">
                    <Clock size={18} className="text-gray-600" />
                    <span className="text-gray-600 font-medium">Time Remaining</span>
                  </div>
                  <span className="font-semibold">
                    {'Active' in loan.status ? calculateTimeRemaining(loan.due_date) : 'N/A'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between py-3">
                  <span className="text-gray-600 font-medium">Total Due</span>
                  <span className="font-bold text-xl text-green-600">{formatCurrency(totalDue)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* LTV Progress */}
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Collateral Health</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Current LTV Ratio</span>
                <span>{currentLTV.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className={`h-4 rounded-full transition-all duration-300 ${
                    currentLTV > 70 ? 'bg-red-500' : 
                    currentLTV > 60 ? 'bg-yellow-500' : 
                    'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(currentLTV, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span className="text-yellow-600">60%</span>
                <span className="text-red-600">70% Max</span>
                <span>100%</span>
              </div>
              
              {currentLTV > 70 && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle size={18} className="text-red-600" />
                    <p className="text-red-700 font-medium">
                      ⚠️ High Risk: LTV ratio exceeds safe threshold
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Market Data */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Market Data</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">BTC Price:</span>
                <span className="font-semibold">${btcPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Collateral Value:</span>
                <span className="font-semibold">${currentCollateralValue.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          {'Active' in loan.status && (
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Actions</h3>
              
              <button
                onClick={repayLoan}
                disabled={repaying}
                className="w-full py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-transform"
              >
                {repaying ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Repaying Loan...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    <span>Repay Loan ({formatCurrency(totalDue)})</span>
                  </>
                )}
              </button>
              
              <p className="text-xs text-gray-500 mt-3 text-center">
                Repay your loan to unlock your Bitcoin collateral
              </p>
            </div>
          )}

          {/* Loan History */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Loan Timeline</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium">Loan Created</p>
                  <p className="text-xs text-gray-500">{formatDate(loan.created_at)}</p>
                </div>
              </div>
              
              {'Active' in loan.status && (
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                  <div>
                    <p className="text-sm font-medium text-green-600">Currently Active</p>
                    <p className="text-xs text-gray-500">Due {formatDate(loan.due_date)}</p>
                  </div>
                </div>
              )}
              
              {'Repaid' in loan.status && (
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Loan Repaid</p>
                    <p className="text-xs text-gray-500">Collateral Released</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanDetails;