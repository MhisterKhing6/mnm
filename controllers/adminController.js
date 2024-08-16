import moment from "moment"
import path from "path"
import { ActivitiesModel } from "../models/actitivities.js"
import { FoodModel } from "../models/food.js"
import { FoodCatModel } from "../models/foodCategories.js"
import { OrderItemModel } from "../models/orderItem.js"
import { OrderModel } from "../models/orders.js"
import { OrderPaymentModel } from "../models/payment.js"
import { UserModel } from "../models/user.js"
import { sendStatusInformation } from "../utils/EmailHandler.js"
import { generateFileUrl, saveUpolaodFileDisk } from "../utils/FileHandler.js"
import { erroReport } from "../utils/errors.js"


/** Handle admin funtions*/
class AdminController {
    /**
     * upload Food Category
     * @param {Object} req : http request object
     * @param {Object} res : http response object
     */
    static uploadFoodCategory = async (req, res) => {
        //get categories
        let categories = req.body.categories
        if(!categories)
            return erroReport(res, 400, "allFields")
        if(!(Array.isArray(categories) && categories.length !== 0))
            return erroReport(res, 400, null, "wrong type, categories must be a list and length shouldnt be zero")
        
        
        //form category object
        let catDb = []
        for (const cat of categories) {
            let checkIfAlready = await FoodCatModel.find({where: {name:cat}})
            if(!checkIfAlready)
                catDb.push({name:cat})
        }
        try {
            //save category object
        await FoodCatModel.insertMany(catDb)
        return res.status(200).json({"message": "categories added"})
        } catch(err) {
            console.log(err)
            return erroReport(res, 501, "internalE")
        }
    }

    /**
     * upload Food Category
     * @param {Object} req : http request object
     * @param {Object} res : http response object
     */
    static ViewFoodCategory = async (req, res) => {
        //get categories
        let categories = await FoodCatModel.find()//null or list
        let output = []
        for (const cat of categories) 
            {
                output.push({id:cat._id, name:cat.name})
            }
        return res.status(200).json(output)
    }

    /**
     * upload food into the database
     * @param {object} req: http request object 
     * @param {object} res: http respone object
     */
    static uploadFood = async (req, res) => {
        try {
            let foodDetails = req.body //{category:categoryId,description:description name ,url, fileName, size, special, day]}
            let food = null
            //logic for already uploaded foods
            if(foodDetails.name && foodDetails.size)
                food = await FoodModel.findOne({name:foodDetails.name, size:foodDetails.size}, {_id:0}).lean().select("-_id, -__v")
            //if no found is already uploaded ensure all fields are given
            if(!food) {
                if(!(foodDetails.size && foodDetails.price && foodDetails.url && foodDetails.description)) 
                    return erroReport(res, 400, "allFields")
            }
            //ensure if food is special day is given
            if(foodDetails.special && !foodDetails.day)
                return erroReport(res, 400, false, "wrong format. if food is special but day is null")

            //check if the save food size and price is already saved
            if(food && (food.size === foodDetails.size) && (food.price === foodDetails.price))
                return erroReport(res, 400, false, "food with the save entry already saved")
            //form food model
            let foodDb = null
            //food is already uploaded, create a new food model by using the uploaded food details
            //and replace just replace the details that is given
            if(food)
                foodDb = new FoodModel({...food, ...foodDetails})
            else{
                foodDb = new FoodModel(foodDetails)
                //image handling
                //get extension from file 
                let ext = path.extname(foodDetails.fileName)
                //generate unique file name with food id
                let fileName = foodDb._id.toString() + ext
                let base64 = foodDetails.url.split("base64,")[1]
                let data = await saveUpolaodFileDisk(fileName, base64)
                //check if image is successfully saved
                if(data) {
                    let url =  generateFileUrl(data.ulrPath)
                    foodDb.url = url
                    
                } else {
                    return res.status(501).json({"message": "cant saved image"})
                }
            }
            await foodDb.save()

            return res.status(200).json({"message": "food saved"})
            } catch(errror) {
                console.log(errror)
                return erroReport(res, 501, "internalE")
            }
    }

