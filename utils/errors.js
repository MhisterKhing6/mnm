/**Tracks common errors  hppt errors user, and developer errors*/

const errorsMessage = {
    "unAuth":{"message": "user not authorized"},
    "notRegistered": {"message": "user is not registered"},
    "allFields": {"message": "not all fields given"},
    "notFound": {"message": "user with the given not found"},
    "notLogin": {"message": "user hasn't login"},
    "alregistered": {"message": "already registered"},
    "internalE": {"message": "internal error contanct admin"},
    "wrongPassword": {"message": "wrong password"},
    "expiredSess": {"message": "session expired"},
    "catNotFound": {"message": "category entry not found"}
}

const erroReport = (res, status, key=null, message=null) => {
    let body = key ? errorsMessage[key] : message
    return res.status(status).json(body)
}

export {erroReport}