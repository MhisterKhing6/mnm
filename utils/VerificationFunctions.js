
/**
 * handles common verification functions
 */

const generateSecretNumber = ()=> {
    /**
     * generateSecretNumber : generate a number to be sent to user email for verification
     * @returns: number
     */
    return Math.floor(100000 + Math.random()*9000 ).toString()
}

const TwoHourPass = (dateA) => {
    //get current date
    let dateNow = Date.now()
    //get date diff
    let hours = Math.abs(dateNow- dateA) / 36e5;

    if(hours > 2)
        return true
    return false
}

module.exports = {generateSecretNumber, TwoHourPass}

