import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

// simple in-memory cache so we don't refetch the same story all the time
const storyCache = new Map()

// ==================== DARK MODE COMPONENTS (Refocus Lens) ====================

const DarkLensFlare = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
    <motion.div
      animate={{
        x: [0, 100, -50, 0],
        y: [0, -50, 100, 0],
        opacity: [0.1, 0.3, 0.1],
      }}
      transition={{ duration: 8, repeat: Infinity }}
      className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-200 rounded-full blur-3xl"
    />
  </div>
)

const DarkLoader = () => (
  <motion.div
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    className="flex flex-col items-center justify-center"
  >
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
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
          <div className="w-8 h-2 bg-slate-500 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </motion.div>
      ))}
      <div className="absolute inset-0 bg-black rounded-full" />
    </motion.div>
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="text-sm text-slate-400 font-light tracking-wider"
    >
      ADJUSTING FOCUS
    </motion.p>
  </motion.div>
)

// header bias/focus control (dark)
const DarkBiasControl = ({ level, onChange }) => (
  <div className="flex items-center space-x-3">
    <span className="text-xs text-slate-400 font-light tracking-wider">
      BIAS METER
    </span>
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((value) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={`w-3 h-6 rounded-full transition-all duration-300 ${
            level >= value
              ? 'bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.7)]'
              : 'bg-slate-600'
          }`}
        />
      ))}
    </div>
    <span className="text-xs text-slate-300 font-light">
      {level}/5 clarity
    </span>
  </div>
)

