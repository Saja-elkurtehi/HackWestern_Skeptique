const API_BASE_URL =
  import.meta.env.MODE === 'production'
    ? 'https://skeptique-hht6.onrender.com'
    : 'http://localhost:3000'

export default API_BASE_URL
