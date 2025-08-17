import { useState, useEffect } from 'react';
import { apiService, NewsAnalysis } from '../services/api';
import { Search, TrendingUp, TrendingDown, Calendar, ExternalLink } from 'lucide-react';

export default function NewsSentiment() {
  const [searchSymbol, setSearchSymbol] = useState('');
  const [newsAnalysis, setNewsAnalysis] = useState<NewsAnalysis[]>([]);
  const [marketSentiment, setMarketSentiment] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!searchSymbol.trim()) return;

    setLoading(true);
    setError('');

    try {
      const analysis = await apiService.getNewsSentiment(searchSymbol.toUpperCase());
      setNewsAnalysis(analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch news sentiment');
    } finally {
      setLoading(false);
    }
  };

  const loadMarketSentiment = async () => {
    try {
      const symbols = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK'];
      const sentiment = await apiService.getMarketSentiment(symbols);
      setMarketSentiment(sentiment);
    } catch (err) {
      console.error('Failed to load market sentiment:', err);
    }
  };

  useEffect(() => {
    loadMarketSentiment();
  }, []);

  const getSentimentColor = (score: number) => {
    if (score > 0.1) return 'text-green-600';
    if (score < -0.1) return 'text-red-600';
    return 'text-gray-600';
  };

  const getSentimentIcon = (score: number) => {
    if (score > 0.1) return <TrendingUp className="h-4 w-4" />;
    if (score < -0.1) return <TrendingDown className="h-4 w-4" />;
    return <div className="h-4 w-4 bg-gray-400 rounded-full" />;
  };

  const formatSentimentScore = (score: number) => {
    return (score * 100).toFixed(1) + '%';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Market Sentiment Overview */}
      {marketSentiment && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Market Sentiment Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-500">Overall Sentiment</div>
              <div className={`text-2xl font-bold ${getSentimentColor(marketSentiment.overall_sentiment)}`}>
                {formatSentimentScore(marketSentiment.overall_sentiment)}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-500">Confidence</div>
              <div className="text-2xl font-bold text-blue-600">
                {(marketSentiment.confidence * 100).toFixed(1)}%
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-500">Positive Articles</div>
              <div className="text-2xl font-bold text-green-600">
                {marketSentiment.positive_articles}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-500">Negative Articles</div>
              <div className="text-2xl font-bold text-red-600">
                {marketSentiment.negative_articles}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Stock News Sentiment Analysis</h2>
        
        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        <div className="flex space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Enter stock symbol (e.g., RELIANCE, TCS)"
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={searchSymbol}
              onChange={(e) => setSearchSymbol(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !searchSymbol.trim()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <Search className="h-4 w-4 mr-2" />
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
      </div>

      {/* News Analysis Results */}
      {newsAnalysis.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              News Analysis for {searchSymbol.toUpperCase()}
            </h3>
            <p className="text-sm text-gray-500">
              Recent news articles and their sentiment analysis
            </p>
          </div>
          
          <div className="divide-y divide-gray-200">
            {newsAnalysis.map((analysis) => (
              <div key={analysis.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      {analysis.headline}
                    </h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(analysis.timestamp).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        {analysis.source}
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-4 flex items-center space-x-4">
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Sentiment</div>
                      <div className={`flex items-center ${getSentimentColor(analysis.sentiment_score)}`}>
                        {getSentimentIcon(analysis.sentiment_score)}
                        <span className="ml-1 font-medium">
                          {formatSentimentScore(analysis.sentiment_score)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Impact</div>
                      <div className="text-sm font-medium text-blue-600">
                        {(analysis.impact_score * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-2">How News Sentiment Analysis Works</h3>
        <div className="text-sm text-blue-700 space-y-2">
          <p>• <strong>Sentiment Score:</strong> Ranges from -100% (very negative) to +100% (very positive)</p>
          <p>• <strong>Impact Score:</strong> Measures the potential market impact based on sentiment strength and source credibility</p>
          <p>• <strong>Market Overview:</strong> Aggregated sentiment across major stocks to gauge overall market mood</p>
          <p>• <strong>Real-time Analysis:</strong> News is analyzed using advanced NLP algorithms to extract sentiment</p>
        </div>
      </div>
    </div>
  );
}
