const Quotation = require("../models/Quotation");
const Lead = require("../models/Lead");
const Product = require("../models/Product");
const Booking = require("../models/Booking");

// Get all quotations
const getQuotations = async (req, res) => {
  try {
    const { status, leadId, page = 1, limit = 20 } = req.query;
    
    let query = { isActive: true };
    
    // Filter by status - handle case insensitive
    if (status && status !== 'all') {
      const statusMap = {
        'draft': 'Draft',
        'sent': 'Sent', 
        'viewed': 'Viewed',
        'accepted': 'Accepted',
        'rejected': 'Rejected',
        'expired': 'Expired'
      };
      query.status = statusMap[status.toLowerCase()] || status;
    }
    
    if (leadId) {
      query.leadId = leadId;
    }
    
    console.log('Quotations query:', query);
    
    const quotations = await Quotation.find(query)
      .populate('leadId', 'customerName email phone packageType')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Quotation.countDocuments(query);
    
    console.log(`Found ${quotations.length} quotations for status: ${status}`);
    
    res.json({
      quotations,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error getting quotations:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get single quotation
const getQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate('leadId')
      .populate('createdBy', 'name email')
      .populate('items.productId');
    
    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }
    
    res.json(quotation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create quotation from lead
const createQuotationFromLead = async (req, res) => {
  try {
    const { leadId } = req.params;
    
    console.log('User from request:', req.user); // Debug log
    
    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }
    
    // Parse group size
    const groupSize = parseGroupSize(lead.groupSize);
    
    const quotationData = {
      leadId: lead._id,
      customerName: lead.customerName,
      email: lead.email,
      phone: lead.phone,
      packageType: lead.packageType,
      destination: lead.destination,
      duration: lead.duration,
      groupSize,
      travelDates: {
        startDate: lead.travelDates,
        endDate: lead.travelDates ? new Date(new Date(lead.travelDates).getTime() + parseDuration(lead.duration) * 24 * 60 * 60 * 1000) : null
      },
      items: [],
      createdBy: req.user._id
    };
    
    const quotation = new Quotation(quotationData);
    await quotation.save();
    
    res.status(201).json(quotation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Create new quotation
const createQuotation = async (req, res) => {
  try {
    const quotationData = {
      ...req.body,
      createdBy: req.user._id
    };
    
    const quotation = new Quotation(quotationData);
    await quotation.save();
    
    res.status(201).json(quotation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update quotation
const updateQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('leadId').populate('createdBy', 'name email');
    
    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }
    
    res.json(quotation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Add item to quotation
const addQuotationItem = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }
    
    const itemData = req.body;
    console.log('Received item data:', itemData); // Debug log
    
    // If productId is provided, get product details
    if (itemData.productId) {
      const product = await Product.findById(itemData.productId);
      if (product) {
        itemData.name = product.name || product.title || 'Unnamed Product';
        itemData.description = product.description || '';
        // Handle both pricing structures
        itemData.basePrice = product.pricing?.base || product.basePrice || 0;
        itemData.inclusions = product.inclusions || [];
        itemData.exclusions = product.exclusions || [];
        console.log('Product found:', product.name || product.title, 'Price:', itemData.basePrice);
      } else {
        console.log('Product not found for ID:', itemData.productId);
      }
    }
    
    // Ensure required fields are present
    if (!itemData.name) {
      itemData.name = 'Unnamed Item';
    }
    
    if (!itemData.basePrice) {
      itemData.basePrice = 0;
    }
    
    // Calculate subtotal
    const quantity = itemData.quantity || 1;
    const nights = itemData.nights || 1;
    const rooms = itemData.rooms || 1;
    const pax = itemData.pax || quotation.groupSize.adults + quotation.groupSize.children || 1;
    
    // Different calculation based on service type
    if (itemData.type === 'hotel') {
      // Hotels: basePrice * nights * rooms
      itemData.subtotal = itemData.basePrice * nights * rooms;
      console.log(`Hotel calculation: ₹${itemData.basePrice} × ${nights} nights × ${rooms} rooms = ₹${itemData.subtotal}`);
    } else if (itemData.type === 'vehicle') {
      // Vehicles: basePrice * quantity (not per person)
      itemData.subtotal = itemData.basePrice * quantity;
      console.log(`Vehicle calculation: ₹${itemData.basePrice} × ${quantity} vehicles = ₹${itemData.subtotal}`);
    } else {
      // Tours/Packages: basePrice * pax (per person)
      itemData.subtotal = itemData.basePrice * quantity * pax;
      console.log(`${itemData.type} calculation: ₹${itemData.basePrice} × ${pax} persons = ₹${itemData.subtotal}`);
    }
    
    console.log('Final item data before save:', itemData);
    
    quotation.items.push(itemData);
    await quotation.save();
    
    console.log('Item added successfully');
    res.json(quotation);
  } catch (error) {
    console.error('Error adding quotation item:', error);
    res.status(400).json({ message: error.message });
  }
};

// Remove item from quotation
const removeQuotationItem = async (req, res) => {
  try {
    const { id, itemId } = req.params;
    
    const quotation = await Quotation.findById(id);
    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }
    
    quotation.items = quotation.items.filter(item => item._id.toString() !== itemId);
    await quotation.save();
    
    res.json(quotation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update quotation pricing
const updateQuotationPricing = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }
    
    quotation.pricing = { ...quotation.pricing, ...req.body };
    await quotation.save();
    
    res.json(quotation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Send quotation to customer
const sendQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate('leadId')
      .populate('createdBy', 'name email')
      .populate('items.productId');
    
    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }
    
    quotation.status = "Sent";
    quotation.sentAt = new Date();
    await quotation.save();
    
    // Prepare quotation data for email
    const quotationData = {
      quotationRef: quotation.quotationRef,
      customerName: quotation.customerName,
      email: quotation.email,
      phone: quotation.phone,
      destination: quotation.destination,
      duration: quotation.duration,
      groupSize: quotation.groupSize,
      travelDates: quotation.travelDates,
      items: quotation.items,
      pricing: quotation.pricing,
      validTill: quotation.validTill,
      inclusions: quotation.inclusions,
      exclusions: quotation.exclusions,
      terms: quotation.terms,
      notes: quotation.notes,
      createdBy: quotation.createdBy
    };
    
    // Send email to customer (you can implement email service here)
    console.log('Sending quotation to customer:', quotation.email);
    console.log('Quotation data:', JSON.stringify(quotationData, null, 2));
    
    // TODO: Implement actual email sending
    // await sendQuotationEmail(quotationData);
    
    res.json({ 
      message: "Quotation sent successfully", 
      quotation,
      quotationData // Return data that was sent
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get quotation statistics
const getQuotationStats = async (req, res) => {
  try {
    const stats = await Quotation.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalValue: { $sum: "$pricing.total" }
        }
      }
    ]);
    
    const conversionStats = await Quotation.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          accepted: { $sum: { $cond: [{ $eq: ["$status", "Accepted"] }, 1, 0] } },
          totalValue: { $sum: "$pricing.total" },
          acceptedValue: { $sum: { $cond: [{ $eq: ["$status", "Accepted"] }, "$pricing.total", 0] } }
        }
      }
    ]);
    
    res.json({
      statusStats: stats,
      conversionStats: conversionStats[0] || { total: 0, accepted: 0, totalValue: 0, acceptedValue: 0 }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper functions
const parseGroupSize = (groupSizeStr) => {
  if (!groupSizeStr) return { adults: 2, children: 0, infants: 0 };
  
  const adults = (groupSizeStr.match(/(\d+)\s*adult/i) || [0, 2])[1];
  const children = (groupSizeStr.match(/(\d+)\s*child/i) || [0, 0])[1];
  const infants = (groupSizeStr.match(/(\d+)\s*infant/i) || [0, 0])[1];
  
  return {
    adults: parseInt(adults) || 2,
    children: parseInt(children) || 0,
    infants: parseInt(infants) || 0
  };
};

const parseDuration = (durationStr) => {
  if (!durationStr) return 5;
  const nights = (durationStr.match(/(\d+)n/i) || [0, 5])[1];
  return parseInt(nights) || 5;
};

// Convert quotation to booking
const convertQuotationToBooking = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate('leadId')
      .populate('items.productId');
    
    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }
    
    if (quotation.status === "Accepted") {
      return res.status(400).json({ message: "Quotation already converted to booking" });
    }
    
    // Create booking from quotation
    const bookingData = {
      quotationId: quotation._id,
      quotationRef: quotation.quotationRef,
      leadId: quotation.leadId?._id,
      customerName: quotation.customerName,
      customerEmail: quotation.email,
      customerPhone: quotation.phone,
      totalAmount: quotation.pricing.total,
      currency: "INR",
      status: "confirmed",
      paymentStatus: "unpaid",
      createdBy: req.user._id,
      notes: `Converted from quotation ${quotation.quotationRef}`
    };
    
    // For now, create a single booking with the main package/service
    if (quotation.items.length > 0) {
      const mainItem = quotation.items[0];
      bookingData.product = mainItem.productId?._id;
      bookingData.productType = mainItem.type;
      bookingData.guests = quotation.groupSize.adults + quotation.groupSize.children;
      bookingData.checkIn = quotation.travelDates.startDate;
      bookingData.checkOut = quotation.travelDates.endDate;
    }
    
    const booking = new Booking(bookingData);
    await booking.save();
    
    // Update quotation status
    quotation.status = "Accepted";
    quotation.respondedAt = new Date();
    await quotation.save();
    
    // Update lead status if exists
    if (quotation.leadId) {
      quotation.leadId.status = "Converted";
      quotation.leadId.convertedBookingId = booking._id;
      await quotation.leadId.save();
    }
    
    res.json({ 
      message: "Quotation converted to booking successfully", 
      booking,
      quotation,
      redirect: "bookings" // Add redirect instruction
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete quotation (soft delete)
const deleteQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);
    
    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }
    
    // Only allow deletion of draft quotations
    if (quotation.status !== "Draft") {
      return res.status(400).json({ message: "Only draft quotations can be deleted" });
    }
    
    // Soft delete
    quotation.isActive = false;
    await quotation.save();
    
    res.json({ message: "Quotation deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getQuotations,
  getQuotation,
  createQuotationFromLead,
  createQuotation,
  updateQuotation,
  addQuotationItem,
  removeQuotationItem,
  updateQuotationPricing,
  sendQuotation,
  getQuotationStats,
  convertQuotationToBooking,
  deleteQuotation
};