const {model, Schema } = require("mongoose");
const VerfiyTokenSchema = new Schema({
    userId :{type:String, required:true},
    verificationCode: {type:String, required:true},
    createdDate: {type:Date, default:Date.now},
    type: {type:String, required:true, enum: ['password', "email"]},
    verified: {type:Boolean, default:false}
})

//create a model
let VerifTokenModel = model("VerifyToken", VerfiyTokenSchema);

module.exports = {VerifTokenModel};
