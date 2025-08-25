import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, AlertCircle, Bitcoin, DollarSign, Calendar, Percent } from 'lucide-react';

interface LoanFormProps {
  actor: any;
  isAuthenticated: boolean;
}

const LoanForm: React.FC<LoanFormProps> = ({ actor, isAuthenticated }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    collateralAmount: '',
    loanAmount: '',
    durationDays: '30',
  });
  const [btcPrice, setBtcPrice] = useState<number>(0);
  const [maxLoan, setMaxLoan] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (actor) {
      loadBtcPrice();
    }
  }, [actor]);

  useEffect(() => {
    if (formData.collateralAmount && btcPrice > 0) {
      calculateMaxLoan();
    }
  }, [formData.collateralAmount, btcPrice]);

  const loadBtcPrice = async () => {
    try {
      const marketData = await actor.get_btc_price();
      setBtcPrice(marketData.btc_price_usd);
    } catch (error) {
      console.error('Error loading BTC price:', error);
    }
  };

  const calculateMaxLoan = async () => {
    if (!actor || !formData.collateralAmount) return;

    try {
      const collateralSatoshis = BigInt(Math.floor(parseFloat(formData.collateralAmount) * 100_000_000));
      const maxLoanCents = await actor.calculate_max_loan(collateralSatoshis);
      setMaxLoan(Number(maxLoanCents) / 100);
    } catch (error) {
      console.error('Error calculating max loan:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const loanRequest = {
        collateral_amount: BigInt(Math.floor(parseFloat(formData.collateralAmount) * 100_000_000)),
        requested_amount: BigInt(Math.floor(parseFloat(formData.loanAmount) * 100)),
        loan_duration_days: parseInt(formData.durationDays),
      };

      console.log('Submitting loan request:', loanRequest);
      const result = await actor.request_loan(loanRequest);
      
      if ('Ok' in result) {
        navigate(`/loan/${result.Ok.id}`);
      } else {
        setError(result.Err || 'Failed to create loan');
      }
    } catch (error: any) {
      console.error('Loan submission error:', error);
      setError(error.message || 'Failed to create loan');
    } finally {
      setLoading(false);
    }
  };

  const calculateLTV = () => {
    if (!formData.collateralAmount || !formData.loanAmount || btcPrice === 0) return 0;
    
    const collateralValue = parseFloat(formData.collateralAmount) * btcPrice;
    const loanValue = parseFloat(formData.loanAmount);
    
    return (loanValue / collateralValue) * 100;
  };

  const calculateInterest = () => {
    if (!formData.loanAmount || !formData.durationDays) return 0;
    
    const principal = parseFloat(formData.loanAmount);
    const days = parseInt(formData.durationDays);
    const annualRate = 0.08; // 8%
    
    return (principal * annualRate * days) / 365;
  };

  const ltv = calculateLTV();
  const estimatedInterest = calculateInterest();
  const isLTVTooHigh = ltv > 70;
  const isFormValid = formData.collateralAmount && formData.loanAmount && !isLTVTooHigh;

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <AlertCircle className="mx-auto text-yellow-600 mb-6" size={64} />
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please connect your wallet to create a loan.</p>
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

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Request New Loan</h1>
        <p className="text-gray-600">Borrow against your Bitcoin collateral</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <div className="bg-white p-8 rounded-xl shadow-lg">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="text-red-600" size={20} />
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Collateral Amount */}
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
                  <Bitcoin size={18} className="text-orange-600" />
                  <span>Bitcoin Collateral Amount</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.00000001"
                    min="0"
                    value={formData.collateralAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, collateralAmount: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                    placeholder="0.001"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                    <span className="text-gray-500 font-medium">BTC</span>
                  </div>
                </div>
                {formData.collateralAmount && btcPrice > 0 && (
                  <p className="text-sm text-gray-500 mt-2 flex items-center space-x-1">
                    <span>≈ ${(parseFloat(formData.collateralAmount) * btcPrice).toLocaleString()}</span>
                    <span className="text-green-600">USD</span>
                  </p>
                )}
              </div>

              {/* Loan Amount */}
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
                  <DollarSign size={18} className="text-green-600" />
                  <span>Requested Loan Amount</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={maxLoan}
                    value={formData.loanAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, loanAmount: e.target.value }))}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg ${
                      isLTVTooHigh ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="1000"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                    <span className="text-gray-500 font-medium">USD</span>
                  </div>
                </div>
                {maxLoan > 0 && (
                  <div className="mt-2 flex justify-between items-center text-sm">
                    <span className="text-gray-500">Maximum available: ${maxLoan.toLocaleString()}</span>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, loanAmount: maxLoan.toString() }))}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Use Max
                    </button>
                  </div>
                )}
              </div>

              {/* Duration */}
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
                  <Calendar size={18} className="text-blue-600" />
                  <span>Loan Duration</span>
                </label>
                <select
                  value={formData.durationDays}
                  onChange={(e) => setFormData(prev => ({ ...prev, durationDays: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                >
                  <option value="30">30 Days</option>
                  <option value="60">60 Days</option>
                  <option value="90">90 Days</option>
                  <option value="180">180 Days</option>
                  <option value="365">1 Year</option>
                </select>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !isFormValid}
                className="w-full py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold text-lg flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-transform"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    <span>Creating Loan...</span>
                  </>
                ) : (
                  <>
                    <DollarSign size={20} />
                    <span>Request Loan</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Loan Summary Sidebar */}
        <div className="space-y-6">
          {/* Market Info */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center space-x-2">
              <Bitcoin size={20} className="text-orange-600" />
              <span>Market Info</span>
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">BTC Price:</span>
                <span className="font-semibold">${btcPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Interest Rate:</span>
                <span className="font-semibold text-blue-600">8.0% APR</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Max LTV:</span>
                <span className="font-semibold text-green-600">70%</span>
              </div>
            </div>
          </div>

          {/* Loan Summary */}
          {formData.collateralAmount && formData.loanAmount && (
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center space-x-2 mb-4">
                <Calculator size={20} className="text-blue-600" />
                <h3 className="font-semibold text-gray-800">Loan Summary</h3>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Collateral Value:</span>
                  <span className="font-semibold">${(parseFloat(formData.collateralAmount) * btcPrice).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Loan Amount:</span>
                  <span className="font-semibold">${parseFloat(formData.loanAmount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">LTV Ratio:</span>
                  <span className={`font-semibold ${ltv > 70 ? 'text-red-600' : ltv > 60 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {ltv.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-semibold">{formData.durationDays} days</span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Est. Interest:</span>
                    <span className="font-semibold text-blue-600">
                      ${estimatedInterest.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg mt-2">
                    <span className="text-gray-800 font-semibold">Total to Repay:</span>
                    <span className="font-bold text-green-600">
                      ${(parseFloat(formData.loanAmount || '0') + estimatedInterest).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              
              {isLTVTooHigh && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle size={16} className="text-red-600" />
                    <p className="text-red-700 text-xs font-medium">
                      LTV ratio exceeds 70% maximum. Please reduce loan amount or increase collateral.
                    </p>
                  </div>
                </div>
              )}

              {ltv > 60 && ltv <= 70 && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle size={16} className="text-yellow-600" />
                    <p className="text-yellow-700 text-xs font-medium">
                      High LTV ratio. Consider reducing loan amount for better terms.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoanForm;