import React, { createContext, useContext } from "react";
import useCurrentLocation from "../hooks/useCurrentLocation";

const LocationContext = createContext();

export const useLocation = () => useContext(LocationContext);

export const LocationProvider = ({ children }) => {
    const {
        location,
        locating,
        error,
        getCurrentLocation,
    } = useCurrentLocation();

    return (
        <LocationContext.Provider
            value={{ location, locating, error, getCurrentLocation }}
        >
            {children}
        </LocationContext.Provider>
    );
};
