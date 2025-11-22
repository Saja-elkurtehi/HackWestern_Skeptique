import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const Landing = () => {
  const navigate = useNavigate()
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const res = await fetch('http://localhost:3000/stories')
        if (!res.ok) throw new Error('Failed to load topics')
        const data = await res.json()
        setTopics(data)
      } catch (err) {
        console.error(err)
        setError('Could not load topics right now.')
      } finally {
        setLoading(false)
      }
    }

    fetchTopics()
  }, [])

  const handleTopicClick = (topicId) => {
    navigate(`/stories/${topicId}`)
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-pink-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <span className="inline-flex items-center rounded-full border border-pink-200 bg-white px-3 py-1 text-sm font-semibold text-pink-600">
              Skeptiq
            </span>
          </div>
          <div className="text-sm text-gray-500">
            Read the fine print. Look twice.
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <section className="text-center py-12">
          <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-4">
            See how the story changes with the source.
          </h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto mb-2">
            Skeptiq lets you compare how different outlets frame the same news topic,
            then shows you what they all quietly skip.
          </p>
          <p className="text-sm text-gray-500">
            Built in 36 hours at HackWestern.
          </p>
        </section>

        {/* Topic List */}
        <section className="py-8">
          <div className="text-center mb-8">
            <h2 className="text-sm uppercase tracking-wider text-gray-500 font-semibold">
              Choose a topic
            </h2>
          </div>

          {loading && (
            <p className="text-center text-sm text-gray-500">Loading topics…</p>
          )}

          {error && !loading && (
            <p className="text-center text-sm text-red-500">{error}</p>
          )}

          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {topics.map((topic) => (
                <div
                  key={topic.id}
                  onClick={() => handleTopicClick(topic.id)}
                  className="bg-white border border-pink-100 rounded-2xl p-5 shadow-md shadow-pink-100 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:bg-pink-50 hover:shadow-lg hover:shadow-pink-100"
                >
                  <h3 className="font-semibold text-gray-900 text-lg mb-2">
                    {topic.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    {topic.sources} sources · combined view
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {topic.tags?.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex rounded-full bg-pink-50 px-2 py-0.5 text-xs text-pink-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* How it works strip */}
        <section className="py-8">
          <div className="bg-white/50 border border-pink-100 rounded-2xl p-6 max-w-2xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-2xl mb-2">📝</div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1">Pick a topic</h3>
                <p className="text-gray-500 text-xs">Choose from current events</p>
              </div>
              <div>
                <div className="text-2xl mb-2">🔍</div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1">Compare sources</h3>
                <p className="text-gray-500 text-xs">See different angles and tones</p>
              </div>
              <div>
                <div className="text-2xl mb-2">🎯</div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1">Spot the gaps</h3>
                <p className="text-gray-500 text-xs">Discover what's missing</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default Landing
