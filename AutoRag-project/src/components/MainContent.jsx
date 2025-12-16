import { useState } from 'react'
import { DocumentTextIcon, ArrowUpTrayIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const demoDocuments = [
  { id: '1', name: 'Document 1.pdf', size: '2.1 MB', updated: 'Updated 3 days ago', collection: 'Collection 1', type: 'PDF' },
  { id: '2', name: 'Document 2.pdf', size: '2.2 MB', updated: 'Updated 3 days ago', collection: 'Collection 2', type: 'PDF' },
  { id: '3', name: 'Document 3.pdf', size: '2.3 MB', updated: 'Updated 3 days ago', collection: 'Collection 3', type: 'PDF' },
  { id: '4', name: 'Notes 4.txt', size: '0.4 MB', updated: 'Updated 1 day ago', collection: 'Collection 1', type: 'Text' },
  { id: '5', name: 'Notes 5.txt', size: '0.6 MB', updated: 'Updated 2 days ago', collection: 'Collection 2', type: 'Text' },
  { id: '6', name: 'Document 6.pdf', size: '2.6 MB', updated: 'Updated 3 days ago', collection: 'Collection 3', type: 'PDF' },
]

export default function MainContent({ defaultTab = 'overview', onUpload, onView }) {
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All Documents')

  const handleUpload = () => {
    if (onUpload) return onUpload()
    toast.success('Upload (demo)')
  }

  const handleView = (doc) => {
    if (onView) return onView(doc)
    toast(`View ${doc.name} (demo)`, { duration: 2000 })
  }

  const visibleDocuments = demoDocuments
    .filter((d) => (filter === 'All Documents' ? true : d.type === filter))
    .filter((d) => (search.trim() ? d.name.toLowerCase().includes(search.trim().toLowerCase()) : true))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <h2 className="text-2xl font-bold text-gray-900">Document Manager</h2>
        <button
          type="button"
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          onClick={handleUpload}
        >
          <ArrowUpTrayIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          Upload Document
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { name: 'Overview', id: 'overview' },
            { name: 'All Documents', id: 'documents' },
            { name: 'Collections', id: 'collections' },
            { name: 'Analytics', id: 'analytics' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }
                whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium
              `}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="relative rounded-md shadow-sm">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            name="search"
            id="search"
            className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          id="filter"
          name="filter"
          className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-600 sm:text-sm sm:leading-6"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option>All Documents</option>
          <option>Recent</option>
          <option>PDF</option>
          <option>Text</option>
        </select>
      </div>

      {/* Document Grid */}
      <div className="mt-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibleDocuments.map((doc) => (
            <div
              key={doc.id}
              className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50">
                  <DocumentTextIcon className="h-6 w-6 text-blue-600" aria-hidden="true" />
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-sm font-medium text-gray-900">{doc.name}</h3>
                  <p className="text-sm text-gray-500">
                    {doc.size} • {doc.updated}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                <span>{doc.collection}</span>
                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-800"
                  onClick={() => handleView(doc)}
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Empty State (uncomment if needed) */}
      {/* <div className="text-center py-12">
        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No documents</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by uploading a new document.
        </p>
        <div className="mt-6">
          <button
            type="button"
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <ArrowUpTrayIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            New Document
          </button>
        </div>
      </div> */}
    </div>
  )
}