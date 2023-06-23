const mongoose=require('mongoose');
const StudentSchema=new mongoose.Schema({
    nom: {
        type: String,
        required: true,
        minlength: 1,
        trim: true
    },
    prenom: {
        type: String,
        required: true,
        minlength: 1,
        trim: true
    },
   _classId: {
        type : mongoose.Types.ObjectId,
       required: true
   },
    completed: {
        type: Boolean,
        default: false
    }



});
const Student=mongoose.model('Student',StudentSchema);
module.exports ={Student}