    static checkEntry = async (req, res) => {
        try {
            let name = req.body.name //{category:categoryId,description:description name ,url:urlOfPic, name:nana,sizes:[{name:larg, price:300},{name:medium, price:200}]}
            let entry = await FoodModel.findOne({name})
            return res.status(200).json({found:entry?true:false})
            } catch(error) {
                console.log(error)
                return erroReport(res, 501, "internalE")
            }
    }

    /**
     * upload food into the database
     * @param {object} req: http request object 
     * @param {object} res: http response object
     */
    static editFood = async (req, res) => {
        try {
            let foodDetails = req.body //{category:categoryId,description:description name ,url:urlOfPic, name:nana,sizes:[{name:larg, price:300},{name:medium, price:200}]}
            let acceptedKeys = ["size","special", "day", "price",'fileName', "name", "url", "description", "categoryId"]
            //check if all food fields are given
            if(foodDetails.id)
                return erroReport(res, 400, false, "id for food is required")
            let food = await FoodModel.findById(foodDetails.id)
            //check for entry and update according
            for(const key of Object.keys(foodDetails)) {
                if(key !=="id" && !acceptedKeys.includes(key))
                    return erroReport(res, 400, false, `the key ${key} is not accepted as a valid column`)
                if(key === "url") {
                    let ext = path.extname(foodDetails.fileName)
                    //generate unique file name with food id
                    let fileName = food._id.toString() + ext
                    let base64 = foodDetails.url.split("base64,")[1]
                    let data = await saveUpolaodFileDisk(fileName, base64)
                    //check if image is successfully saved
                    if(data) {
                        let url =  generateFileUrl(data.ulrPath)
                        //update food url
                        food.url= url
                    }
                }
                if(!(key === "url")) {
                    food[key] = foodDetails[key]
                }
                
            }
            await food.save()
            return res.status(200).json({"message": "success"})
            } catch(errror) {
                console.log(errror)
                return erroReport(res, 501, "internalE")
            }
    }


     /**
     * delete food from the database
     * @param {object} req: http request object 
     * @param {object} res: http respone object
     */
     static deleteFood = async (req, res) => {
        try {
            let foodId = req.params.id
            let food = await FoodModel.findByIdAndDelete(foodId)
            return res.status(200).json({message: "food successfuly deleted"})
            }
            catch(errror) {
                console.log(errror)
                return erroReport(res, 501, "internalE")
            }
    }

    /**
     * view foods 
     * @param {object} req: http request object 
     * @param {object} res: http respone object
     */
    static viewFoods = async (req, res) => {
        try {
            //get all object
            let response = await FoodModel.find().select("-__v, _id").lean()

            return res.status(200).json(response)
    }
    catch(error) {
        console.log(error)
        return erroReport(res, 501, false, "internalE")
        }
    }
/**
 * Get customers
 */

    static customers = async(req, res) => {
        let users = await UserModel.find({role:{$ne:"admin"}}).select("-__v").lean()
        let usersWithOrder = []
        for(const user of users) {
            let order = await OrderModel.findOne({"customerId": user._id}).lean()
            user.currentOrder = order
            usersWithOrder.push(user)
        }
        return res.status(200).json(usersWithOrder)
    }


/**
 * enable food for the week or day
 * @param {Object} req 
 * @param {Object} res 
 */
    static enableFood = async (req, res) => {
        //get enable status
        let details  = req.body
        try {
            //check if all food details are given
        if(!details.id)
            return erroReport(res, 400, 'allFields')
        //find food db entry
        let food = await FoodModel.findById(details.id)
        if (!food)
            return res.status(400).json({message: "food entry not found"})
        //else update food status
        food.enabled = details.status === "disable" ? false : true
        await food.save()
        return res.status(200).json({"message": "food status updated"})
    } catch(error) {
        console.log(error)
        return erroReport(res, 501, "internalE")
    }
  }

