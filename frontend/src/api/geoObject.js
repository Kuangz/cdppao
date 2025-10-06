import api from ".";


const SERVER_URL = import.meta.env?.VITE_IMAGE_URL || "http://localhost:5000";
console.log("Using SERVER_URL:", SERVER_URL);

/**
 * Fetches all geo-objects for a specific layer.
 * @param {string} layerId The ID of the layer.
 * @returns {Promise<AxiosResponse<any>>}
 */
export const getGeoObjectsByLayer = (layerId) => api.get(`/geoobjects`, { params: { layerId } });

/**
 * Fetches a single geo-object by its ID.
 * @param {string} id The ID of the geo-object.
 * @returns {Promise<AxiosResponse<any>>}
 */
export const getGeoObjectById = (id) => api.get(`/geoobjects/${id}`);

/**
 * Creates a new geo-object.
 * @param {FormData} formData The form data for the new object.
 * @returns {Promise<AxiosResponse<any>>}
 */
export const createGeoObject = (formData) => api.post("/geoobjects", formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});

/**
 * Updates an existing geo-object.
 * @param {string} id The ID of the object to update.
 * @param {FormData} formData The updated form data.
 * @returns {Promise<AxiosResponse<any>>}
 */
export const updateGeoObject = (id, formData) => api.put(`/geoobjects/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});

/**
 * Deletes a geo-object.
 * @param {string} id The ID of the object to delete.
 * @returns {Promise<AxiosResponse<any>>}
 */
export const deleteGeoObject = (id) => api.delete(`/geoobjects/${id}`);
