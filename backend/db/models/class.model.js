const mongoose=require('mongoose');
const ClassSchema=new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 1,
        trim: true
    }


});
const Class=mongoose.model('Class',ClassSchema);
module.exports ={Class}