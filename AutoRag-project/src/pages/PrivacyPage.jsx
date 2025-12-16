export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
        <p className="mt-2 text-lg text-gray-600">Last updated: December 16, 2025</p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <div className="prose prose-gray max-w-none">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Information We Collect</h2>
          <p className="text-gray-700 mb-6">
            AutoRAG collects information you provide directly to us, such as when you create an account, 
            upload documents, or contact us for support. This may include your name, email address, 
            and the documents you choose to process through our system.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mb-4">How We Use Your Information</h2>
          <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
            <li>To provide and maintain our AutoRAG service</li>
            <li>To process and analyze your documents for retrieval-augmented generation</li>
            <li>To improve our algorithms and service quality</li>
            <li>To communicate with you about your account and our services</li>
            <li>To comply with legal obligations</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Security</h2>
          <p className="text-gray-700 mb-6">
            We implement appropriate technical and organizational measures to protect your personal 
            information against unauthorized access, alteration, disclosure, or destruction. Your 
            documents are encrypted both in transit and at rest.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Retention</h2>
          <p className="text-gray-700 mb-6">
            We retain your information only as long as necessary to provide our services and fulfill 
            the purposes outlined in this privacy policy. You can request deletion of your data at any time.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Us</h2>
          <p className="text-gray-700">
            If you have any questions about this Privacy Policy, please contact us at{' '}
            <a href="mailto:privacy@autorag.com" className="text-blue-600 hover:underline">
              privacy@autorag.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
