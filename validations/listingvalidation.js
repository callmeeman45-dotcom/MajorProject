const joi=require('joi');   
const listingSchema=joi.object({
    title:joi.string().required(),
    description:joi.string().required(),
    img:joi.string().uri().allow(''),
    price:joi.number().required().min(0),
    Location:joi.string().required(),   
    country:joi.string().required()
});
module.exports.listingSchema=listingSchema;