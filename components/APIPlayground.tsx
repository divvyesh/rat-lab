import React, { useState } from 'react';
import { Code, Play, Copy, Check, Sparkles } from 'lucide-react';
import { createUserFriendlyError, logError } from '../utils/errorHandling';
import ErrorDisplay from './ErrorDisplay';

interface APIPlaygroundProps {
  user?: { id: string; email?: string };
}

const APIPlayground: React.FC<APIPlaygroundProps> = ({ user }) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('create-persona');
  const [requestBody, setRequestBody] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const endpoints = [
    {
      id: 'create-persona',
      name: 'Create Persona',
      method: 'POST',
      path: '/api/personas',
      description: 'Create a new AI persona',
      exampleBody: JSON.stringify({
        segmentId: 'seg-123',
        name: 'Sarah Chen',
        age: 32,
        occupation: 'Product Manager',
        location: 'San Francisco, CA',
        traits: {
          riskAversion: 65,
          lossAversion: 70,
          priceSensitivity: 45,
          cognitiveReflection: 75,
          socialConformity: 50,
          noveltySeeking: 60
        }
      }, null, 2)
    },
    {
      id: 'list-personas',
      name: 'List Personas',
      method: 'GET',
      path: '/api/personas?segmentId=seg-123',
      description: 'Get all personas in a segment',
      exampleBody: ''
    },
    {
      id: 'run-simulation',
      name: 'Run Simulation',
      method: 'POST',
      path: '/api/simulations',
      description: 'Run a survey simulation',
      exampleBody: JSON.stringify({
        personaIds: ['persona-1', 'persona-2'],
        questions: [
          {
            id: 'q1',
            type: 'SHORT_ANSWER',
            text: 'What do you think about this product?'
          }
        ],
        context: 'Product launch test',
        assets: []
      }, null, 2)
    },
    {
      id: 'generate-analysis',
      name: 'Generate Analysis',
      method: 'POST',
      path: '/api/analysis',
      description: 'Generate statistical analysis report',
      exampleBody: JSON.stringify({
        resultIds: ['result-1', 'result-2'],
        segments: ['seg-123']
      }, null, 2)
    }
  ];

  const selectedEndpointData = endpoints.find(e => e.id === selectedEndpoint);

  const handleRun = async () => {
    if (!selectedEndpointData) return;

    setLoading(true);
    setError(null);
    setResponse('');

    try {
      // Simulate API call (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockResponse = {
        success: true,
        data: {
          id: 'generated-id',
          message: 'Request processed successfully',
          timestamp: new Date().toISOString()
        }
      };

      setResponse(JSON.stringify(mockResponse, null, 2));
    } catch (err: any) {
      const e = err instanceof Error ? err : new Error(String(err));
      const friendly = createUserFriendlyError(e, { component: 'APIPlayground', action: 'run_request' });
      setError(friendly.message);
      setResponse(JSON.stringify({ error: friendly.message }, null, 2));
      logError(e, { component: 'APIPlayground', action: 'run_request' });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLoadExample = () => {
    if (selectedEndpointData?.exampleBody) {
      setRequestBody(selectedEndpointData.exampleBody);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Code className="text-indigo-400" size={24} />
          <h2 className="text-2xl font-bold text-white">API Playground</h2>
        </div>
        <p className="text-zinc-400 text-sm">
          Test Rat Lab's API endpoints directly in your browser. Get your API key from settings.
        </p>
      </div>

      {/* API Key Display */}
      {user && (
        <div className="p-4 bg-zinc-900/50 border border-white/5 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-zinc-500 uppercase mb-1">API Key</div>
              <div className="text-sm text-zinc-300 font-mono">
                {user.id.substring(0, 20)}...
              </div>
            </div>
            <button
              onClick={() => handleCopy(user.id)}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      {/* Endpoint Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {endpoints.map(endpoint => (
          <button
            key={endpoint.id}
            onClick={() => {
              setSelectedEndpoint(endpoint.id);
              setRequestBody(endpoint.exampleBody || '');
              setResponse('');
              setError(null);
            }}
            className={`p-4 bg-zinc-900/50 border rounded-xl text-left transition-all ${
              selectedEndpoint === endpoint.id
                ? 'border-indigo-500 bg-indigo-500/10'
                : 'border-white/5 hover:border-white/10'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                endpoint.method === 'GET'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {endpoint.method}
              </span>
            </div>
            <div className="text-sm font-bold text-white mb-1">{endpoint.name}</div>
            <div className="text-xs text-zinc-500">{endpoint.description}</div>
          </button>
        ))}
      </div>

      {/* Request Builder */}
      {selectedEndpointData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Request */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Request</h3>
              {selectedEndpointData.exampleBody && (
                <button
                  onClick={handleLoadExample}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2"
                >
                  <Sparkles size={12} /> Load Example
                </button>
              )}
            </div>
            <div className="bg-zinc-950 border border-white/5 rounded-xl overflow-hidden">
              <div className="px-4 py-2 bg-zinc-900 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    selectedEndpointData.method === 'GET'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {selectedEndpointData.method}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">
                    {selectedEndpointData.path}
                  </span>
                </div>
              </div>
              {selectedEndpointData.method === 'POST' && (
                <textarea
                  value={requestBody}
                  onChange={e => setRequestBody(e.target.value)}
                  placeholder="Enter JSON request body..."
                  className="w-full h-64 p-4 bg-zinc-950 text-white font-mono text-sm focus:outline-none resize-none"
                />
              )}
              {selectedEndpointData.method === 'GET' && (
                <div className="p-4 text-sm text-zinc-500">
                  GET requests don't require a request body. Parameters are included in the URL.
                </div>
              )}
            </div>
            <button
              onClick={handleRun}
              disabled={loading || (selectedEndpointData.method === 'POST' && !requestBody)}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play size={16} /> Run Request
                </>
              )}
            </button>
          </div>

          {/* Response */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Response</h3>
              {response && (
                <button
                  onClick={() => handleCopy(response)}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  Copy
                </button>
              )}
            </div>
            <div className="bg-zinc-950 border border-white/5 rounded-xl overflow-hidden min-h-[300px]">
              {error && (
                <ErrorDisplay
                  message={error}
                  variant="compact"
                  dismissible
                  onDismiss={() => setError(null)}
                  onRetry={handleRun}
                />
              )}
              {response ? (
                <pre className="p-4 text-white font-mono text-sm overflow-auto">
                  {response}
                </pre>
              ) : (
                <div className="p-8 text-center text-zinc-500">
                  <Code size={32} className="mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Response will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Documentation Link */}
      <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
        <p className="text-sm text-indigo-300">
          <strong>Need help?</strong> Check out our{' '}
          <a href="/docs/API" className="underline hover:text-indigo-200">
            complete API documentation
          </a>{' '}
          for detailed endpoint specifications, authentication, and examples.
        </p>
      </div>
    </div>
  );
};

export default APIPlayground;



