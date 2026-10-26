import axios from 'axios'
const BASE = 'http://localhost:8080/api'
export const registerUser      = (d)     => axios.post(`${BASE}/users/register`, d)
export const loginUser         = (d)     => axios.post(`${BASE}/users/login`, d)
export const getTransactions   = (uid)   => axios.get(`${BASE}/transactions/user/${uid}`)
export const addTransaction    = (d)     => axios.post(`${BASE}/transactions`, d)
export const updateTransaction = (id, d) => axios.put(`${BASE}/transactions/${id}`, d)
export const deleteTransaction = (id)    => axios.delete(`${BASE}/transactions/${id}`)
export const getSummary        = (uid)   => axios.get(`${BASE}/transactions/summary/${uid}`)

// Currency API (free)
export const getExchangeRates  = () =>
  axios.get('https://api.exchangerate-api.com/v4/latest/INR')
