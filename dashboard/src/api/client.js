import axios from "axios"

const api = axios.create({ baseURL: "/api" })

api.interceptors.request.use(config => {
    const token = localStorage.getItem("token")
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

api.interceptors.response.use(
    r => r.data,
    err => Promise.reject(err.response?.data || err)
)

export const auth = {
    register: (data) => api.post("/auth/register", data),
    login: (data) => api.post("/auth/login", data),
    me: () => api.get("/auth/me"),
}

export const bots = {
    list: () => api.get("/bots"),
    get: (id) => api.get(`/bots/${id}`),
    create: (data) => api.post("/bots", data),
    remove: (id) => api.delete(`/bots/${id}`),
    connect: (id, data) => api.post(`/bots/${id}/connect`, data || {}),
    disconnect: (id) => api.post(`/bots/${id}/disconnect`),
    logs: (id) => api.get(`/bots/${id}/logs`),
    blacklist: (id) => api.get(`/bots/${id}/blacklist`),
    addBlacklist: (id, number) => api.post(`/bots/${id}/blacklist`, { number }),
    removeBlacklist: (id, number) => api.delete(`/bots/${id}/blacklist/${number}`),
}

export const commands = {
    list: (botId) => api.get(`/bots/${botId}/commands`),
    toggle: (botId, name) => api.put(`/bots/${botId}/commands/${name}/toggle`),
    create: (botId, data) => api.post(`/bots/${botId}/commands`, data),
    update: (botId, name, data) => api.put(`/bots/${botId}/commands/${name}`, data),
    remove: (botId, name) => api.delete(`/bots/${botId}/commands/${name}`),
}

export const stats = {
    get: (botId) => api.get(`/bots/${botId}/stats`),
    overview: () => api.get("/bots/overview"),
}

export const config = {
    get: (botId) => api.get(`/bots/${botId}/config`),
    update: (botId, data) => api.put(`/bots/${botId}/config`, data),
    updateName: (botId, name) => api.put(`/bots/${botId}/name`, { name }),
}

export default api
