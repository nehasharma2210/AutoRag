import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import MainContent from '../components/MainContent'

export default function DocumentsPage() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto w-full max-w-7xl px-6">
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <MainContent
          defaultTab="documents"
          onUpload={() => toast.success('Upload from Documents (demo)')}
          onView={(doc) => navigate(`/documents/${doc.id}`)}
        />
      </div>
    </div>
  )
}
