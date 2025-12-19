// models/Homework.js
const mongoose = require("mongoose");

const homeworkSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  
  description: { 
    type: String, 
    default: "" 
  },
  
  classIds: [{ 
    type: String
  }],
  
  classId: { 
    type: String
  },
  
  dueFrom: { 
    type: Date, 
    default: null 
  },
  
  dueTo: { 
    type: Date, 
    default: null 
  },
  
  allowViewResult: { 
    type: Boolean, 
    default: false 
  },
  
  shareCode: { 
    type: String, 
    unique: true,  // ✅ Chỉ dùng unique: true, XÓA index: true
    required: true
    // ❌ XÓA: index: true
  },
  
  shareUrl: { 
    type: String, 
    default: "" 
  },
  
  attachments: [
    {
      originalName: String,
      url: String,
      pdfUrl: String,
      mime: String,
      size: Number,
    },
  ],
  
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
}, {
  timestamps: true,
});

// ✅ Index để query nhanh - CHỈ KẾT HỢP, KHÔNG index riêng shareCode
homeworkSchema.index({ createdBy: 1, createdAt: -1 });
// ❌ XÓA dòng này: homeworkSchema.index({ shareCode: 1 });

module.exports = mongoose.model("Homework", homeworkSchema);