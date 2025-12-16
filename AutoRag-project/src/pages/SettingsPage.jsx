import { useState } from 'react'
import toast from 'react-hot-toast'
import { 
  CpuChipIcon, 
  CloudIcon, 
  AdjustmentsHorizontalIcon,
  DocumentMagnifyingGlassIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('model')
  const [settings, setSettings] = useState({
    // Model Settings
    model: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 2048,
    
    // Retrieval Settings
    topK: 5,
    similarityThreshold: 0.7,
    chunkSize: 512,
    chunkOverlap: 50,
    
    // AutoRAG Settings
    trustThreshold: 0.8,
    enableSelfHealing: true,
    externalSearchEnabled: true,
    searchProvider: 'duckduckgo',
    
    // Performance Settings
    batchSize: 32,
    maxConcurrentRequests: 10,
    cacheEnabled: true,
    
    // Security Settings
    dataRetention: 30,
    encryptionEnabled: true,
    auditLogging: true
  })

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    toast.success('Settings saved (demo)')
  }

  const handleReset = () => {
    toast.success('Settings reset to defaults (demo)')
  }

  const tabs = [
    { id: 'model', name: 'Model', icon: CpuChipIcon },
    { id: 'retrieval', name: 'Retrieval', icon: DocumentMagnifyingGlassIcon },
    { id: 'autorag', name: 'AutoRAG', icon: AdjustmentsHorizontalIcon },
    { id: 'performance', name: 'Performance', icon: CloudIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon }
  ]

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure AutoRAG parameters and system preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }
                flex items-center whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium
              `}
            >
              <tab.icon className="mr-2 h-5 w-5" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Model Settings */}
      {activeTab === 'model' && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Language Model Configuration</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Model
              </label>
              <select
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                value={settings.model}
                onChange={(e) => handleSettingChange('model', e.target.value)}
              >
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                <option value="local-llm">Local LLM</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temperature: {settings.temperature}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                className="w-full"
                value={settings.temperature}
                onChange={(e) => handleSettingChange('temperature', parseFloat(e.target.value))}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Focused</span>
                <span>Creative</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Tokens
              </label>
              <input
                type="number"
                min="100"
                max="8192"
                step="100"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                value={settings.maxTokens}
                onChange={(e) => handleSettingChange('maxTokens', parseInt(e.target.value))}
              />
            </div>
          </div>
        </div>
      )}

      {/* Retrieval Settings */}
      {activeTab === 'retrieval' && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Retrieval Configuration</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Top K Results
              </label>
              <input
                type="number"
                min="1"
                max="50"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                value={settings.topK}
                onChange={(e) => handleSettingChange('topK', parseInt(e.target.value))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Similarity Threshold: {settings.similarityThreshold}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                className="w-full"
                value={settings.similarityThreshold}
                onChange={(e) => handleSettingChange('similarityThreshold', parseFloat(e.target.value))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chunk Size (tokens)
              </label>
              <select
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                value={settings.chunkSize}
                onChange={(e) => handleSettingChange('chunkSize', parseInt(e.target.value))}
              >
                <option value="256">256</option>
                <option value="512">512</option>
                <option value="1024">1024</option>
                <option value="2048">2048</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chunk Overlap (tokens)
              </label>
              <input
                type="number"
                min="0"
                max="200"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                value={settings.chunkOverlap}
                onChange={(e) => handleSettingChange('chunkOverlap', parseInt(e.target.value))}
              />
            </div>
          </div>
        </div>
      )}

      {/* AutoRAG Settings */}
      {activeTab === 'autorag' && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">AutoRAG Configuration</h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trust Threshold: {settings.trustThreshold}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                className="w-full"
                value={settings.trustThreshold}
                onChange={(e) => handleSettingChange('trustThreshold', parseFloat(e.target.value))}
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum confidence score to accept an answer without self-healing
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900">Enable Self-Healing</div>
                <div className="text-sm text-gray-500">
                  Automatically improve knowledge base when low-trust answers are detected
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleSettingChange('enableSelfHealing', !settings.enableSelfHealing)}
                className={`
                  ${settings.enableSelfHealing ? 'bg-blue-600' : 'bg-gray-200'}
                  relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                `}
              >
                <span
                  className={`
                    ${settings.enableSelfHealing ? 'translate-x-5' : 'translate-x-0'}
                    pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                  `}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900">External Search</div>
                <div className="text-sm text-gray-500">
                  Enable external web search for knowledge acquisition
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleSettingChange('externalSearchEnabled', !settings.externalSearchEnabled)}
                className={`
                  ${settings.externalSearchEnabled ? 'bg-blue-600' : 'bg-gray-200'}
                  relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                `}
              >
                <span
                  className={`
                    ${settings.externalSearchEnabled ? 'translate-x-5' : 'translate-x-0'}
                    pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                  `}
                />
              </button>
            </div>

            {settings.externalSearchEnabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Provider
                </label>
                <select
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                  value={settings.searchProvider}
                  onChange={(e) => handleSettingChange('searchProvider', e.target.value)}
                >
                  <option value="duckduckgo">DuckDuckGo</option>
                  <option value="google">Google Search</option>
                  <option value="bing">Bing Search</option>
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Performance Settings */}
      {activeTab === 'performance' && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Configuration</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Batch Size
              </label>
              <input
                type="number"
                min="1"
                max="128"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                value={settings.batchSize}
                onChange={(e) => handleSettingChange('batchSize', parseInt(e.target.value))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Concurrent Requests
              </label>
              <input
                type="number"
                min="1"
                max="50"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                value={settings.maxConcurrentRequests}
                onChange={(e) => handleSettingChange('maxConcurrentRequests', parseInt(e.target.value))}
              />
            </div>

            <div className="sm:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">Enable Caching</div>
                  <div className="text-sm text-gray-500">
                    Cache embeddings and responses to improve performance
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleSettingChange('cacheEnabled', !settings.cacheEnabled)}
                  className={`
                    ${settings.cacheEnabled ? 'bg-blue-600' : 'bg-gray-200'}
                    relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  `}
                >
                  <span
                    className={`
                      ${settings.cacheEnabled ? 'translate-x-5' : 'translate-x-0'}
                      pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                    `}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Settings */}
      {activeTab === 'security' && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Security Configuration</h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Retention (days)
              </label>
              <select
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                value={settings.dataRetention}
                onChange={(e) => handleSettingChange('dataRetention', parseInt(e.target.value))}
              >
                <option value="7">7 days</option>
                <option value="30">30 days</option>
                <option value="90">90 days</option>
                <option value="365">1 year</option>
                <option value="-1">Indefinite</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900">Encryption at Rest</div>
                <div className="text-sm text-gray-500">
                  Encrypt stored documents and embeddings
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleSettingChange('encryptionEnabled', !settings.encryptionEnabled)}
                className={`
                  ${settings.encryptionEnabled ? 'bg-blue-600' : 'bg-gray-200'}
                  relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                `}
              >
                <span
                  className={`
                    ${settings.encryptionEnabled ? 'translate-x-5' : 'translate-x-0'}
                    pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                  `}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900">Audit Logging</div>
                <div className="text-sm text-gray-500">
                  Log all system activities for security monitoring
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleSettingChange('auditLogging', !settings.auditLogging)}
                className={`
                  ${settings.auditLogging ? 'bg-blue-600' : 'bg-gray-200'}
                  relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                `}
              >
                <span
                  className={`
                    ${settings.auditLogging ? 'translate-x-5' : 'translate-x-0'}
                    pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                  `}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={handleReset}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Reset to Defaults
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Save All Settings
        </button>
      </div>
    </div>
  )
}
