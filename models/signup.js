const mongoos=require("mongoose");
const listingSchema=new mongoos.Schema({
   Email:{
        type:String,
        required:true    
    },
    Password:{
        type:String,
        required:true
    }
});
const signup=mongoos.model("Signup",listingSchema);
module.exports=signup;