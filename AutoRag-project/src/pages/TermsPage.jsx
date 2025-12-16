export default function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
        <p className="mt-2 text-lg text-gray-600">Last updated: December 16, 2025</p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <div className="prose prose-gray max-w-none">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Acceptance of Terms</h2>
          <p className="text-gray-700 mb-6">
            By accessing and using AutoRAG, you accept and agree to be bound by the terms and 
            provision of this agreement. If you do not agree to abide by the above, please do not use this service.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mb-4">Use License</h2>
          <p className="text-gray-700 mb-4">
            Permission is granted to temporarily use AutoRAG for personal, non-commercial transitory viewing only. 
            This is the grant of a license, not a transfer of title, and under this license you may not:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
            <li>Modify or copy the materials</li>
            <li>Use the materials for any commercial purpose or for any public display</li>
            <li>Attempt to reverse engineer any software contained in AutoRAG</li>
            <li>Remove any copyright or other proprietary notations from the materials</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900 mb-4">Service Availability</h2>
          <p className="text-gray-700 mb-6">
            AutoRAG is provided "as is" without any representations or warranties. We do not warrant 
            that the service will be uninterrupted or error-free. We reserve the right to modify or 
            discontinue the service at any time.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mb-4">User Content</h2>
          <p className="text-gray-700 mb-6">
            You retain ownership of any intellectual property rights that you hold in the content you 
            upload to AutoRAG. By uploading content, you grant us a license to use, store, and process 
            your content solely for the purpose of providing our services.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mb-4">Limitation of Liability</h2>
          <p className="text-gray-700 mb-6">
            In no event shall AutoRAG or its suppliers be liable for any damages (including, without 
            limitation, damages for loss of data or profit, or due to business interruption) arising 
            out of the use or inability to use AutoRAG.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
          <p className="text-gray-700">
            If you have any questions about these Terms of Service, please contact us at{' '}
            <a href="mailto:legal@autorag.com" className="text-blue-600 hover:underline">
              legal@autorag.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
