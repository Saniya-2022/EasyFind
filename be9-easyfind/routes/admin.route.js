const express = require('express');
const router = express.Router();
router.use(express.json());
const LostItem = require('../models/LostItem');
const Item = require('../models/FoundItem');
const { upload, cloudinary } = require('../config/cloudinary')
const  auth =require('../middlewares/admin-auth')
const sendEmail = require("../utils/notifications");
const { dispatchEmailJob } = require('../utils/emailDispatcher');

  /////////////////////////////////////////////// ADMIN ROUTES///////////////////////////
  // admin login
  // routes/adminAuth.js
// const express = require('express');
// const router = express.Router();


const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');



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




// POST /api/admin/login
// router.post('/login', async (req, res) => {
//   const { username, password } = req.body;

//   try {
//     // Find the admin by username
//     const admin = await Admin.findOne({ username });

//     console.log("username:",admin)

//     if (!admin) {
//       return res.status(400).json({ msg: 'Invalid credentials' });
//     }


//     bcrypt.hash("password123", 10).then(hash => console.log(hash));


//     // Compare the entered password with the stored hashed password
//     const isMatch = await bcrypt.compare(password, admin.password);
//     if (!isMatch) {
//       return res.status(400).json({ msg: 'password is incorrect' });
//     }

//     // Create a JWT payload
//     const payload = { admin: { id: admin._id } };

//     // Sign the JWT token
//     jwt.sign(
//       payload,
//       process.env.JWT_SECRET, // ensure this is defined in your environment
//       { expiresIn: '24h' },
//       (err, token) => {
//         if (err) throw err;
//         console.log("login successful")
        
//         res.json({ token });
//       }
//     );
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).send('Server error');
//   }
// });
// // checking if the token is valid or not
// router.get('/verify', auth, (req, res) => {
//   res.json({ message: 'Token is valid', user: req.user });
// });
// // change password route for admin

// router.post("/change-password", auth, async (req, res) => {
//   try {
//     const { oldPassword, newPassword } = req.body;

//     if (!oldPassword || !newPassword) {
//       return res.status(400).json({ message: "All fields are required" });
//     }

//     const user = await Admin.findById(req.user);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     if (!bcrypt.compareSync(oldPassword, user.password)) {
//       return res.status(400).json({ message: "Incorrect old password" });
//     }

//     user.password = bcrypt.hashSync(newPassword, 10);
//     await user.save();

//     res.status(200).json({ message: "Password changed successfully" });
//   } catch (error) {
//     console.error("Error changing password:", error);
//     res.status(500).json({ message: "Server error" ,error:error });
//   }
// });



// admin found

router.get('/found',auth, async (req, res) => {
  try {
    // Fetch all items without any query condition
    const foundItems = await Item.find();
    
    res.status(200).json(foundItems);
  } catch (error) {
    console.error('Error fetching found items:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


  // admin upload
  // const stringSimilarity = require("string-similarity");

  router.post('/upload', auth, upload.single('image'), async (req, res) => {
    try {
      console.log("📤 Upload request received");
      console.log("Body:", req.body);
      console.log("File:", req.file);
      
      if (!req.file) {
        console.log("❌ No file uploaded");
        return res.status(400).json({ success: false, message: 'Image required' });
      }

      const { itemName, description, foundLocation, category, reportedDate } = req.body;
      console.log("📋 Form data:", { itemName, description, foundLocation, category, reportedDate });
      
      if (!itemName || !description || !foundLocation || !category) {
        console.log("❌ Missing required fields");
        return res.status(400).json({ success: false, message: 'All fields are required' });
      }

      // Convert reportedDate string to Date object
      let reportedDateObj;
      if (reportedDate) {
        reportedDateObj = new Date(reportedDate);
        if (isNaN(reportedDateObj.getTime())) {
          console.log("❌ Invalid date format");
          return res.status(400).json({ success: false, message: 'Invalid date format' });
        }
      } else {
        reportedDateObj = new Date();
      }

      console.log("💾 Creating item in database...");
      const newItem = await Item.create({
        itemName,
        description,
        foundLocation,
        category,
        handoverLocation: 'Security Office',
        status: 'verified',
        code: await generateUniqueCode(),
        reportedDate: reportedDateObj,
        image: { url: req.file.path, public_id: req.file.filename }
      });

      console.log("✅ Item created successfully:", newItem);

      // send email by calling email dispatcher
      try {
        dispatchEmailJob("matchLostItem",{itemId:newItem._id});
        console.log("📧 Email job dispatched");
      } catch (emailError) {
        console.error("⚠️ Email dispatch failed:", emailError);
        // Don't fail the upload if email fails
      }
      
      res.json(newItem);
  
    } catch (error) {
      console.error("💥 Upload error:", error);
      console.error("Error stack:", error.stack);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Internal server error',
        details: error.toString()
      });
    }
  });
  

// handover items
router.put("/:id/handover",auth, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "Proof image required" });

    const { id } = req.params;
    const { contact, rollNo, name } = req.body;

    if (!contact || !rollNo || !name) {
      return res.status(400).json({ success: false, message: "All fields (contact, rollNo, name) are required" });
    }

    const item = await Item.findById(id);
    if (!item) return res.status(404).json({ success: false, message: "Item not found" });

    // Update status and store Cloudinary image details
    item.status = "claimed";
    item.claimerDetails = {
      contact,
      rollNo,
      name,
      proofs: [
        ...(item.claimerDetails?.proofs || []),
        { url: req.file.path, public_id: req.file.filename }
      ]
    };

    await item.save();
    console.log("Item handed over successfully with item details", item);
    res.json({ success: true, message: "Item handed over successfully", item });
  } catch (error) {
    console.error("Error updating item:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});



// Route to update item status and send the notification
// const stringSimilarity = require("string-similarity");


router.patch("/updatestatus", auth, async (req, res) => {
  try {
    const { id, status } = req.body;

    if (!id || !status) {
      return res.status(400).json({ message: "Item ID and status are required" });
    }

    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    if (item.status === "claimed" && status === "pending") {
      return res.status(400).json({ message: "Cannot change claimed item back to pending" });
    }

    await Item.updateOne({ _id: id }, { $set: { status } });

    // If the item is verified, compare with all lost items
    if (status === "verified" && item.description) {
      dispatchEmailJob("matchLostItem",{itemId:item._id});
    }

    res.json({ message: "Status updated successfully" });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


////////////////// edit the documents ex:deleting,...

// Update Found Item (Admin Route)
router.put('/edit-item/:id', async (req, res) => {
  try {
      const updatedItem = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true });

      if (!updatedItem) {
          return res.status(404).json({ message: 'Item not found' });
      }

      res.status(200).json(updatedItem);
  } catch (error) {
      console.error('Error updating item:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete Found Item (Admin Route)
router.delete('/edit-item/:id', async (req, res) => {
  try {
      const deletedItem = await Item.findByIdAndDelete(req.params.id);

      if (!deletedItem) {
          return res.status(404).json({ message: 'Item not found' });
      }

      res.status(200).json({ message: 'Item deleted successfully' });
  } catch (error) {
      console.error('Error deleting item:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
});

// Example usage in your route (around line 244)
// When verifying/approving an item:
router.patch('/verify/:id', async (req, res) => {
  try {
    const item = await Item.findByIdAndUpdate(
      req.params.id,
      { verified: true },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Queue email notifications
    await dispatchEmailJob('matchLostItem', { itemId: item._id });

    res.json({ 
      message: 'Item verified successfully',
      item 
    });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;




