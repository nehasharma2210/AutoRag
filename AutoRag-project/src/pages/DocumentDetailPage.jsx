import { Link, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function DocumentDetailPage() {
  const { id } = useParams()

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Document #{id}</h2>
          <p className="mt-1 text-sm text-gray-500">Demo details page (connect to backend later).</p>
        </div>
        <Link
          to="/documents"
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Back
        </Link>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <div className="text-sm text-gray-500">Filename</div>
            <div className="mt-1 font-medium text-gray-900">Document {id}.pdf</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Collection</div>
            <div className="mt-1 font-medium text-gray-900">Collection {id}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Status</div>
            <div className="mt-1 font-medium text-gray-900">Indexed (demo)</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Last updated</div>
            <div className="mt-1 font-medium text-gray-900">3 days ago</div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
            onClick={() => toast.success('Run retrieval test (demo)')}
          >
            Run retrieval test
          </button>
          <button
            type="button"
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            onClick={() => toast('Download (demo)')}
          >
            Download
          </button>
          <button
            type="button"
            className="rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
            onClick={() => toast.success('Deleted (demo)')}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
