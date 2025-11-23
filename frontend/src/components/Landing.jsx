import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

// dark mode background
const DarkLensFlare = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
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

const DarkApertureCard = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
    transition={{ duration: 0.8, delay }}
    whileHover={{ scale: 1.05, transition: { duration: 0.3 } }}
    className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-500 cursor-pointer"
  >
    {children}
  </motion.div>
)

// light mode background
const LightBackground = () => (
  <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-amber-50 to-red-50" />
)

const LightCard = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
    whileHover={{
      y: -8,
      scale: 1.02,
      transition: { type: 'spring', stiffness: 300 },
    }}
    className="bg-white rounded-2xl border-2 border-amber-200 p-6 cursor-pointer shadow-lg hover:shadow-xl hover:border-amber-400 transition-all duration-300 group"
  >
    {children}
  </motion.div>
)

// ⬇️ darkMode + setDarkMode now come from App as props
const Landing = ({ darkMode, setDarkMode }) => {
  const navigate = useNavigate()
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [focus, setFocus] = useState(1)

  // fetch topics ONCE (no refetch when toggling dark mode)
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

  // focus animation only when entering dark mode
  useEffect(() => {
    if (!darkMode) {
      setFocus(1)
      return
    }

    setFocus(1)
    const t1 = setTimeout(() => setFocus(2), 300)
    const t2 = setTimeout(() => setFocus(3), 600)
    const t3 = setTimeout(() => setFocus(4), 900)
    const t4 = setTimeout(() => setFocus(5), 1200)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
    }
  }, [darkMode])

  const handleTopicClick = (id) => {
    // theme is global now, no need to pass via navigate state
    navigate(`/stories/${id}`)
  }

  const getBlurStyle = (baseBlur) => {
    const blurAmount = Math.max(0, baseBlur - focus * 2)
    return `blur(${blurAmount}px)`
  }

  // ---------- DARK MODE ----------
  if (darkMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
        <DarkLensFlare />

        {/* header with toggle INSIDE it, no blur */}
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
                <div>
                  <h1 className="text-2xl font-light tracking-wider">
                    Skeptique
                  </h1>
                  <p className="text-xs text-white/60 font-light">
                    A clearer view through every lens
                  </p>
                </div>
              </motion.div>

              <div className="flex items-center gap-6">
                <div className="text-right hidden sm:block">
                  <div className="text-xs text-white/60 font-light tracking-wider">
                    FOCUS
                  </div>
                  <div className="text-sm">f/{focus}.8</div>
                </div>

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

        {/* hero */}
        <main className="pt-28 pb-20">
          <motion.section
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            transition={{ duration: 1.2 }}
            className="max-w-4xl mx-auto px-6 text-center mb-20"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="inline-flex items-center rounded-full bg-dark px-4 py-2 text-sm font-black text-white mb-8 border-2 border-white/20"
            >
              ⚡ Built at HackWestern • held together by caffeine
            </motion.div>
            <motion.h1
              className="text-6xl md:text-8xl font-light tracking-tight mb-6"
              style={{
                textShadow: '0 0 50px rgba(255,255,255,0.2)',
                filter: getBlurStyle(12),
                transition: 'filter 0.4s ease',
              }}
            >
              REFOCUS
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl md:text-2xl text-white/70 font-light max-w-2xl mx-auto leading-relaxed mb-10"
              style={{ filter: getBlurStyle(6), transition: 'filter 0.4s ease' }}
            >
              Adjust your lens until the story becomes clear.
              <span className="block mt-2 text-white/50 text-lg">
                Multiple sources, one truth.
              </span>
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex justify-center space-x-4"
            >
              {[0, 0.2, 0.4].map((delay) => (
                <motion.div
                  key={delay}
                  animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, delay }}
                  className="w-2 h-2 bg-white rounded-full"
                />
              ))}
            </motion.div>
          </motion.section>

          {/* topics */}
          <section className="max-w-6xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="text-center mb-16"
            >
              <div className="text-sm text-white/60 font-light tracking-wider mb-2">
                SELECT FOCAL POINT
              </div>
              <h2 className="text-3xl font-light mb-4">Current Stories</h2>
              <p className="text-white/60 max-w-xl mx-auto">
                Choose a story to adjust the focus and see through different
                lenses.
              </p>
            </motion.div>

            {loading && (
              <div className="flex justify-center items-center py-20">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full"
                />
              </div>
            )}

            {error && !loading && (
              <DarkApertureCard>
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">❌</div>
                  <h3 className="text-xl font-light mb-2">Focus Error</h3>
                  <p className="text-white/60">{error}</p>
                </div>
              </DarkApertureCard>
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
                    transition: { staggerChildren: 0.1 },
                  },
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
                        transition: { duration: 0.6 },
                      },
                    }}
                  >
                    <DarkApertureCard delay={index * 0.1}>
                      <div
                        onClick={() => handleTopicClick(topic.id)}
                        className="h-full"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="text-xl font-light leading-tight pr-4 group-hover:text-blue-300 transition-colors duration-500">
                            {topic.title}
                          </h3>
                          <div className="px-3 py-1 bg-white/10 rounded-full text-xs font-light border border-white/20 shrink-0">
                            8 LENSES
                          </div>
                        </div>

                        <p className="text-white/60 text-sm mb-4 leading-relaxed font-light">
                          Multiple perspectives available for analysis.
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
                    </DarkApertureCard>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </section>

          {/* how it works */}
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto px-6 mt-32"
          >
            <DarkApertureCard>
              <div className="text-center mb-12">
                <h2 className="text-3xl font-light mb-6">How Refocus Works</h2>
                <p className="text-white/60 max-w-2xl mx-auto font-light">
                  We pull the same story from different outlets so you can see
                  how the framing shifts.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    emoji: '🎯',
                    title: 'Pick a story',
                    desc: 'Choose a topic that everyone is arguing about.',
                  },
                  {
                    emoji: '🔍',
                    title: 'Compare lenses',
                    desc: 'Scroll through how each outlet frames the same facts.',
                  },
                  {
                    emoji: '📊',
                    title: 'Spot the gaps',
                    desc: 'See what’s emphasized, downplayed, or missing.',
                  },
                ].map((item, i) => (
                  <motion.div
                    key={i}
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
            </DarkApertureCard>
          </motion.section>
        </main>
      </div>
    )
  }

  // ---------- LIGHT MODE ----------
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-red-50 text-gray-900">
      <LightBackground />

      {/* header with toggle INSIDE it */}
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
              <div>
                <h1 className="font-black text-2xl bg-gradient-to-r from-amber-600 to-red-600 bg-clip-text text-transparent">
                  Skeptique
                </h1>
                <p className="text-xs text-gray-600">
                  You don’t need trust issues. Just better context.
                </p>
              </div>
            </motion.div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-sm text-gray-600">
                Spin it your way.
              </div>
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

      {/* main content */}
      <main className="max-w-6xl mx-auto px-6">
        {/* hero */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center py-20 md:py-28"
        >
          <div className="max-w-4xl mx-auto">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="inline-flex items-center rounded-full bg-amber-100 px-4 py-2 text-sm font-black text-amber-700 mb-8 border-2 border-amber-300"
            >
              ⚡ Built at HackWestern • held together by caffeine
            </motion.div>
            <h1 className="text-5xl md:text-7xl font-black mb-8 leading-tight">
              See the
              <span className="block bg-gradient-to-r from-amber-600 to-red-600 bg-clip-text text-transparent">
                spin cycle
              </span>
            </h1>
            <p className="text-xl md:text-2xl leading-relaxed max-w-3xl mx-auto mb-8">
              Every outlet has an angle. We show you{' '}
              <span className="font-black text-amber-600">all of them</span> —
              plus what they quietly leave out.
            </p>
          </div>
        </motion.section>

        {/* topics */}
        <section className="py-16">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-black mb-6"
            >
              Choose your{' '}
              <span className="bg-gradient-to-r from-amber-600 to-red-600 bg-clip-text text-transparent">
                topic
              </span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl max-w-2xl mx-auto text-gray-600"
            >
              Pick an issue and watch how the story bends depending on who’s
              telling it.
            </motion.p>
          </div>

          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-center items-center py-20"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full mr-4"
              />
              <p className="text-lg text-gray-600">Loading stories…</p>
            </motion.div>
          )}

          {error && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">🤦‍♀️</span>
              </div>
              <h3 className="text-2xl font-black mb-4">Something broke</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">{error}</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.reload()}
                className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-3 rounded-xl font-black transition-colors duration-200"
              >
                Try again
              </motion.button>
            </motion.div>
          )}

          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
              {topics.map((topic, index) => (
                <motion.div
                  key={topic.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <LightCard delay={index * 0.1}>
                    <div
                      onClick={() => handleTopicClick(topic.id)}
                      className="h-full"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="font-black text-xl leading-tight pr-4 group-hover:text-amber-600 transition-colors duration-200">
                          {topic.title}
                        </h3>
                        <motion.div
                          whileHover={{ rotate: 360 }}
                          className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-black shrink-0"
                        >
                          8 spins
                        </motion.div>
                      </div>

                      <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                        See how {topic.sources || 'several'} outlets handle the
                        same story.
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {topic.tags?.slice(0, 3).map((tag, i) => (
                          <motion.span
                            key={i}
                            whileHover={{ scale: 1.1 }}
                            className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors duration-200"
                          >
                            #{tag}
                          </motion.span>
                        ))}
                        {topic.tags?.length > 3 && (
                          <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black bg-gray-100 text-gray-500">
                            +{topic.tags.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  </LightCard>
                </motion.div>
              ))}
            </div>
          )}

          {/* how it works (light) */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl border-2 p-12 max-w-5xl mx-auto bg-white border-amber-200 shadow-2xl"
          >
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black mb-6">
                What Skeptique actually does
              </h2>
              <p className="text-xl max-w-2xl mx-auto text-gray-600">
                We pull the story apart so you can put your own judgment back
                together.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                {
                  emoji: '🎯',
                  title: 'Pick a topic',
                  desc: 'Choose from the stories everyone is yelling about.',
                },
                {
                  emoji: '🔍',
                  title: 'Compare coverage',
                  desc: 'Read how each outlet frames the same event.',
                },
                {
                  emoji: '🙈',
                  title: 'Find the gaps',
                  desc: 'See what most of them leave out of the frame.',
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  whileHover={{ y: -10, scale: 1.05 }}
                  className="text-center group"
                >
                  <motion.div
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.5 }}
                    className="w-20 h-20 bg-gradient-to-br from-amber-400 to-red-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-shadow duration-300"
                  >
                    <span className="text-3xl">{item.emoji}</span>
                  </motion.div>
                  <h3 className="font-black text-2xl mb-4 text-gray-900">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="text-center mt-12 pt-8 border-t border-gray-200"
            >
              <p className="text-sm text-gray-400">
                ⚠️ Warning: May cause decreased trust in media. We consider this
                a feature.
              </p>
            </motion.div>
          </motion.div>
        </section>
      </main>
    </div>
  )
}

export default Landing
