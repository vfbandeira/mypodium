var userBlockstackData = (function() {
    var reactionsBuffer = {};
    var usersBlockstackProfile = {};
    var loggedUser = null;
    function _getProfile(username) {
        if (usersBlockstackProfile[username]) {
            return usersBlockstackProfile[username];
        } else {
            return null;
        }
    };
    function _setProfile(username, value) {
        usersBlockstackProfile[username] = value;
    };
    function _setUser(value) {
        loggedUser = value;
    };
    function _getUser() {
        return loggedUser;
    };
    function _setReaction(name, value) {
        reactionsBuffer[name] = value;
    };
    function _getReaction(name) {
        if (reactionsBuffer[name]) {
            return reactionsBuffer[name];
        } else {
            return null;
        }
    };
    return { 
        getProfile: _getProfile, 
        setProfile: _setProfile,
        setUser: _setUser,
        getUser: _getUser,
        setReaction: _setReaction,
        getReaction: _getReaction
    };  
 })(); 