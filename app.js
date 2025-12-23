require("dotenv").config();
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
cloudinary.config({ 
cloud_name: process.env.CLOUD_NAME, 
api_key: process.env.CLOUD_API_KEY, 
api_secret: process.env.CLOUD_API_SECRET 
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'Wonderlust',
   allowed_formats:['png','jpg','jpeg'], // supports promises as well
  },
});

const mongoose=require("mongoose");
const express =require("express");
const listing=require("./models/listing.js");
const methodoverride=require("method-override");
const ejsmate = require('ejs-mate')
const { listingSchema } = require("./validations/listingvalidation.js");
const app = express();
app.use(express.json());
app.set("view engine", "ejs");
const path = require("path");
app.set("public", path.join(__dirname, "public"));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(methodoverride("_method"));
app.engine('ejs', ejsmate);
const signup=require("./models/signup.js");
const reviews= require("./models/rewiews.js");
const session=require("express-session");
const MongoStore=require("connect-mongo")
// 1: require connect-flash
const flash=require("connect-flash");
const User=require("./models/users.js");
const passportLocalMongoose= require("passport-local-mongoose").default;
const LocalStrategy=require("passport-local").Strategy;
const passport = require("passport");
const multer  = require('multer')
const upload = multer({ storage })



// passport configuration
// steps to use connect-flash 
// we have to import populate
// const populate=require("populate");
// Now we have to setup ej
// in any case we do not have to display our credientials in public files 
// we have to keep the adress of our mongo cloud in env file and ten dotnet we have to access that url that adress of cloud platform 
const Mongourl=process.env.mongodb_cloud_address

const main = async()=>{
 await mongoose.connect(Mongourl);
 console.log("Connected to MongoDB");

}
main().catch(err=>console.log(err));

// app.use(express.json(), upload.single('img'), function (req, res, next) {
// console.log(req.file);
//   // req.file is the `avatar` file
//   // req.body will hold the text fields, if there were any
// });




// app.get("/listings",async(req,res)=>{
//     let samplelisting=new listing({
//         title:"Beautiful Beach House",
//         description:"A lovely beach house with stunning sea views.",

//         price:2500,
//         Location:"islamabad,Pakistan",
//         country:"Pakistan"
// res.send("Listing saved successfully!");
//     });
//     await samplelisting.save();
// app.use("/listings/new",(req,res,next)=>{
//     const pagename=req.path;
//     console.log(pagename);
//     res.render("signup",{pagename});
// });
// mongose middleware is model specific
const store=MongoStore.create({
  mongoUrl:Mongourl,
  crypto:{
     secret:process.env.SECRET,
  },
  touchAfter:24*3600,
});
app.use(session({
  store,
    secret:process.env.SECRET,
    resave:false,
    saveUninitialized:true,
    cookies:{
      expires:Date.now()+7*24*60*60*1000,
      maxAge:7*24*60*60*1000,
      httpOnly:true
    }
}));
// 2: use flash middleware
app.use(flash());
// 3:middleware for flash messages and here we will use res.locals to make flash messages available in all templates  beacuse we do ot have only one message of only success or failure we have to make both megessages available in all templates and next() is used to move to the next middleware or to the rout 


app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



// app.post('/listings/create', (req, res, next) => {
//   console.log(req.body);
//   console.log(req.files); // for multiple files
//   console.log(req.file);  // for single file
//   next();
// }, upload.single('img'), (req,res)=>{
//   res.send(req.file);
// });

async function isowner(req,res,next){
  const listingid=req.params.id;
  const listingdetails=await listing.findById(listingid);
  if(!listingdetails.owner.equals(req.user._id)){
    req.flash("error","You do not have permission to do that!");
    return res.redirect(`/listings/${listingid}`);
  }
  return next();
};


function isLoggedIn(req,res,next){
  if(!req.isAuthenticated()){
     req.session.redirectURL=req.originalUrl;
    req.flash("error","You must be signed in first!");
    return res.redirect("/login");
  } 
  return next();
};
app.use((req,res,next)=>{
    res.locals.success=req.flash("success");
    res.locals.error=req.flash("error");
    res.locals.currentuser=req.user;
    next();
});
app.use((req,res,next)=>{
  if (req.session.redirectURL){
  res.locals.originalurl=req.session.redirectURL;
}
next()
  });
