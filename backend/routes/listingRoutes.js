const express = require('express');
const router = express.Router();
const listingController = require('../controllers/listingController');

// GET all listings
router.get('/', listingController.getListings);

// POST new listing
router.post('/', listingController.createListing);

// PUT (Update) listing
router.put('/:id', listingController.updateListing);

// DELETE listing
router.delete('/:id', listingController.deleteListing);

module.exports = router;