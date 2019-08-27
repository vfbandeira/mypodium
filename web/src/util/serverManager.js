import { server_url } from './constants'
import Axios from 'axios'


export default class ServerManager {

    static listMessages(createdBy, lesserThan, reaction, reactionBy, limit) {
        return new Promise(function (resolve, reject) {
            var query = "?createdBy=" + (createdBy ? createdBy : "") 
            query += "&lesserThan=" + (lesserThan ? lesserThan : "") 
            query += "&reaction=" + (reaction ? reaction : "")
            query += "&reactionBy=" + (reactionBy ? reactionBy : "")
            query += "&limit=" + (limit ? limit : "")
            ServerManager._get("v1/messages" + query).then(response => resolve(response)).catch((err) => reject(err))
        })
    }

    static _get(route) {
        return new Promise(function (resolve, reject) {
            Axios.get(server_url + "/api/" + route).then(response => 
                {
                    if (response && response.data) {
                        resolve(response.data)
                    } else {
                        resolve(null)
                    }
                }).catch((err) => reject(err))
        })
    }
}
