const isDev = import.meta.env.DEV

export const API_URL = isDev
  ? 'http://localhost:3000/nodejsapp'
  : 'https://www.ludov.ca/nodejsapp' 

export const CLOUD_NAME = "drlryvrl2";