app.get("/listings",async(req,res)=>{
    const alllistings=await listing.find({});
    res.render("index",{alllistings});
});
app.post("/users/signup", async (req, res) => {
  try{
 const {Username,Email,Password}=req.body;
 const newuser=new User({username:Username,email:Email});
 const registereduser=await User.register(newuser,Password);
 req.flash("success","user is registered Successfully!");
 return res.redirect("/listings");

  }catch(e){
    req.flash("error",e.message);
    return res.redirect("/register");
  }
});
app.get("/login",(req,res)=>{
  res.render("login");
})
app.post("/users/login",passport.authenticate("local",
  { failureRedirect: "/login" ,
    failureFlash:true}),async(req,res)=>{
  req.flash("success","Welcome back");
  if(!res.locals.originalurl){
    return res.redirect("/listings");
  }
  res.redirect(res.locals.originalurl);
}
)

app.get("/register",async(req,res)=>{
     res.render("signup");  
  });


app.get("/listings/new",isLoggedIn,async(req,res)=>{
    res.render("new");
});
app.post("/listings/create", upload.single('img'), async (req, res) => {
    //  so now we firslty have to validate the data coming from the form
    let url=req.file.path;
    let filename=req.file.filename;
    const { error } = await listingSchema.validateAsync(req.body);
    if (error) {
        return res.status(400).render("new", { error });
    }
    const newListing = new listing(req.body);
    newListing.owner=req.user._id;
    newListing.img={url,filename};
    await newListing.save();
    console.log(newListing);
    req.flash("success","Listing created successfully!");
    res.redirect("/listings");
});
// app.post("/listings/create",async(req,res)=>{
//   res.send(req.body);
// });
app.get("/listings/:id/edit",isowner,isLoggedIn,async(req,res)=>{
    const listingid=req.params.id;
    const listingdetails=await listing.findById(listingid);
    const imgURL=listingdetails.img.url;
    // const replacedURL=imgURL.replace("/")
    res.render("editform",{listingdetails});
});
app.put("/listings/:id", upload.single("img"), async (req, res) => {
    const listingid = req.params.id;

    let updatedlisting = await listing.findByIdAndUpdate(
        listingid,
        req.body,
    );

    if (req.file) {
        let url = req.file.path;
        let filename = req.file.filename;
        updatedlisting.img = { url, filename };
        await updatedlisting.save();
    }

    res.redirect(`/listings/${listingid}`);
});

app.get("/logout",(req,res)=>{
  req.logout((err)=>{
    if(err){
      req.flash("error","Error logging out");
      return res.redirect("/listings");
    }
    req.flash("success","Logged out successfully!");
    res.redirect("/listings");
  });
});
app.delete("/listings/:id/delete",isowner,async(req,res)=>{
    const listingid=req.params.id;
    const deletedlisting=await listing.findById(listingid);
    await listing.findByIdAndDelete(listingid);
    req.flash("success",`Listing titled "${deletedlisting.title}" deleted successfully!`);
    res.redirect("/listings");
});
app.get("/listings/:id",isLoggedIn,async(req,res)=>{
    const listingid=req.params.id;
    const listingdetails=await listing.findById(listingid).populate("reviews").populate("owner");
    console.log(listingdetails);
    res.render("show",{listingdetails});
});
app.post("/reviews/create/:id",async(req,res)=>{
  let {rating,comment}=req.body;
  let listingid=req.params.id;
  let newreview=new reviews({
    rating,
    comment
  });
    await newreview.save();
    req.flash("success","Review added successfully!");
    const listing1=await listing.findById(listingid);
    listing1.reviews.push(newreview);
    await listing1.save();
    console.log(listing1);
    res.redirect(`/listings/${listingid}`);

});
app.delete("/listings/:id/reviews/:reviewid",async(req,res)=>{
  let {id,reviewid}=req.params;
  await  reviews.findByIdAndDelete(reviewid);
  await  listing.findByIdAndUpdate(id,{$pull:{reviews:reviewid}});
  res.redirect(`/listings/${id}`);


})

// we have to run our local host server on port 3000
app.listen (3000,()=>{
    console.log("Server is running on port 3000");
});

