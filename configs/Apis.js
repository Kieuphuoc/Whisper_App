const BASE_URL = "https://64a7-14-169-26-201.ngrok-free.app/";
import axios from "axios";

export const endpoints = {
    'event': '/event/',
    'category': '/category/',
    'review': (event_id) => `/event/${event_id}/reviews/`,
}

export const authApis = (token) => {
    return axios.create({
        baseURL: BASE_URL,
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
}


export default axios.create({
    baseURL: BASE_URL
})