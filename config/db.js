const mongoose=require("mongoose")

async function connectDB(){
    try{
        await mongoose.connect('mongodb+srv://jaianishjayabharath:aj8045@cluster0.nkhwobk.mongodb.net/?appName=Cluster0')
        console.log("Connected to MongoDB success!")
    }catch(err){
        console.error("Failed to connect to MongoDB",err.message)
        process.exit(1)
    }
}
module.exports=connectDB
