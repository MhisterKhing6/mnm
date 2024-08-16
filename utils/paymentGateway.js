const paymentGateWay = async (apiEndpoint, data = null) => {
    /** 
     * accessPayment: get payment details
     */
    let url = "https://api.paystack.co" + apiEndpoint
  // Default options are marked with *
  try {
    const response = await fetch(url, {
        method: data ? "POST" : "GET", // *GET, POST, PUT, DELETE, etc.
        mode: "cors", // no-cors, *cors, same-origin
        cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
        credentials: "same-origin", // include, *same-origin, omit
        headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + "sk_test_1e8327a0f278bf0cf00342f5e853385bf71198f2"
        // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        redirect: "follow", // manual, *follow, error
        referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
        body: data ? JSON.stringify(data) : "", // body data type must match "Content-Type" header
    });
    return {data: await response.json(), status: response.status} ;
  }catch (err) {
      console.log(err)
      return {data: {"reason": "Network Error check ur internet"}, status: "errr"}    
    } // parses JSON response into native JavaScript objects
    
}

const getPaymentInfo = async (apiEndpoint) => {
  /** 
   * accessPayment: get payment details
   */
  let url = "https://api.paystack.co" + apiEndpoint
// Default options are marked with *
try {
  const response = await fetch(url, {
      method:"GET", // *GET, POST, PUT, DELETE, etc.
      mode: "cors", // no-cors, *cors, same-origin
      cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
      credentials: "same-origin", // include, *same-origin, omit
      headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + "sk_test_1e8327a0f278bf0cf00342f5e853385bf71198f2"
      },
      redirect: "follow", // manual, *follow, error
      referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
  });
  return {data: await response.json(), status: response.status} ;
}catch (err) {
    console.log(err)
    return {data: {"reason": "Network Error check ur internet"}, status: "errr"}    
  } // parses JSON response into native JavaScript objects
  
}

export { paymentGateWay,getPaymentInfo };

