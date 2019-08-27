import {  
    getFile,
    putFile,
    deleteFile,
    lookupProfile,
    Person
} from 'blockstack'
import uuidv4 from 'uuid/v4'


export default class BlockstackManager {

    static getUserProfile (username) {
        return new Promise(function (resolve, reject) {
            var storedUserData = window && window["userBlockstackData"] && window["userBlockstackData"].getProfile ? window["userBlockstackData"].getProfile(username) : null
            if (storedUserData) {
                resolve(storedUserData)
            } else {
                lookupProfile(username).then((profile) => 
                {
                    if (profile) {
                        var person = new Person(profile)
                        var userData = { username: username, name: person.name(), avatarUrl: person.avatarUrl() }
                        if (window && window["userBlockstackData"] && window["userBlockstackData"].setProfile) {
                            window["userBlockstackData"].setProfile(username, userData)
                        }
                        resolve(userData)
                    } else {
                        resolve()
                    }
                }).catch((err) => reject(err))
            }
        })
    }

    static storeAudio (audioBuffer) {
        return new Promise(function (resolve, reject) {
            const fileName = BlockstackManager._generateUUID()
            putFile(fileName, audioBuffer, { encrypt: false }).then(() => resolve(fileName)).catch((err) => reject(err))
        })
    }

    static getAudio (contentId, username) {
        return new Promise(function (resolve, reject) {
            var options = { decrypt: false }
            if (username) {
                options["username"] = username
            }
            getFile(contentId, options).then((file) => 
            {
                if (file) {
                    resolve(file)
                } else {
                    resolve()
                }
            }).catch((err) => reject(err))
        })
    }
    
    static _generateUUID () { 
        return uuidv4()
    }

    static deleteAudio (contentId) {
        return new Promise(function (resolve, reject) {
            deleteFile(contentId).then(() => 
            {
                resolve()
            }).catch((err) => reject(err))
        })
    }
}
