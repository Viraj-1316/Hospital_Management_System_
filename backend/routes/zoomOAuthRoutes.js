const express = require("express");
const router = express.Router();
const axios = require("axios");
const DoctorModel = require("../models/Doctor");
const { verifyToken } = require("../middleware/auth");
const logger = require("../utils/logger");

// Zoom OAuth Configuration
const ZOOM_CLIENT_ID = process.env.ZOOM_CLIENT_ID;
const ZOOM_CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET;
const ZOOM_REDIRECT_URI = process.env.ZOOM_REDIRECT_URI || `${process.env.BACKEND_URL}/api/auth/zoom/doctor/callback`;
const FRONTEND_URL = process.env.FRONTEND_URL;

// ==========================================
// GET OAuth URL for Doctor
// ==========================================
router.get("/url", verifyToken, async (req, res) => {
  try {
    const doctorId = req.user.id;
    
    // State parameter to verify callback
    const state = Buffer.from(JSON.stringify({ doctorId })).toString('base64');
    
    // Log the redirect URI being used
    logger.info("Generating Zoom OAuth URL", { 
      redirectUri: ZOOM_REDIRECT_URI,
      clientId: ZOOM_CLIENT_ID ? 'SET' : 'NOT_SET'
    });
    
    const authUrl = `https://zoom.us/oauth/authorize?response_type=code&client_id=${ZOOM_CLIENT_ID}&redirect_uri=${encodeURIComponent(ZOOM_REDIRECT_URI)}&state=${state}`;
    
    res.json({ url: authUrl });
  } catch (err) {
    logger.error("Error generating Zoom OAuth URL", { error: err.message });
    res.status(500).json({ message: "Failed to generate OAuth URL" });
  }
});

// ==========================================
// OAuth Callback Handler
// ==========================================
router.get("/callback", async (req, res) => {
  try {
    const { code, state } = req.query;
    
    if (!code || !state) {
      return res.redirect(`${FRONTEND_URL}/doctor/settings/zoom?error=missing_params`);
    }
    
    // Decode state to get doctorId
    let stateData;
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    } catch (e) {
      return res.redirect(`${FRONTEND_URL}/doctor/settings/zoom?error=invalid_state`);
    }
    
    const { doctorId } = stateData;
    
    // Log what we're sending to Zoom
    logger.info("Zoom OAuth token exchange attempt", { 
      redirectUri: ZOOM_REDIRECT_URI,
      hasCode: !!code,
      doctorId
    });

    // Exchange code for tokens
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', ZOOM_REDIRECT_URI);

    const tokenResponse = await axios.post('https://zoom.us/oauth/token', params, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    const tokens = tokenResponse.data;
    
    // Get user info
    const userResponse = await axios.get('https://api.zoom.us/v2/users/me', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`
      }
    });
    
    const accountId = userResponse.data.id;
    
    // Update doctor with tokens
    await DoctorModel.findByIdAndUpdate(doctorId, {
      zoomConnected: true,
      zoomTokens: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(Date.now() + (tokens.expires_in * 1000)),
        accountId: accountId
      }
    });
    
    logger.info("Doctor connected Zoom account", { doctorId, accountId });
    
    // Redirect back to settings with success
    res.redirect(`${FRONTEND_URL}/doctor/settings/zoom?success=true`);
  } catch (err) {
    logger.error("Zoom OAuth callback error", { error: err.message, details: err.response?.data });
    res.redirect(`${FRONTEND_URL}/doctor/settings/zoom?error=oauth_failed`);
  }
});

// ==========================================
// Get Connection Status
// ==========================================
router.get("/status", verifyToken, async (req, res) => {
  try {
    const doctorId = req.user.id;
    
    const doctor = await DoctorModel.findById(doctorId).select('zoomConnected zoomTokens.accountId');
    
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    
    res.json({
      connected: doctor.zoomConnected || false,
      accountId: doctor.zoomTokens?.accountId || null
    });
  } catch (err) {
    logger.error("Error checking Zoom status", { error: err.message });
    res.status(500).json({ message: "Server error" });
  }
});

// ==========================================
// Disconnect Zoom Account
// ==========================================
router.post("/disconnect", verifyToken, async (req, res) => {
  try {
    const doctorId = req.user.id;
    
    await DoctorModel.findByIdAndUpdate(doctorId, {
      zoomConnected: false,
      zoomTokens: {
        accessToken: null,
        refreshToken: null,
        expiresAt: null,
        accountId: null
      }
    });
    
    logger.info("Doctor disconnected Zoom account", { doctorId });
    
    res.json({ message: "Zoom account disconnected successfully" });
  } catch (err) {
    logger.error("Error disconnecting Zoom", { error: err.message });
    res.status(500).json({ message: "Failed to disconnect" });
  }
});

module.exports = router;
