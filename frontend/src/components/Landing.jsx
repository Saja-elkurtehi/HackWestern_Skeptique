import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

const LensFlare = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    <motion.div
      animate={{
        x: [0, 100, -50, 0],
        y: [0, -50, 100, 0],
        opacity: [0.1, 0.3, 0.1]
      }}
      transition={{ duration: 8, repeat: Infinity }}
      className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-200 rounded-full blur-3xl"
    />
  </div>
)

const ApertureCard = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
    transition={{ duration: 0.8, delay }}
    whileHover={{ 
      scale: 1.05,
      transition: { duration: 0.3 }
    }}
    className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-500 cursor-pointer"
  >
    {children}
  </motion.div>
)

const Landing = () => {
  const navigate = useNavigate()
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [focus, setFocus] = useState(1)

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const res = await fetch('http://localhost:3000/stories')
        if (!res.ok) throw new Error('Failed to load topics')
        const data = await res.json()
        setTopics(data)
        
        // Gradually increase focus as content loads
        setTimeout(() => setFocus(2), 500)
        setTimeout(() => setFocus(3), 1000)
        setTimeout(() => setFocus(4), 1500)
        setTimeout(() => setFocus(5), 2000)
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

  const getBlurStyle = (baseBlur) => {
    const blurAmount = Math.max(0, baseBlur - (focus * 2))
    return `blur(${blurAmount}px)`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      <LensFlare />
      
      {/* Header */}
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{ filter: getBlurStyle(8) }}
        className="fixed top-0 w-full z-50 bg-black/20 backdrop-blur-lg border-b border-white/10"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-3"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                <span className="text-xl">📸</span>
              </div>
              <div>
                <h1 className="text-2xl font-light tracking-wider">Refocus Lens</h1>
                <p className="text-xs text-white/60 font-light">See the full picture</p>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-right"
            >
              <div className="text-xs text-white/60 font-light tracking-wider">FOCUS</div>
              <div className="text-sm">f/{focus}.8</div>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <main className="pt-32 pb-20">
        <motion.section
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            filter: focus >= 3 ? 'blur(0px)' : 'blur(20px)'
          }}
          transition={{ duration: 1.5 }}
          className="max-w-4xl mx-auto px-6 text-center mb-20"
        >
          <motion.h1 
            className="text-6xl md:text-8xl font-light tracking-tight mb-8"
            style={{ 
              textShadow: '0 0 50px rgba(255,255,255,0.2)',
              filter: getBlurStyle(15)
            }}
          >
            REFOCUS
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="text-xl md:text-2xl text-white/70 font-light max-w-2xl mx-auto leading-relaxed mb-12"
            style={{ filter: getBlurStyle(8) }}
          >
            Adjust your lens until the story becomes clear. 
            <span className="block mt-2 text-white/50 text-lg">
              Multiple sources, one truth.
            </span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="flex justify-center space-x-4"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 bg-white rounded-full"
            />
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
              className="w-2 h-2 bg-white rounded-full"
            />
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
              className="w-2 h-2 bg-white rounded-full"
            />
          </motion.div>
        </motion.section>

        {/* Topics Grid */}
        <section className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="text-center mb-16"
          >
            <div className="text-sm text-white/60 font-light tracking-wider mb-2">
              SELECT FOCAL POINT
            </div>
            <h2 className="text-3xl font-light mb-4">Current Stories</h2>
            <p className="text-white/60 max-w-xl mx-auto">
              Choose a story to adjust the focus and see through different lenses
            </p>
          </motion.div>

          {loading && (
            <div className="flex justify-center items-center py-20">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full"
              />
            </div>
          )}

          {error && !loading && (
            <ApertureCard>
              <div className="text-center py-8">
                <div className="text-4xl mb-4">❌</div>
                <h3 className="text-xl font-light mb-2">Focus Error</h3>
                <p className="text-white/60">{error}</p>
              </div>
            </ApertureCard>
          )}

          {!loading && !error && (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.1
                  }
                }
              }}
            >
              {topics.map((topic, index) => (
                <motion.div
                  key={topic.id}
                  variants={{
                    hidden: { opacity: 0, y: 20, filter: 'blur(10px)' },
                    visible: { 
                      opacity: 1, 
                      y: 0, 
                      filter: 'blur(0px)',
                      transition: { duration: 0.6 }
                    }
                  }}
                >
                  <ApertureCard delay={index * 0.1}>
                    <div 
                      onClick={() => handleTopicClick(topic.id)}
                      className="h-full"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-xl font-light leading-tight pr-4 group-hover:text-blue-300 transition-colors duration-500">
                          {topic.title}
                        </h3>
                       <div className="px-3 py-1 bg-white/10 rounded-full text-xs font-light border border-white/20 shrink-0">
                        {typeof topic.sources === 'number' && topic.sources > 0
                          ? `${topic.sources} LENSES`
                          : 'LIVE LENSES'}
                      </div>

                      </div>
                      
                      <p className="text-white/60 text-sm mb-4 leading-relaxed font-light">
                        Multiple perspectives available for analysis
                      </p>
                      
                      <div className="flex flex-wrap gap-2">
                        {topic.tags?.slice(0, 2).map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="px-2 py-1 bg-white/10 rounded-full text-xs font-light border border-white/20 hover:bg-white/20 transition-all duration-500"
                          >
                            #{tag}
                          </span>
                        ))}
                        {topic.tags?.length > 2 && (
                          <span className="px-2 py-1 bg-white/5 rounded-full text-xs text-white/40">
                            +{topic.tags.length - 2}
                          </span>
                        )}
                      </div>
                    </div>
                  </ApertureCard>
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>

        {/* How It Works */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto px-6 mt-32"
        >
          <ApertureCard>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-light mb-6">How Refocus Works</h2>
              <p className="text-white/60 max-w-2xl mx-auto font-light">
                Like adjusting a camera lens, we bring different perspectives into focus to reveal the complete picture
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  emoji: "🎯",
                  title: "Select Story",
                  desc: "Choose a current event to analyze"
                },
                {
                  emoji: "🔍",
                  title: "Adjust Focus",
                  desc: "View through different media lenses"
                },
                {
                  emoji: "📊",
                  title: "See Clearly",
                  desc: "Understand the complete narrative"
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  whileHover={{ y: -5 }}
                  className="text-center group"
                >
                  <motion.div 
                    className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20 group-hover:bg-white/20 transition-all duration-500"
                    whileHover={{ scale: 1.1 }}
                  >
                    <span className="text-2xl">{item.emoji}</span>
                  </motion.div>
                  <h3 className="font-light text-lg mb-3">{item.title}</h3>
                  <p className="text-white/60 text-sm font-light leading-relaxed">
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </ApertureCard>
        </motion.section>
      </main>
    </div>
  )
}

export default Landing
