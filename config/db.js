const mongoose=require("mongoose")

async function connectDB(){
    try{
       const conn= await mongoose.connect(`${process.env.MONGODB_URI}`)
       console.log("Connected to MongoDB success!")
    }catch(err){
        console.error("Failed to connect to MongoDB",err.message)
        process.exit(1)
    }
}
module.exports=connectDB