  static customerOrders = async (req, res) => {
    let startOfWeek = new Date(moment().clone().startOf("week").toISOString() )//get start of week
    let endOfWeek =  new Date(moment().clone().endOf("week").toISOString())
    let customers = await OrderModel.distinct("customerId",{$and:[{createdAt:{$lte:endOfWeek}},  {status: {$ne:"delivered"}}, {createdAt: {$gte:startOfWeek}}]})
    const customerInfo = []
    //get the total amount
    for (const customer of customers) {
        let cus = await UserModel.findById(customer)
        let customers = await OrderModel.find({$and:[{customerId:cus}, {createdAt:{$lte:endOfWeek}},  {status: {$ne:"delivered"}}, {createdAt: {$gte:startOfWeek}}]}).lean()
        //add all the marks
        let price = 0
        let date = null
        for (const cs of customers) {
            price += cs.totalPrice
            date = cs.createdAt
        }
        customerInfo.push({"email": cus.email,"name": cus.name, "id":cus.id, price, date })
    }
    return res.status(200).json(customerInfo)
}
static orderDetails = async (req, res) => {
    let customerId = req.params.id
    let startOfWeek = new Date(moment().clone().startOf("week").toISOString() )//get start of week
    let endOfWeek =  new Date(moment().clone().endOf("week").toISOString())
    let orders = await OrderModel.find({$and:[{createdAt:{$lte:endOfWeek}}, {customerId},  {status: {$ne:"delivered"}}, {createdAt: {$gte:startOfWeek}}]}).lean()
    let ordersWithItem = []
    for(const order of orders) {
        let orderItems = await OrderItemModel.find({orderId:order._id}).select("name quantity size price").lean()
        order.items = orderItems
        ordersWithItem.push(order)
    }
    return res.status(200).json(ordersWithItem)
}
  
  static viewOrders = async (req, res) => {
    //returns all orders that falls in a week
    let startOfWeek = new Date(moment().clone().startOf("week").toISOString() )//get start of week
    let endOfWeek =  new Date(moment().clone().endOf("week").toISOString())
    //check if created date is greater or equal to start of week date but lesser or equals end of week date
    const orders = await OrderModel.find({$and:[{createdAt:{$lte:endOfWeek}}, {createdAt: {$gte:startOfWeek}}]}).lean().select("-__v")
    //orders
    let returnOrder = []
    //get user name
    for (const order of orders) {
        let customer = await UserModel.findById(order.customerId).select("name").lean()
        returnOrder.push({...order, name:customer.name})
    }
    return res.status(200).json(returnOrder)
  }

  static statistics = async (req, res) => {
    const duration = req.params.duration
    if(!["day", "week", "month", "year", "lifetime"].includes(duration))
        return res.status(400).json({"message": "wrong format, expected durations are day, week, month, year, all"})
    let  start = null
    let  end = null
    if(duration === "day") {
        start = new Date(moment().startOf("day").toISOString() )//get start of week
        end =  new Date(moment().endOf("day").toISOString())
    }else if(duration === "week") {
         start = new Date(moment().startOf("week").toISOString() )//get start of week
         end = new Date(moment().endOf("week").toISOString())
    } else if(duration === "month"){
            start = new Date(moment().startOf("month").toISOString() )//get start of week
            end   =  new Date(moment().endOf("month").toISOString())
        } else if (duration === "year") {
            start = new Date(moment().startOf("year").toISOString() )//get start of week
            end = new Date(moment().endOf("year").toISOString())
        }
    //check if duration is lifetime return all order entry
    let query =  duration === "lifetime" ? {} : {$and:[{expectedDate:{$gte:start}}, {expectedDate:{$lte:end}}, {status:{$nin: ["delivered", "cancelled"]}}]}
   
    let dataSetOrder = await OrderModel.find(query).select("_id, totalPrice").lean()
    
    let totalSales = 0
    for (const order of dataSetOrder) {
        totalSales += order.totalPrice
    }
    let totalOrders = dataSetOrder.length
    let averageSales = totalOrders === 0 ? 0 : totalSales / totalOrders
    //return response
    let response = {totalSales, averageSales, totalOrders}
    console.log(start)
    console.log(end)
    return res.status(200).json(response)
  }

  
  /*static history = async (req, res) => {
    //get all the history
    let pattern = await OrderModel.find().
  } */

