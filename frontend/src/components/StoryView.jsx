import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

// Aperture Loader Component
const ApertureLoader = () => (
  <motion.div
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    className="flex flex-col items-center justify-center"
  >
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      className="relative w-16 h-16 mb-4"
    >
      {[0, 45, 90, 135].map((rotation) => (
        <motion.div
          key={rotation}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: rotation * 0.01 }}
          className="absolute inset-0"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <div className="w-8 h-2 bg-gray-600 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </motion.div>
      ))}
      <div className="absolute inset-0 bg-black rounded-full" />
    </motion.div>
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="text-sm text-gray-600 font-light tracking-wider"
    >
      ADJUSTING FOCUS
    </motion.p>
  </motion.div>
)

// Focus Meter Component
const FocusMeter = ({ focusLevel, onFocusChange }) => (
  <div className="flex items-center space-x-4">
    <span className="text-xs text-gray-500 font-light tracking-wider">FOCUS</span>
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((level) => (
        <button
          key={level}
          onClick={() => onFocusChange(level)}
          className={`w-2 h-6 rounded-full transition-all duration-500 ${
            focusLevel >= level 
              ? 'bg-blue-500 shadow-lg shadow-blue-500/30' 
              : 'bg-gray-300'
          }`}
        />
      ))}
    </div>
  </div>
)

// LensFlare Component
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
    <motion.div
      animate={{
        x: [0, -100, 50, 0],
        y: [0, 50, -100, 0],
        opacity: [0.1, 0.2, 0.1]
      }}
      transition={{ duration: 6, repeat: Infinity, delay: 2 }}
      className="absolute top-3/4 right-1/4 w-24 h-24 bg-purple-200 rounded-full blur-3xl"
    />
  </div>
)

