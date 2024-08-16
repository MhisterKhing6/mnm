/* 
controls user endpoints operations
*/
/*handles user controller functions */
const sha1 = require("sha1")
const  UserModel = require("../models/user.js")
const { sendEmailVerification, sendResetPassword } = require("../utils/EmailHandler.js")
const { generateSecretNumber, TwoHourPass } = require("../utils/VerificationFunctions.js")
const { VerifTokenModel } = require("../models/verifyToken.js")
const bcryptjs = require("bcryptjs")
class UserController  {


    
    //handle verification
    static sendVerificationNumber = async (req, res) => {
        /**
        * sendVerification : sends verification details to user email
        * @param {object} req: request object
        * @param {object} res: response
        */
       let userEmail = req.params.email
       try{
           //check if the user is registered
           let customer = await UserModel.findOne({email:userEmail})
           if(!customer)
               return res.status(401).json({"message": "user isn't registered"})
           //delete old verification entry
           await VerifTokenModel.deleteOne({"userId": customer._id.toString()})
           //generate verifcation entry and save
           let verficaitonDetails = {userId:customer._id.toString(), type:"password", verificationCode:generateSecretNumber()}
           let verificatonEntry = await new VerifTokenModel(verficaitonDetails).save()
           //check the type to determine the type of message to send
           sendResetPassword({email:customer.email, name:customer.name}, verficaitonDetails.verificationCode)
           //send verification id to user_id to user
           res.status(200).json({"verificationId":verificatonEntry._id.toString(), "userId":customer._id.toString()})
       }catch(err){
           console.log(err)
           res.status(501).json({"message": "internal server error"})
       }
   }

   static verify = async (req, res) => {
    /**
      * resetPassword : reset user passwords
      * @param {object} req: request object
      * @param {object} res: response
      */ 

    let verficationDetails = req.body    
     //check if all details fields are given
     if(!(verficationDetails.verificationId && verficationDetails.verificationCode))
          return res.status(400).json({"message": "fields missing"})
     try {
         //check for verification entry
         let verificationEntry = await VerifTokenModel.findById(verficationDetails.verificationId)
         if (!verificationEntry)
             return res.status(401).json({"message": "no verification entry found"})
         //check if token has expired
         if(TwoHourPass(verificationEntry.createdDate)) {
             //delete token entry
             await VerifTokenModel.deleteOne({_id: verificationEntry._id})
             return res.status(401).json({"message": "token expired"})
         }
         //check if user secrete number matches the one sent via email
         if(verficationDetails.verificationCode !== verificationEntry.verificationCode)
             return res.status(401).json({"message": "numbers dont match"})
         //update verification entry
         verificationEntry.verified = true
         await verificationEntry.save()
        
         return res.status(200).json({verificationId: verificationEntry._id.toString(), message:"success"})
         
     }catch(err) {
         console.log(err)
         res.status(501).json({"message": "internal server error"})
     }
 }

 static updatePassword = async (req, res) => {
    /**
     * updatePassword : update user passwords
     * @param {object} req: request object
     * @param {object} res: response
     */ 
    //update history
    let updateDetials = req.body
    //check if all user detials are given
    if(!(updateDetials.password && updateDetials.verificationId))
        return res.status(400).json({"message": "fields missing"})
    //check for verifcation database entry
    try {
        //check for verification entry
        let verificationEntry = await VerifTokenModel.findById(updateDetials.verificationId)
        if(!verificationEntry)
            return res.status(401).json({"message": "no verification entry found"})
        //check if user has verify and the type of verification is reset password
        if(!(verificationEntry.verified))
            return res.status(401).json({"message": "user not verfied"})
        //get and verify user
        let user = await UserModel.findById(verificationEntry.userId)
        if(!user)
            return await  res.status(401).json({"message": "user not registered"})
        //update user's password
        user.password = await bcryptjs.hash(updateDetials.password, 8)
        await user.save()
        //delete token entry
        await VerifTokenModel.deleteOne({_id:verificationEntry._id})
        //return response to user
        return res.status(200).json({id: user._id.toString() , "message": "password changed"})
    }catch(err) {
        console.log(err)
        res.status(501).json({"message": "internal server error"})
    }

}
}

module.exports = { UserController }
