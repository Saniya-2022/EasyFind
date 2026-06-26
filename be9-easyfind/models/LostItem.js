const mongoose = require('mongoose');

const LostItemSchema = new mongoose.Schema({
    itemName:{
        type:String,
    },
    category: {
        type: String,
        required: true,
    },
    location: {
        type: String,
    },
    dateLost: {
        type: Date,
        default: Date.now,
    },
    email:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    }
    
}, { timestamps: true });

module.exports = mongoose.model('LostItem', LostItemSchema);