const StoryView = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [story, setStory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [focusLevel, setFocusLevel] = useState(1)
  const [contentLoaded, setContentLoaded] = useState(false)

  useEffect(() => {
    const fetchStory = async () => {
      setLoading(true)
      setError(null)
      setContentLoaded(false)
      
      try {
        const res = await fetch(`http://localhost:3000/stories/${id}`)
        if (!res.ok) throw new Error('Failed to load story')
        const data = await res.json()
        setStory(data)

        // Simulate focus adjustment after data loads
        setTimeout(() => {
          setContentLoaded(true)
          setFocusLevel(5)
        }, 1000)
      } catch (err) {
        console.error(err)
        setError('Could not load this story right now.')
      } finally {
        // 🔥 THIS WAS MISSING
        setLoading(false)
      }
    }

    if (id) fetchStory()
  }, [id])

  const getBlurStyle = (baseBlur) => {
    const blurAmount = Math.max(0, baseBlur - (focusLevel * 2))
    return `blur(${blurAmount}px)`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <LensFlare />
        <ApertureLoader />
      </div>
    )
  }

  if (error || !story) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <LensFlare />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center text-white"
        >
          <div className="text-6xl mb-4">📸</div>
          <h1 className="text-2xl font-light mb-4">Focus Lost</h1>
          <p className="text-gray-400 mb-8">This story appears to be out of frame.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-all duration-500"
          >
            Return to Gallery
          </button>
        </motion.div>
      </div>
    )
  }

  const sources = story.sources || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      <LensFlare />
      
      {/* Header */}
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{ filter: getBlurStyle(10) }}
        className="fixed top-0 w-full z-50 bg-black/20 backdrop-blur-lg border-b border-white/10"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.button
              whileHover={{ x: -4 }}
              onClick={() => navigate('/')}
              className="flex items-center text-white/80 hover:text-white transition-all duration-500 group"
            >
              <motion.div
                animate={{ rotate: 180 }}
                className="text-2xl mr-2 group-hover:scale-110"
              >
                ◀
              </motion.div>
              <span className="font-light tracking-wider">LENS GALLERY</span>
            </motion.button>
            
            <div className="flex items-center space-x-8">
              <FocusMeter focusLevel={focusLevel} onFocusChange={setFocusLevel} />
              
              <div className="text-right">
                <div className="text-xs text-white/60 font-light tracking-wider">APERTURE</div>
                <div className="text-sm">f/{focusLevel}.8</div>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ 
            opacity: contentLoaded ? 1 : 0.3,
            scale: contentLoaded ? 1 : 1.1,
            filter: contentLoaded ? 'blur(0px)' : 'blur(20px)'
          }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="max-w-4xl mx-auto px-6 text-center mb-16"
        >
          <motion.h1 
            className="text-5xl md:text-7xl font-light tracking-tight mb-6"
            style={{ 
              filter: getBlurStyle(8),
              textShadow: '0 0 30px rgba(255,255,255,0.3)'
            }}
          >
            {story.title}
          </motion.h1>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="flex justify-center space-x-4 mb-8"
          >
            {story.tags?.map((tag, index) => (
              <motion.span
                key={index}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.2 + index * 0.1 }}
                className="px-4 py-2 border border-white/20 rounded-full text-sm font-light tracking-wider hover:bg-white/10 transition-all duration-500 cursor-pointer"
                style={{ filter: getBlurStyle(5) }}
              >
                #{tag}
              </motion.span>
            ))}
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 }}
            className="text-xl text-white/70 font-light max-w-2xl mx-auto leading-relaxed"
            style={{ filter: getBlurStyle(3) }}
          >
            Adjusting the lens to reveal the complete picture
          </motion.p>
        </motion.section>

        {/* Combined Summary */}
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="max-w-4xl mx-auto px-6 mb-16"
        >
          <motion.div
            className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-8 hover:bg-white/10 transition-all duration-500"
            style={{ filter: getBlurStyle(4) }}
            whileHover={{ 
              scale: 1.02,
              filter: 'blur(0px)',
              transition: { duration: 0.3 }
            }}
          >
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mr-4 border border-blue-500/30">
                <span className="text-2xl">🔍</span>
              </div>
              <div>
                <div className="text-sm text-blue-400 font-light tracking-wider mb-1">
                  WIDE ANGLE VIEW
                </div>
                <h2 className="text-2xl font-light">Composite Focus</h2>
              </div>
            </div>
            
            <motion.p 
              className="text-white/80 leading-relaxed text-lg font-light"
              style={{ filter: getBlurStyle(2) }}
            >
              {story.combinedSummary?.content || 
                "Multiple focal lengths combined to reveal the clearest possible interpretation of events."}
            </motion.p>
          </motion.div>
        </motion.section>

        {/* Sources Grid */}
        <section className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="text-center mb-12"
          >
            <div className="text-sm text-white/60 font-light tracking-wider mb-2">
              MULTIPLE FOCAL LENGTHS
            </div>
            <h2 className="text-3xl font-light">Source Perspectives</h2>
            <p className="text-white/60 mt-2">Each outlet brings a different focus to the story</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sources.map((source, index) => {
              const depthBlur = Math.abs(2 - (index % 3)) * 2
              
              return (
                <motion.div
                  key={source.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.4 + index * 0.1 }}
                  className="group cursor-pointer"
                  style={{ filter: getBlurStyle(depthBlur) }}
                >
                  <motion.div
                    whileHover={{ 
                      scale: 1.05,
                      zIndex: 10,
                      filter: 'blur(0px)',
                      transition: { duration: 0.4 }
                    }}
                    className="bg-white/5 backdrop-blur-lg rounded-xl border border:white/10 p-6 h-full hover:bg-white/10 hover:border-white/20 transition-all duration-500"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-light mb-2 group-hover:text-blue-300 transition-colors duration-500">
                          {source.name}
                        </h3>
                        <div className="text-xs text-white/40 font-light tracking-wider">
                          FOCAL LENGTH: {index % 3 === 0 ? 'WIDE' : index % 3 === 1 ? 'STANDARD' : 'TELEPHOTO'}
                        </div>
                      </div>
                      
                      {source.imageUrl ? (
                        <motion.img
                          whileHover={{ rotate: 5 }}
                          src={source.imageUrl}
                          alt={source.name}
                          className="w-12 h-12 rounded-lg object-cover border border-white/20"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-white/10 border border-white/20 flex items:center justify-center">
                          <span className="text-lg">📷</span>
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2 mb-4">
                      <div className="px-3 py-1 bg-white/10 rounded-full text-xs font-light border border-white/20">
                        {source.tone || 'NEUTRAL'} TONE
                      </div>
                      <div className="px-3 py-1 bg:white/10 rounded-full text-xs font-light border border:white/20">
                        f/{((index % 5) + 1).toFixed(1)}
                      </div>
                    </div>

                    <motion.p 
                      className="text-white/70 leading-relaxed font-light mb-4 text-sm"
                      style={{ filter: getBlurStyle(1) }}
                    >
                      {source.summary?.slice(0, 120)}...
                    </motion.p>

                    {source.url && (
                      <motion.a
                        whileHover={{ x: 5 }}
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center text-blue-400 hover:text-blue-300 font-light text-sm group/link transition-colors duration-500"
                      >
                        VIEW THROUGH THIS LENS
                        <motion.span
                          animate={{ x: [0, 5, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="ml-2"
                        >
                          →
                        </motion.span>
                      </motion.a>
                    )}
                  </motion.div>
                </motion.div>
              )
            })}
          </div>
        </section>

        {/* Blind Spots */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="max-w-4xl mx-auto px-6 mt-20"
        >
          <motion.div
            className="bg-red-500/10 backdrop-blur-lg rounded-2xl border border-red-500/20 p-8"
            style={{ filter: getBlurStyle(6) }}
            whileHover={{ 
              filter: getBlurStyle(2),
              transition: { duration: 0.5 }
            }}
          >
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify:center mr-4 border border-red-500/30">
                <span className="text-2xl">🌫️</span>
              </div>
              <div>
                <div className="text-sm text-red-400 font-light tracking-wider mb-1">
                  OUT OF FOCUS
                </div>
                <h2 className="text-2xl font-light">Blind Spots</h2>
              </div>
            </div>
            
            <div className="space-y-3">
              {story.blindSpots?.items?.length ? (
                story.blindSpots.items.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 2.2 + index * 0.1 }}
                    className="flex items-start p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-500"
                  >
                    <span className="text-red-400 mr-3 mt-1">•</span>
                    <span className="text-white/70 font-light">{item}</span>
                  </motion.div>
                ))
              ) : (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-white/60 font-light text-center py-8"
                >
                  Adjust focus to reveal missing perspectives
                </motion.p>
              )}
            </div>
          </motion.div>
        </motion.section>
      </main>
    </div>
  )
}

export default StoryView
