const mongoose =require("mongoose");
const reviewschema=new mongoose.Schema({
    rating:{
        type:Number,
        required:true,
    },
    comment:{
        type:String,
        required:true,
    },  
    date:{
        type:Date,
        default:Date.now(),
    }
});
const review=mongoose.model("review",reviewschema);
module.exports=review;