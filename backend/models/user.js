const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

    name:{
        type:String,
        required:true
    },

    email:{
        type:String,
        required:true,
        unique:true
    },

    phone:{
        type:String,
        required:true
    },

    address:{
        type:String,
        required:true
    },

    buildingType:{
        type:String,
        required:true
    },

    userType:{
        type:String,
        required:true
    },

    password:{
        type:String,
        required:true
    },

    paymentStatus:{
        type:String,
        default:"Not Paid"
    }

},{
    timestamps:true
});

module.exports = mongoose.model("User", userSchema);