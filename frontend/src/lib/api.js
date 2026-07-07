import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API });

export const fetchReadings = () => api.get("/readings").then((r) => r.data);
export const fetchReading = (id) => api.get(`/readings/${id}`).then((r) => r.data);
export const fetchActivity = () => api.get("/activity").then((r) => r.data);

export const createReading = (formData) =>
    api.post("/readings", formData, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);

export const updateReading = (id, patch) => api.patch(`/readings/${id}`, patch).then((r) => r.data);
export const deleteReading = (id) => api.delete(`/readings/${id}`).then((r) => r.data);

export const generateChecklist = (id) => api.post(`/readings/${id}/checklist/generate`).then((r) => r.data);
export const fetchChecklist = (id) => api.get(`/readings/${id}/checklist`).then((r) => r.data);
export const toggleChecklist = (itemId, checked) => api.patch(`/checklist/${itemId}`, { checked }).then((r) => r.data);

export const generateNotes = (id) => api.post(`/readings/${id}/notes/generate`).then((r) => r.data);
export const fetchNotes = (id) => api.get(`/readings/${id}/notes`).then((r) => r.data);

export const createHighlight = (id, payload) => api.post(`/readings/${id}/highlights`, payload).then((r) => r.data);
export const fetchHighlights = (id) => api.get(`/readings/${id}/highlights`).then((r) => r.data);
export const deleteHighlight = (id) => api.delete(`/highlights/${id}`).then((r) => r.data);

export const generateQuiz = (id) => api.post(`/readings/${id}/quiz/generate`).then((r) => r.data);
export const fetchQuiz = (id) => api.get(`/readings/${id}/quiz`).then((r) => r.data);

export const fetchDueHighlights = () => api.get(`/revision/due`).then((r) => r.data);
export const fetchRevisionReadings = () => api.get(`/revision/readings`).then((r) => r.data);
export const reviewHighlight = (id, grade) => api.post(`/highlights/${id}/review`, { grade }).then((r) => r.data);

export const updateTags = (id, tags) => api.patch(`/readings/${id}/tags`, { tags }).then((r) => r.data);
export const generateCover = (id) => api.post(`/readings/${id}/cover/generate`).then((r) => r.data);
export const coverUrl = (id) => `${API}/readings/${id}/cover`;

export const fetchRecap = (year, month) => api.get(`/recap/${year}/${month}`).then((r) => r.data);
export const fetchRecapMonths = () => api.get(`/recap/months`).then((r) => r.data);

export const suggestHighlights = (id) => api.post(`/readings/${id}/highlights/suggest`).then((r) => r.data);
export const fetchAllTags = () => api.get(`/tags/all`).then((r) => r.data);
