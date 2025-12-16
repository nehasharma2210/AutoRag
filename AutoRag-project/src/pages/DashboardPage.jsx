import { useState } from 'react'
import toast from 'react-hot-toast'
import QueryInterface from '../components/QueryInterface'

export default function DashboardPage() {
  const [uploadOpen, setUploadOpen] = useState(false)

  const capabilities = [
    'Detects low-trust answers automatically',
    'Launches external search + crawling',
    'Filters, embeds, and inserts new knowledge instantly',
    'Re-answers using enriched index',
    'Continuous reinforcement improves retrieval',
  ]

  const stats = [
    { 
      label: 'Documents', 
      value: '128', 
      change: '+12%',
      trend: 'up',
      icon: '📄',
      gradient: 'from-blue-500 to-cyan-500'
    },
    { 
      label: 'Collections', 
      value: '12', 
      change: '+3',
      trend: 'up',
      icon: '📚',
      gradient: 'from-purple-500 to-pink-500'
    },
    { 
      label: 'Queries Today', 
      value: '54', 
      change: '+18%',
      trend: 'up',
      icon: '🔍',
      gradient: 'from-green-500 to-emerald-500'
    },
    { 
      label: 'Avg. Latency', 
      value: '420ms', 
      change: '-15ms',
      trend: 'down',
      icon: '⚡',
      gradient: 'from-orange-500 to-red-500'
    }
  ]

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-6">
      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <div 
            key={stat.label} 
            className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            style={{
              animationDelay: `${index * 100}ms`,
              animation: 'fadeInUp 0.6s ease-out forwards'
            }}
          >
            {/* Gradient Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />
            
            {/* Icon */}
            <div className="flex items-center justify-between mb-4">
              <div className="text-2xl">{stat.icon}</div>
              <div className={`flex items-center text-xs font-medium ${
                stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                <span className="mr-1">
                  {stat.trend === 'up' ? '↗' : '↘'}
                </span>
                {stat.change}
              </div>
            </div>
            
            {/* Content */}
            <div className="relative">
              <div className="text-sm font-medium text-gray-600 mb-1">{stat.label}</div>
              <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
            </div>
            
            {/* Hover Effect */}
            <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 group-hover:w-full" />
          </div>
        ))}
      </div>

      {/* Enhanced Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8 text-white shadow-2xl">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-600/20 blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-600/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="relative grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 px-4 py-2 text-sm font-medium text-white/90 ring-1 ring-inset ring-white/20 backdrop-blur-sm">
              <span className="mr-2 h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              AutoRAG • Self-healing Retrieval-Augmented Generation
            </div>
            
            <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              A fully autonomous RAG engine that patches its knowledge base in 
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"> real-time</span>
            </h2>
            
            <p className="max-w-xl text-lg leading-7 text-white/80">
              AutoRAG detects low-trust answers, launches targeted search + crawling, upserts verified context into the
              vector DB, and re-answers with a stronger, more confident response.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <button
                type="button"
                className="group inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
                onClick={() => setUploadOpen(true)}
              >
                <span className="mr-2">🚀</span>
                Upload Knowledge
                <div className="ml-2 h-4 w-4 rounded-full bg-white/20 group-hover:bg-white/30 transition-colors" />
              </button>
              <a
                href="/documents"
                className="inline-flex items-center justify-center rounded-xl bg-white/10 px-6 py-3 text-sm font-semibold text-white ring-1 ring-inset ring-white/20 backdrop-blur-sm transition-all duration-300 hover:bg-white/20 hover:scale-105"
              >
                <span className="mr-2">📚</span>
                Open Documents
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-3xl bg-gradient-to-br from-white/10 to-white/5 p-6 ring-1 ring-inset ring-white/10 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white/90">Key Capabilities</h3>
                <div className="h-3 w-3 rounded-full bg-green-400 animate-pulse" />
              </div>
              <ul className="space-y-3 text-sm text-white/80">
                {capabilities.map((item, index) => (
                  <li 
                    key={item} 
                    className="flex items-start gap-3 group"
                    style={{
                      animationDelay: `${index * 200}ms`,
                      animation: 'slideInLeft 0.6s ease-out forwards'
                    }}
                  >
                    <div className="mt-1.5 h-2 w-2 flex-none rounded-full bg-gradient-to-r from-blue-400 to-purple-400 group-hover:scale-125 transition-transform duration-300" />
                    <span className="group-hover:text-white transition-colors duration-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Content Section */}
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="group rounded-3xl border border-gray-200/50 bg-gradient-to-br from-white to-gray-50/50 p-8 shadow-xl transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-lg">🧠</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900">The Solution</h3>
          </div>
          
          <p className="text-gray-600 leading-7 mb-8">
            AutoRAG is designed to be a fully autonomous RAG engine that self-heals whenever answers look unreliable.
            Instead of returning a low-confidence response, it automatically retrieves, verifies, and inserts improved
            knowledge—then re-answers using the enriched index.
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              { 
                title: 'Low-trust detection', 
                desc: 'Automatically flags weak answers using a trust score.',
                icon: '🎯',
                gradient: 'from-red-500 to-pink-500'
              }, 
              { 
                title: 'External knowledge acquisition', 
                desc: 'Search + crawl PDFs/HTML when needed.',
                icon: '🌐',
                gradient: 'from-blue-500 to-cyan-500'
              }, 
              { 
                title: 'Live vector upserts', 
                desc: 'Chunk, embed, and upsert into ChromaDB in real-time.',
                icon: '⚡',
                gradient: 'from-yellow-500 to-orange-500'
              }, 
              { 
                title: 'Reinforcement loop', 
                desc: 'Feedback scoring improves future retrieval and ranking.',
                icon: '🔄',
                gradient: 'from-green-500 to-emerald-500'
              }
            ].map((feature, index) => (
              <div 
                key={feature.title} 
                className="group/card relative overflow-hidden rounded-2xl border border-gray-200/50 bg-white p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                style={{
                  animationDelay: `${index * 150}ms`,
                  animation: 'fadeInUp 0.6s ease-out forwards'
                }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover/card:opacity-5 transition-opacity duration-300`} />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-lg">{feature.icon}</span>
                    <div className="text-sm font-bold text-gray-900">{feature.title}</div>
                  </div>
                  <div className="text-sm text-gray-600 leading-relaxed">{feature.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <QueryInterface />
      </section>

      {uploadOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setUploadOpen(false)} />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Upload document (demo)</h3>
              <button
                type="button"
                className="rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
                onClick={() => setUploadOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <input
                type="file"
                className="block w-full text-sm text-gray-900 file:mr-3 file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-blue-700"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  toast.success(`Selected: ${file.name}`)
                }}
              />
              <p className="text-sm text-gray-500">This is a demo UI. Backend upload can be connected later.</p>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => setUploadOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  onClick={() => {
                    toast.success('Upload queued (demo)')
                    setUploadOpen(false)
                  }}
                >
                  Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
