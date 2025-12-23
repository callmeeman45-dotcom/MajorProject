const mongoose=require("mongoose");
const listing=require("../models/listing.js");
const initdata=require("./data.js");
const main = async()=>{
 await mongoose.connect("mongodb://localhost:27017/Wonderlust");
 console.log("Connected to MongoDB");
}
main().catch(err=>console.log(err));
const adddata=async()=>{
    await listing.deleteMany({});
    await listing.insertMany(initdata.data);
    console.log("Data Imported Successfully");
}
adddata().catch(err=>console.log(err));