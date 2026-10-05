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
export const saveUserNotes = (id, content) => api.put(`/readings/${id}/notes`, { content }).then((r) => r.data);

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
export const pdfUrl = (id) => `${API}/readings/${id}/pdf`;
export const fetchReadingContent = (id) => api.get(`/readings/${id}/content`).then((r) => r.data);

export const fetchRecap = (year, month) => api.get(`/recap/${year}/${month}`).then((r) => r.data);
export const fetchRecapMonths = () => api.get(`/recap/months`).then((r) => r.data);

export const suggestHighlights = (id) => api.post(`/readings/${id}/highlights/suggest`).then((r) => r.data);
export const fetchAllTags = () => api.get(`/tags/all`).then((r) => r.data);

export const toggleLike = (id, liked) => api.patch(`/readings/${id}`, { liked }).then((r) => r.data);
export const updateStatus = (id, patch) => api.patch(`/readings/${id}`, patch).then((r) => r.data);

// Lists
export const fetchLists = () => api.get("/lists").then((r) => r.data);
export const fetchList = (id) => api.get(`/lists/${id}`).then((r) => r.data);
export const createList = (payload) => api.post("/lists", payload).then((r) => r.data);
export const updateList = (id, patch) => api.patch(`/lists/${id}`, patch).then((r) => r.data);
export const deleteList = (id) => api.delete(`/lists/${id}`).then((r) => r.data);
export const addReadingToList = (listId, readingId) => api.post(`/lists/${listId}/readings`, { reading_id: readingId }).then((r) => r.data);
export const removeReadingFromList = (listId, readingId) => api.delete(`/lists/${listId}/readings/${readingId}`).then((r) => r.data);

// Wishlist
export const fetchWishlist = () => api.get("/wishlist").then((r) => r.data);
export const createWishlist = (formData) => api.post("/wishlist", formData, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);
export const updateWishlist = (id, patch) => api.patch(`/wishlist/${id}`, patch).then((r) => r.data);
export const deleteWishlist = (id) => api.delete(`/wishlist/${id}`).then((r) => r.data);
export const convertWishlistToReading = (id, status = "reading") => api.post(`/wishlist/${id}/convert?status=${status}`).then((r) => r.data);

// Import: links & book catalog search
export const previewUrl = (url) => api.post("/import/url", { url }).then((r) => r.data);
export const searchBooks = (q, limit = 12) => api.get("/books/search", { params: { q, limit } }).then((r) => r.data);
export const fetchBook = (bookId) => api.get(`/books/${encodeURIComponent(bookId)}`).then((r) => r.data);
