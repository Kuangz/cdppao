import api from ".";

/**
 * Fetches all layers.
 * @returns {Promise<AxiosResponse<any>>}
 */
export const getLayers = () => api.get("/layers");

/**
 * Fetches a single layer by its ID.
 * @param {string} id The ID of the layer.
 * @returns {Promise<AxiosResponse<any>>}
 */
export const getLayerById = (id) => api.get(`/layers/${id}`);

/**
 * Creates a new layer.
 * @param {object} layerData The data for the new layer.
 * @returns {Promise<AxiosResponse<any>>}
 */
export const createLayer = (layerData) => api.post("/layers", layerData);

/**
 * Updates an existing layer.
 * @param {string} id The ID of the layer to update.
 * @param {object} layerData The updated data for the layer.
 * @returns {Promise<AxiosResponse<any>>}
 */
export const updateLayer = (id, layerData) => api.put(`/layers/${id}`, layerData);

/**
 * Deletes a layer.
 * @param {string} id The ID of the layer to delete.
 * @returns {Promise<AxiosResponse<any>>}
 */
export const deleteLayer = (id) => api.delete(`/layers/${id}`);

/**
 * Imports a new layer from a KML file.
 * @param {FormData} formData The form data containing the KML file.
 * @returns {Promise<AxiosResponse<any>>}
 */
export const importLayer = (formData) => api.post("/layers/import", formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});
