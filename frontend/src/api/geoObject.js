import api from ".";

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
 * @param {object} geoObjectData The data for the new object.
 * @returns {Promise<AxiosResponse<any>>}
 */
export const createGeoObject = (geoObjectData) => api.post("/geoobjects", geoObjectData);

/**
 * Updates an existing geo-object.
 * @param {string} id The ID of the object to update.
 * @param {object} geoObjectData The updated data.
 * @returns {Promise<AxiosResponse<any>>}
 */
export const updateGeoObject = (id, geoObjectData) => api.put(`/geoobjects/${id}`, geoObjectData);

/**
 * Deletes a geo-object.
 * @param {string} id The ID of the object to delete.
 * @returns {Promise<AxiosResponse<any>>}
 */
export const deleteGeoObject = (id) => api.delete(`/geoobjects/${id}`);