 static updateOrder = async (req, res) => {
    let details = req.body
    if(!(details.orderId && details.status))
        return res.status(400).json({"message": "endpoint require orderId and status"})
    let order = await OrderModel.findById(details.orderId)
    if(!order)
        return res.status(400).json({"message": "wrong order id"})
    if(!["preparing", "on delivery", "cancelled", "delivered"].includes(details.status))
        return res.status(400).json({"message":"wrong status"})
    order.status = details.status
    await order.save()
    let user = await UserModel.findById(order.customerId).lean()
    sendStatusInformation(user, order._id.toString(), order.day,order.status )
    return res.status(200).json({"message": "status updated"})
 }

 static searchOrder = async (req, res) => {
    let details = req.body
    let order = []
    if(details.pattern){
        let user = await UserModel.findOne({name:{"$regex": details.pattern, "$options": "i"}})
        if(user)
            order = await OrderModel.find({status:{$ne:"delivered"}, customerId:user._id})
    }
    return res.status(200).json(order)
 }

 static recentActivities = async (req, res) => {
    let activityItems = await ActivitiesModel.find().sort({"date": -1}).lean()
    return res.status(200).json(activityItems)
    }

 static paymentHistory = async (req, res) => {
    //check if there are details
    let query = req.query
    let filter = {}
    if(query.name) {
        ///"process name"
        let userId = await UserModel.findOne({name:query.name}).select("_id")
        if(userId) {
            filter.customerId = userId._id
        }

    }
    //get order that are payed or cancelled
    let orders = await OrderModel.find(filter).populate({path:"paymentId", select:'status date payedAmount mode'}).sort({createdAt: -1}).lean()
    let fOutput = []
    for(const order of orders) {
        let user = await UserModel.findById(order.customerId).select("name")
        order.name = user.name
        fOutput.push(
            {"name": user.name, "orderId": order._id, "paymentMode": order.paymentId.mode,
             "amount": order.totalPrice, paymentStatus:order.paymentId.status, orderStatus:order.status,
             "orderCreatedDate": order.createdAt, "paymentDate": order.paymentId.date
            })
    }
    return res.status(200).json(fOutput)
    }


    static cashPayments = async (req, res) => {
        let orders = await OrderPaymentModel.find({$and:[{mode:"cash"}, {status:{$ne:'payed'}}]}).populate("customerId").lean()
        let ordersName = []
        for(const cash of orders) {
            ordersName.push({status:cash.status,mode:cash.mode, paymentId:cash._id,amount:cash.expectedAmount, name:cash.customerId.name, date:cash.createdAt})
        }
        return res.status(200).json(ordersName)
    }

    static changePaymentStatus = async (req, res) => {
        let paymentStatus = req.body
        if(!(paymentStatus.paymentId && paymentStatus.status)) 
            return res.status(200).json({message:"not all fields given"})
        let payment = await OrderPaymentModel.findById(paymentStatus.paymentId)
        if(!payment)
            return res.status(400).json({"message": "wrong payment id"})
        payment.status = paymentStatus.status
        await payment.save()
        return res.status(200).json({"message": "payment status changed"})
    }

    static orderDetailsHistory = async (req, res) => {
        let orderId = req.params.orderId
        let order = await OrderModel.findById(orderId).populate("customerId").lean()
        let orderItems = await OrderItemModel.find({orderId}).select("name size unitPrice quantity").lean()
        return res.status(200).json({orderId:order._id, customerName: order.customerId.name, price:order.totalPrice, items:orderItems})
    }


 }


export { AdminController }
