import { AppConfig } from 'blockstack'

export const appConfig = new AppConfig(['store_write', 'publish_data', 'email'])
export const server_url = process.env.REACT_APP_SERVER_API