const DarkSourceCard = ({ source, index }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9, y: 20 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ delay: 0.3 + index * 0.07 }}
    className="group cursor-pointer"
  >
    <motion.div
      whileHover={{
        scale: 1.05,
        zIndex: 10,
        transition: { duration: 0.3 },
      }}
      className="bg-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700 p-6 h-full hover:bg-slate-900/90 hover:border-blue-400/60 transition-all duration-400"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-light mb-1 group-hover:text-blue-300 transition-colors duration-300">
            {source.name}
          </h3>
          <div className="text-xs text-slate-400 font-light tracking-wider">
            LENS TYPE:{' '}
            {index % 3 === 0 ? 'WIDE' : index % 3 === 1 ? 'STANDARD' : 'TELEPHOTO'}
          </div>
        </div>

        {source.imageUrl ? (
          <motion.img
            whileHover={{ rotate: 5 }}
            src={source.imageUrl}
            alt={source.name}
            className="w-12 h-12 rounded-lg object-cover border border-slate-600"
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-600 flex items-center justify-center">
            <span className="text-lg">📷</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <div className="px-3 py-1 bg-slate-800 rounded-full text-xs font-light border border-slate-600">
          {source.tone || 'NEUTRAL'} TONE
        </div>
        <div className="px-3 py-1 bg-slate-800 rounded-full text-xs font-light border border-slate-600">
          FRAME: {source.frame || 'Unknown'}
        </div>
      </div>

      <p className="text-slate-200/80 leading-relaxed font-light mb-4 text-sm">
        {source.summary?.slice(0, 140)}...
      </p>

      {source.url && (
        <motion.a
          whileHover={{ x: 4 }}
          href={source.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center text-blue-400 hover:text-blue-300 font-light text-sm group/link transition-colors duration-300"
        >
          VIEW THROUGH THIS LENS
          <motion.span
            animate={{ x: [0, 4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="ml-2"
          >
            →
          </motion.span>
        </motion.a>
      )}
    </motion.div>
  </motion.div>
)

// ==================== LIGHT MODE COMPONENTS (Skeptiq) ====================

const LightBackground = () => (
  <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-red-50 pointer-events-none -z-10" />
)

const LightLoader = () => (
  <div className="flex flex-col items-center justify-center">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full mb-4"
    />
    <p className="text-lg text-gray-600">Loading the spin cycle...</p>
  </div>
)

// header focus/bias control (light)
const LightFocusControl = ({ level, onChange }) => (
  <div className="flex items-center space-x-3">
    <span className="text-xs text-gray-600 font-black tracking-wider">
      FOCUS / BIAS
    </span>
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((value) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={`w-3 h-6 rounded-full transition-all duration-300 ${
            level >= value
              ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]'
              : 'bg-gray-300'
          }`}
        />
      ))}
    </div>
    <span className="text-xs text-gray-700 font-black">
      {level}/5 clarity
    </span>
  </div>
)

const LightSourceCard = ({ source, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.06 }}
    className="group cursor-pointer"
  >
    <motion.div
      whileHover={{
        y: -8,
        scale: 1.02,
      }}
      transition={{ type: 'spring', stiffness: 280 }}
      className="bg-white rounded-2xl border-2 border-amber-200 p-6 h-full shadow-lg hover:shadow-xl hover:border-amber-400 transition-all duration-300 group"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-black text-xl mb-1 group-hover:text-amber-600 transition-colors duration-200">
            {source.name}
          </h3>
          <div className="text-xs text-gray-500 font-black">
            SPIN LEVEL:{' '}
            {index % 3 === 0 ? 'MAXIMUM' : index % 3 === 1 ? 'MODERATE' : 'MINIMAL'}
          </div>
        </div>

        {source.imageUrl ? (
          <motion.img
            whileHover={{ rotate: 5 }}
            src={source.imageUrl}
            alt={source.name}
            className="w-12 h-12 rounded-lg object-cover border-2 border-amber-200"
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-amber-100 border-2 border-amber-200 flex items-center justify-center">
            <span className="text-lg">🤨</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <div className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-black border border-amber-200">
          {source.tone || 'NEUTRAL'} SPIN
        </div>
        <div className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-black border border-red-200">
          FRAME: {source.frame || 'Unknown'}
        </div>
      </div>

      <p className="text-gray-600 leading-relaxed mb-4 text-sm">
        {source.summary?.slice(0, 140)}...
      </p>

      {source.url && (
        <motion.a
          whileHover={{ x: 4 }}
          href={source.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center text-amber-600 hover:text-amber-700 font-black text-sm group/link transition-colors duration-300"
        >
          SEE THE ORIGINAL SPIN
          <motion.span
            animate={{ x: [0, 4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="ml-2"
          >
            →
          </motion.span>
        </motion.a>
      )}
    </motion.div>
  </motion.div>
)


// ==================== MAIN COMPONENT ====================

// darkMode + setDarkMode come from App
const StoryView = ({ darkMode, setDarkMode }) => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [story, setStory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 1 = very blurry title, 5 = sharp
  const [focusLevel, setFocusLevel] = useState(5)

  // "Unspoken truth / composite focus" interpretation mode
  const [interpretationMode, setInterpretationMode] = useState('default')

  const getTitleBlur = () => {
    const blurAmount = Math.max(0, 20 - focusLevel * 4) // 1→16px, 5→0px
    return `blur(${blurAmount}px)`
  }

  // Helper: pick the right combined summary text based on dropdown
  const getCombinedSummaryText = () => {
    const combined = story?.combinedSummary || {}

    switch (interpretationMode) {
      case 'eli5':
        return combined.eli5 || combined.content || 'Multiple lenses combined to reveal the clearest possible version of events.'
      case 'oneSentence':
        return combined.oneSentence || combined.content || 'Multiple lenses combined to reveal the clearest possible version of events.'
      case 'dataOnly':
        return combined.dataOnly || combined.content || 'Multiple lenses combined to reveal the clearest possible version of events.'
      case 'political':
        return combined.politicalAngle || combined.content || 'Multiple lenses combined to reveal the clearest possible version of events.'
      case 'humanitarian':
        return combined.humanitarianAngle || combined.content || 'Multiple lenses combined to reveal the clearest possible version of events.'
      case 'default':
      default:
        return combined.content || 'Multiple lenses combined to reveal the clearest possible version of events.'
    }
  }

  useEffect(() => {
    if (!id) return

    if (storyCache.has(id)) {
      setStory(storyCache.get(id))
      setLoading(false)
      setError(null)
      return
    }

    const fetchStory = async () => {
      setLoading(true)
      setError(null)

      try {
        const res = await fetch(`http://localhost:3000/stories/${id}`)
        if (!res.ok) throw new Error('Failed to load story')
        const data = await res.json()

        storyCache.set(id, data)
        setStory(data)
      } catch (err) {
        console.error(err)
        setError('Could not load this story right now.')
      } finally {
        setLoading(false)
      }
    }

    fetchStory()
  }, [id])

  // ==================== DARK MODE RENDER ====================
  if (darkMode) {
    if (loading) {
      return (
        <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black flex items-center justify-center text-white">
          <DarkLensFlare />
          <DarkLoader />
        </div>
      )
    }

    if (error || !story) {
      return (
        <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black flex items-center justify-center text-white">
          <DarkLensFlare />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="text-6xl mb-4">📸</div>
            <h1 className="text-2xl font-light mb-4">Focus Lost</h1>
            <p className="text-slate-400 mb-8">
              This story appears to be out of frame.
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 border border-slate-600 text-white rounded-lg hover:bg-slate-800 transition-all duration-300"
            >
              Return to Gallery
            </button>
          </motion.div>
        </div>
      )
    }

    const sources = story.sources || []

    return (
      <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white">
        <DarkLensFlare />

        {/* Header styled like Landing dark header, with toggle INSIDE */}
        <motion.header
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed top-0 w-full z-40 bg-black/50 backdrop-blur-lg border-b border-white/10"
        >
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center space-x-3"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center">
                  <span className="text-xl">📸</span>
                </div>
                <div className="flex flex-col">
                  <h1 className="text-2xl font-light tracking-wider">
                    Skeptique
                  </h1>
                  <p className="text-xs text-white/60 font-light">
                    Story view
                  </p>
                  <button
                    onClick={() => navigate('/')}
                    className="flex items-center text-[11px] text-white/60 hover:text-white mt-1 transition-colors"
                  >
                    <span className="mr-1 text-sm">◀</span>
                    Back to topics
                  </button>
                </div>
              </motion.div>

              <div className="flex items-center gap-6">
                <DarkBiasControl level={focusLevel} onChange={setFocusLevel} />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setDarkMode(false)}
                  className="w-10 h-10 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center shadow-lg transition-colors duration-200"
                >
                  ☀️
                </motion.button>
              </div>
            </div>
          </div>
        </motion.header>

        <main className="pt-28 pb-16">
          {/* Hero Section */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto px-6 text-center mb-16"
          >
            <motion.h1
              className="text-4xl md:text-6xl font-light mb-6 leading-tight"
              style={{
                filter: getTitleBlur(),
                textShadow: '0 0 30px rgba(15,23,42,0.9)',
                transition: 'filter 0.4s ease',
              }}
            >
              {story.title || 'Untitled story'}
            </motion.h1>

            <div className="flex justify-center flex-wrap gap-2 mb-6">
              {story.tags?.map((tag, index) => (
                <motion.span
                  key={index}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4 + index * 0.08 }}
                  className="px-4 py-2 border border-slate-600 rounded-full text-xs font-light tracking-wider text-slate-200 hover:bg-slate-800/70 transition-all duration-300 cursor-pointer"
                >
                  #{tag}
                </motion.span>
              ))}
            </div>

            <p className="text-slate-300/90 max-w-2xl mx-auto text-sm md:text-base font-light">
              Bias level {focusLevel}/5 — Sharper Focus = a more biased lens.
            </p>
          </motion.section>

          {/* Combined Summary */}
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-4xl mx-auto px-6 mb-16"
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-slate-700 p-8 hover:border-blue-400/70 transition-all duration-400"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mr-4 border border-blue-400/50">
                    <span className="text-2xl">🔍</span>
                  </div>
                  <div>
                    <div className="text-xs text-blue-300 font-light tracking-wider mb-1">
                      WIDE ANGLE SUMMARY
                    </div>
                    <h2 className="text-2xl font-light">Composite Focus</h2>
                  </div>
                </div>

                {/* Unspoken truth / composite focus dropdown */}
                <div className="flex flex-col items-end gap-1 text-xs">
                  <span className="text-slate-400 uppercase tracking-widest">
                    UNSEEN FILTER
                  </span>
                  <select
                    value={interpretationMode}
                    onChange={(e) => setInterpretationMode(e.target.value)}
                    className="bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-[11px] text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="default">Default composite truth</option>
                    <option value="eli5">Explain it like I’m 5</option>
                    <option value="oneSentence">Summarize in one sentence</option>
                    <option value="dataOnly">Give me only the data</option>
                    <option value="political">Give me the political angle</option>
                    <option value="humanitarian">Give me the humanitarian angle</option>
                  </select>
                </div>
              </div>

              <p className="text-slate-100 leading-relaxed text-base md:text-lg font-light">
                {getCombinedSummaryText()}
              </p>
            </motion.div>
          </motion.section>

          {/* Sources Grid */}
          <section className="max-w-7xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center mb-10"
            >
              <div className="text-xs text-slate-400 font-light tracking-wider mb-1">
                MULTIPLE FOCAL LENGTHS
              </div>
              <h2 className="text-3xl font-light">Source Perspectives</h2>
              <p className="text-slate-400 text-sm mt-2">
                Each outlet brings a slightly different distortion.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sources.map((source, index) => (
                <DarkSourceCard key={source.id || index} source={source} index={index} />
              ))}
            </div>
          </section>

          {/* Blind Spots */}
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="max-w-4xl mx-auto px-6 mt-20"
          >
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="bg-red-500/10 backdrop-blur-xl rounded-2xl border border-red-500/30 p-8"
            >
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mr-4 border border-red-400/60">
                  <span className="text-2xl">🌫️</span>
                </div>
                <div>
                  <div className="text-xs text-red-300 font-light tracking-wider mb-1">
                    OUT OF FRAME
                  </div>
                  <h2 className="text-2xl font-light">Blind Spots</h2>
                </div>
              </div>

              <div className="space-y-3">
                {story.blindSpots?.items?.length ? (
                  story.blindSpots.items.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -18 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.08 }}
                      className="flex items-start p-3 rounded-lg bg-slate-900/70 border border-slate-700 hover:bg-slate-900 transition-all duration-300"
                    >
                      <span className="text-red-400 mr-3 mt-1">•</span>
                      <span className="text-slate-100 font-light text-sm">{item}</span>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-slate-400 text-center py-6 text-sm">
                    No obvious blind spots detected. Either this story is unusually honest, or we’re missing something.
                  </p>
                )}
              </div>
            </motion.div>
          </motion.section>
        </main>
      </div>
    )
  }

  // ==================== LIGHT MODE RENDER (Skeptiq) ====================

  if (loading) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-amber-50 to-red-50 flex items-center justify-center">
        <LightBackground />
        <LightLoader />
      </div>
    )
  }

  if (error || !story) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-amber-50 to-red-50 flex items-center justify-center">
        <LightBackground />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🤦‍♀️</span>
          </div>
          <h1 className="text-2xl font-black mb-4">Story Not Found</h1>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            This story appears to be missing from our archives. Maybe it was too truthful?
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-3 rounded-xl font-black transition-colors duration-200"
          >
            Back to Circus
          </button>
        </motion.div>
      </div>
    )
  }

  const sources = story.sources || []

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-amber-50 to-red-50 text-gray-900">
      <LightBackground />

      {/* Header styled like Landing light header, toggle INSIDE */}
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-40 backdrop-blur-lg border-b bg-white/80 border-amber-200"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <motion.div
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-500 shadow-lg">
                <span className="text-white font-black text-lg">🤨</span>
              </div>
              <div className="flex flex-col">
                <h1 className="font-black text-2xl bg-gradient-to-r from-amber-600 to-red-600 bg-clip-text text-transparent">
                  Skeptique
                </h1>
                <p className="text-xs text-gray-600">
                  Story view
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="flex items-center text-[11px] text-gray-500 hover:text-gray-800 mt-1 transition-colors"
                >
                  <span className="mr-1 text-sm">◀</span>
                  Back to topics
                </button>
              </div>
            </motion.div>

            <div className="flex items-center gap-4">
              <LightFocusControl level={focusLevel} onChange={setFocusLevel} />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setDarkMode(true)}
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 text-white flex items-center justify-center shadow-lg transition-colors duration-200"
              >
                🌙
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="pt-10 pb-16">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto px-6 text-center mb-16"
        >
          <h1
            className="text-4xl md:text-6xl font-black mb-6 leading-tight"
            style={{
              filter: getTitleBlur(),
              transition: 'filter 0.4s ease',
            }}
          >
            {story.title || 'Untitled story'}
          </h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex justify-center flex-wrap gap-2 mb-8"
          >
            {story.tags?.map((tag, index) => (
              <motion.span
                key={index}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6 + index * 0.08 }}
                className="px-4 py-2 border-2 border-amber-200 rounded-full text-xs font-black tracking-wider hover:bg-amber-100 transition-all duration-300 cursor-pointer"
              >
                #{tag}
              </motion.span>
            ))}
          </motion.div>

          <p className="text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed">
            Bias clarity:{' '}
            <span className="font-black text-amber-600">
              {focusLevel}/5
            </span>
            The higher the number, the more you assume everyone’s spinning it a little.
          </p>
        </motion.section>

        {/* Combined Summary */}
        <motion.section
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-4xl mx-auto px-6 mb-16"
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-2xl border-2 border-amber-200 p-8 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center mr-4 border-2 border-amber-400">
                  <span className="text-2xl">🔍</span>
                </div>
                <div>
                  <div className="text-xs text-amber-600 font-black tracking-wider mb-1">
                    REALITY CHECK
                  </div>
                  <h2 className="text-2xl font-black">The Unspun Truth</h2>
                </div>
              </div>

              {/* Unspoken truth dropdown */}
              <div className="flex flex-col items-end gap-1 text-xs">
                <span className="text-gray-500 uppercase tracking-widest">
                  UNPICK THE SPIN
                </span>
                <select
                  value={interpretationMode}
                  onChange={(e) => setInterpretationMode(e.target.value)}
                  className="bg-white border-2 border-amber-200 rounded-lg px-3 py-2 text-[11px] text-gray-800 font-black focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="default">Default reality check</option>
                  <option value="eli5">Explain it like I’m 5</option>
                  <option value="oneSentence">Summarize in one sentence</option>
                  <option value="dataOnly">Give me only the data</option>
                  <option value="political">Give me the political angle</option>
                  <option value="humanitarian">Give me the humanitarian angle</option>
                </select>
              </div>
            </div>

            <p className="text-gray-700 leading-relaxed text-base md:text-lg">
              {getCombinedSummaryText()}
            </p>
          </motion.div>
        </motion.section>

        {/* Sources Grid */}
        <section className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-12"
          >
            <div className="text-xs text-gray-600 font-black tracking-wider mb-2">
              WITNESS THE SPIN
            </div>
            <h2 className="text-3xl font-black mb-3">Media Perspectives</h2>
            <p className="text-gray-600 text-sm">
              Each outlet adds its own little twist to the narrative.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sources.map((source, index) => (
              <LightSourceCard
                key={source.id || index}
                source={source}
                index={index}
              />
            ))}
          </div>
        </section>

        {/* Blind Spots */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-4xl mx-auto px-6 mt-20"
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-red-50 rounded-2xl border-2 border-red-200 p-8 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center mr-4 border-2 border-red-400">
                <span className="text-2xl">🙊</span>
              </div>
              <div>
                <div className="text-xs text-red-600 font-black tracking-wider mb-1">
                  CONVENIENTLY IGNORED
                </div>
                <h2 className="text-2xl font-black">The Elephant in the Room</h2>
              </div>
            </div>

            <div className="space-y-3">
              {story.blindSpots?.items?.length ? (
                story.blindSpots.items.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -18 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.08 }}
                    className="flex items-start p-4 rounded-lg bg-white border border-red-200 hover:bg-red-50 transition-all duration-300"
                  >
                    <span className="text-red-500 mr-3 mt-1 text-lg">•</span>
                    <span className="text-gray-700 font-black text-sm">
                      {item}
                    </span>
                  </motion.div>
                ))
              ) : (
                <p className="text-gray-600 text-center py-6 text-sm font-black">
                  Even we couldn’t find what they’re ignoring. That’s either
                  really good or really bad.
                </p>
              )}
            </div>
          </motion.div>
        </motion.section>
      </main>
    </div>
  )
}

export default StoryView
