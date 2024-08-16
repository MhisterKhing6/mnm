import { OrderModel } from "../models/orders.js"
import { OrderPaymentModel } from "../models/payment.js"
import { getPaymentInfo, paymentGateWay } from "../utils/paymentGateway.js"
import { ActivitiesModel } from "../models/actitivities.js"
class PaymentController {

    static startPayment = async (req, res) => {
        //initialize payment
        //get order id
        let orderId = req.params.orderId
        // retrieve order information in the database
        let orderDetails = await OrderModel.findById(orderId).lean()
        if(!orderDetails)
            return res.status(400).json({"message": "no order entry saved for particular order"})
        //initialize payments
        let peswAmount = orderDetails.totalPrice * 100
        //get user email
        let email = req.user.email
        //use order id as refrence
        let reference = orderId
        //callback url will be given at the front end
        let callbackUrl = '' //not implemented now
        //form initize payment object callback url will be given
        let initData = {email, amount:peswAmount}
        //initialize the payment gateway
        let response = await paymentGateWay("/transaction/initialize", initData)
        //check status
        if(response.status !== 200)
            return res.status(501).json({"message":"server side error"})

        //update payment data with the reference number, transaction code and url
        let payment = await OrderPaymentModel.findOne({orderId})
        payment.reference = response.data.data.reference
        payment.accessCode = response.data.data.access_code
        payment.urlPayment = response.data.data.authorization_url
        //save payment info
        await payment.save()
        return res.status(200).json(response.data.data)

    }

    static checkTransaction = async (req, res) => {
        //verify payment
        //get orderId to verify transaction
        let reference = req.params.reference
        //get order
        let payment = await OrderPaymentModel.findOne({reference})
        if(!payment) {
            return res.status(400).json({"message": "wrong reference number id"})
        }
        //check to see if transaction has refrence
        let status = null;
        if(payment.mode !== "online"){
            status = payment.status
        }
        else {
            //check payment details
            let url = "/transaction/verify/" + payment.reference 
            let response = await getPaymentInfo(url)
            if(response.status !== 200)
                return res.status(501).json({"message": "server side error"})
            if(response.data.data.status === "success" && (payment.expectedAmount*100 <= response.data.data.amount)) {
                payment.status = "payed"
                let activity = new ActivitiesModel({message: `${req.user.name} pays GH:${payment.expectedAmount}`, customerName:req.user.name})
                await activity.save()
            }
            if(response.data.data.status !== "success") {
                payment.status = response.data.data.status
            }
            payment.payedAmount = (response.data.data.amount / 100)
            status = payment.status
            await payment.save()
        }
         return res.status(200).json({status:status})
    }
}

export { PaymentController }
