const Listing = require('../models/Listing');

// Get all listings (with optional filtering)
exports.getListings = async (req, res) => {
  try {
    const { type, status, search } = req.query;
    let query = {};

    if (type) query.type = type;
    if (status) query.status = status;
    if (search) {
      query.name = { $regex: search, $options: 'i' }; // Case-insensitive search
    }

    const listings = await Listing.find(query).sort({ createdAt: -1 });
    res.status(200).json(listings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create a new listing item
exports.createListing = async (req, res) => {
  try {
    const newListing = new Listing(req.body);
    const savedListing = await newListing.save();
    res.status(201).json(savedListing);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update a listing item
exports.updateListing = async (req, res) => {
  try {
    const updatedListing = await Listing.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.status(200).json(updatedListing);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete a listing item
exports.deleteListing = async (req, res) => {
  try {
    await Listing.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Listing deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//This handles the generic listing data (Specializations, Service types).