import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between md:flex-row">
          <div className="flex space-x-6">
            <Link to="/privacy" className="text-sm text-gray-500 hover:text-gray-700">
              Privacy
            </Link>
            <Link to="/terms" className="text-sm text-gray-500 hover:text-gray-700">
              Terms
            </Link>
            <Link to="/support" className="text-sm text-gray-500 hover:text-gray-700">
              Support
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-500 md:mt-0">
            &copy; {new Date().getFullYear()} AutoRAG. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}