import { Link } from 'react-router-dom'
import { 
  DocumentTextIcon, 
  Cog6ToothIcon, 
  CloudArrowUpIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline'

export default function HelpPage() {
  const quickActions = [
    {
      title: 'Upload Documents',
      description: 'Add new documents to your knowledge base',
      icon: CloudArrowUpIcon,
      link: '/documents',
      color: 'blue'
    },
    {
      title: 'View Documents',
      description: 'Browse and manage your document collection',
      icon: DocumentTextIcon,
      link: '/documents',
      color: 'green'
    },
    {
      title: 'Configure Settings',
      description: 'Adjust AutoRAG parameters and preferences',
      icon: Cog6ToothIcon,
      link: '/settings',
      color: 'purple'
    },
    {
      title: 'Search & Query',
      description: 'Test retrieval and generation capabilities',
      icon: MagnifyingGlassIcon,
      link: '/dashboard',
      color: 'orange'
    }
  ]

  const helpTopics = [
    {
      title: 'Getting Started',
      items: [
        'How to upload your first document',
        'Understanding document collections',
        'Basic search and retrieval',
        'Configuring your first RAG pipeline'
      ]
    },
    {
      title: 'Document Management',
      items: [
        'Supported file formats (PDF, TXT, DOCX)',
        'Organizing documents into collections',
        'Document preprocessing and chunking',
        'Managing document metadata'
      ]
    },
    {
      title: 'AutoRAG Features',
      items: [
        'Self-healing retrieval system',
        'Trust score evaluation',
        'External knowledge acquisition',
        'Real-time vector database updates'
      ]
    },
    {
      title: 'Advanced Configuration',
      items: [
        'Customizing embedding models',
        'Adjusting retrieval parameters',
        'Setting up external search providers',
        'Configuring feedback loops'
      ]
    }
  ]

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Help Center</h1>
        <p className="mt-2 text-lg text-gray-600">
          Learn how to use AutoRAG effectively
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((action) => (
          <Link
            key={action.title}
            to={action.link}
            className="group rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center">
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg bg-${action.color}-100`}>
                <action.icon className={`h-6 w-6 text-${action.color}-600`} />
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                  {action.title}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {action.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Demo Information */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
        <div className="flex items-start">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
            <QuestionMarkCircleIcon className="h-5 w-5 text-blue-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-blue-900">Demo Environment</h3>
            <p className="mt-1 text-sm text-blue-700">
              This is a demo UI for AutoRAG. The interface is fully functional, but backend connections 
              need to be implemented for production use.
            </p>
            <div className="mt-4 space-y-2">
              <div className="text-sm text-blue-700">
                • All data shown is simulated for demonstration purposes
              </div>
              <div className="text-sm text-blue-700">
                • Upload and processing functions show success messages but don't persist data
              </div>
              <div className="text-sm text-blue-700">
                • Ready for backend API integration
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Help Topics */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {helpTopics.map((topic) => (
          <div key={topic.title} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{topic.title}</h3>
            <ul className="space-y-3">
              {topic.items.map((item) => (
                <li key={item} className="flex items-start">
                  <div className="flex h-2 w-2 items-center justify-center mt-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                  </div>
                  <span className="ml-3 text-sm text-gray-600 hover:text-gray-900 cursor-pointer">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Additional Resources */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Resources</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link 
            to="/support" 
            className="flex items-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <ChartBarIcon className="h-5 w-5 text-gray-400 mr-3" />
            <div>
              <div className="text-sm font-medium text-gray-900">Contact Support</div>
              <div className="text-xs text-gray-500">Get help from our team</div>
            </div>
          </Link>
          
          <button 
            className="flex items-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            onClick={() => window.open('https://github.com/autorag/autorag', '_blank')}
          >
            <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-3" />
            <div>
              <div className="text-sm font-medium text-gray-900">Documentation</div>
              <div className="text-xs text-gray-500">Technical guides</div>
            </div>
          </button>
          
          <button 
            className="flex items-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            onClick={() => window.open('https://github.com/autorag/autorag/discussions', '_blank')}
          >
            <QuestionMarkCircleIcon className="h-5 w-5 text-gray-400 mr-3" />
            <div>
              <div className="text-sm font-medium text-gray-900">Community</div>
              <div className="text-xs text-gray-500">Join discussions</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
