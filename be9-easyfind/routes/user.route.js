const express = require('express');
const router = express.Router();
router.use(express.json());
const LostItem = require('../models/LostItem');
const Item = require('../models/FoundItem');
const { upload, cloudinary } = require('../config/cloudinary')
const  auth =require('../middlewares/user-auth')
const sendEmail = require("../utils/notifications");
const stringSimilarity = require("string-similarity");

const dispatchEmailJob = require("../utils/emailDispatcher");

// Submit a lost item
router.post('/lost',auth, async (req, res) => {
    try {
        const lostItem = new LostItem(req.body);
        await lostItem.save();
        console.log("submitted item with details",lostItem)
        res.status(201).json({ message: 'Lost item submitted successfully', lostItem });
    } catch (error) {
        res.status(400).json({ message: 'Error submitting lost item', error });
    }
});



// Function to generate a random 4-character alphanumeric code
function generateCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Function to ensure the code is unique
async function generateUniqueCode() {
  let code;
  let exists = true;
  while (exists) {
      code = generateCode();
      exists = await Item.exists({ code });
  }
  return code;
}

// Submit a found item
// Create new item
router.post('/found',auth, upload.single('image'), async (req, res) => {
  console.log(" Reached into Found");
  try {
      // Check if an image file was uploaded
      if (!req.file) {
          return res.status(400).json({
              success: false,
              message: 'Image file is required'
          });
      }

      const { itemName, description, foundLocation, reporterRollNo, category,reportedDate } = req.body;

      // Validate required fields
      if (!itemName || !description || !foundLocation || !reporterRollNo) {
          return res.status(400).json({
              success: false,
              message: 'All fields (title, description, foundLocation, reporterRollNo) are required'
          });
      }

      // Generate a unique 4-character code
      const uniqueCode = await generateUniqueCode();

      // Prepare item data with default handover location
      const itemData = {
          itemName,
          description,
          foundLocation,
          reporterRollNo,
          handoverLocation: 'Security Office',
          status: 'pending',
          code: uniqueCode, // Assign the generated unique code
          image: {
              url: req.file.path,
              public_id: req.file.filename
          },
          reportedDate,
          category
      };

      console.log('Creating item with data:', itemData);

      // Save the new item to the database
      const newItem = new Item(itemData);
      const savedItem = await newItem.save();

      return res.status(201).json({
          success: true,
          item: savedItem
      });
  } catch (error) {
      console.error('Error creating item:', error);
      res.status(500).json({
          success: false,
          message: error.message || 'Internal server error'
      });
  }
});





// Search for found items

router.get('/found',auth, async (req, res) => {
  try {
      const foundItems = await Item.find().select('code itemName status image category description');

      if (!foundItems.length) {
          return res.status(404).json({ message: 'No found items available' });
      }

      res.status(200).json(foundItems);
  } catch (error) {
      console.error('Error fetching found items:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
});


  router.get('/reported/:id',auth,async(req,res)=>{
    const ID=req.params.id;
    const reportedItems=await Item.find({ reporterRollNo:ID}).select('code itemName status image description foundLocation category');
    res.send(reportedItems)

  })
  router.get('/lost-items/:id',async(req,res)=>{
    try{
    const ID=req.params.id;
    const reportedItems=await LostItem.find({ email:ID});
    res.send(reportedItems)
    }catch(err){
      res.status(500).json({message:"error getting lost items"})
    }

  })
// delete the reported items that found
  router.delete("/lost/:id", auth, async (req, res) => {
    try {
      const ID = req.params.id;
      const item = await LostItem.findById(ID);
      if (!item) return res.status(404).json({ message: "Item not found" });
      // if (item.status === "verified") return res.status(403).json({ message: "Cannot delete an verified item" });
  
      const deletedItem = await LostItem.findOneAndDelete({ _id: ID });
      res.json({ message: "Delete successful", payload: deletedItem });
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });


  // delete the items uploaded by a user that he lost
  router.delete("/reported/:id", auth, async (req, res) => {
    try {
      const ID = req.params.id;
      const item = await Item.findById(ID);
      if (!item) return res.status(404).json({ message: "Item not found" });
      if (item.status === "approved") return res.status(403).json({ message: "Cannot delete an approved item" });
  
      const deletedItem = await Item.findOneAndDelete({ _id: ID });
      res.json({ message: "Delete successful", payload: deletedItem });
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });


  module.exports = router

