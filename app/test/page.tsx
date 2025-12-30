export default function TestPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Test Page - No Dependencies</h1>
      <p className="mt-4">If you can see this, the basic routing works!</p>
      <p className="mt-2 text-sm text-gray-600">
        This page has no imports or dependencies to test if the issue is in middleware/layout or elsewhere.
      </p>
    </div>
  )
}

