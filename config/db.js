const mongoose=require("mongoose")

async function connectDB(){
    try{
        await mongoose.connect('mongodb://localhost:27017/gym')
        console.log("Connected to MongoDB success!")
    }catch(err){
        console.error("Failed to connect to MongoDB",err.message)
        process.exit(1)
    }
}
module.exports=connectDB
