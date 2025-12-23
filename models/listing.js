const mongoos=require("mongoose");
const Review = require("./rewiews.js");
const User=require("./users.js");
const listingSchema=new mongoos.Schema({
    
        title:{
        type:String,
        require:true
    },
     description:String,
    img:{
     url:String,
     filename:String
    },
    price:Number,

    Location:String,
    country:String,
    reviews:[{
        type:mongoos.Schema.Types.ObjectId,
        ref:"review"
    }]  ,
    owner:{
      type:mongoos.Schema.Types.ObjectId,
      ref:"User"
    }
});
listingSchema.post("findByIdAndDelete", async function (deletedlisting) {
  console.log("🔥 POST MIDDLEWARE TRIGGERED");

  if (deletedlisting) {
    console.log("Listing reviews:", deletedlisting.reviews);
  }
});
const listing=mongoos.model("Listing",listingSchema);
module.exports=listing;






// listingSchema.post("findByIdAndDelete", async function (deletedlisting) {
// if (deletedlisting.reviews.length) {
//     await Review.deleteMany({ _id: { $in: deletedlisting.reviews } });
//   }
// });
