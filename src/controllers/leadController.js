const Lead = require("../models/Lead");

// Get all leads
const getLeads = async (req, res) => {
  try {
    const { status, source, search, page = 1, limit = 50 } = req.query;
    
    let query = { isActive: true };
    
    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Filter by source
    if (source) {
      query.source = source;
    }
    
    // Search functionality
    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { leadRef: { $regex: search, $options: 'i' } }
      ];
    }
    
    const leads = await Lead.find(query)
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Lead.countDocuments(query);
    
    res.json({
      leads,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single lead
const getLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('convertedBookingId');
    
    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }
    
    res.json(lead);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new lead
const createLead = async (req, res) => {
  try {
    const leadData = {
      ...req.body,
      assignedTo: req.user.sub // Assign to current user
    };
    
    const lead = new Lead(leadData);
    await lead.save();
    
    res.status(201).json(lead);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: "Lead reference already exists" });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
};

// Update lead
const updateLead = async (req, res) => {
  try {
    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('assignedTo', 'name email');
    
    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }
    
    res.json(lead);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete lead (soft delete)
const deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }
    
    res.json({ message: "Lead deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get lead statistics
const getLeadStats = async (req, res) => {
  try {
    const stats = await Lead.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);
    
    const sourceStats = await Lead.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$source",
          count: { $sum: 1 }
        }
      }
    ]);
    
    const monthlyStats = await Lead.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 12 }
    ]);
    
    const conversionRate = await Lead.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          converted: {
            $sum: { $cond: [{ $eq: ["$status", "Converted"] }, 1, 0] }
          }
        }
      }
    ]);
    
    res.json({
      statusStats: stats,
      sourceStats,
      monthlyStats,
      conversionRate: conversionRate[0] || { total: 0, converted: 0 }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Convert lead to booking
const convertToBooking = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    
    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }
    
    if (lead.status === "Converted") {
      return res.status(400).json({ message: "Lead already converted" });
    }
    
    // Update lead status
    lead.status = "Converted";
    await lead.save();
    
    // Return lead data for booking creation
    res.json({
      message: "Lead marked as converted",
      leadData: {
        customerName: lead.customerName,
        email: lead.email,
        phone: lead.phone,
        packageType: lead.packageType,
        travelDates: lead.travelDates,
        groupSize: lead.groupSize,
        requirements: lead.requirements
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  getLeadStats,
  convertToBooking
};