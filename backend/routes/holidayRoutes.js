const express = require("express");
const router = express.Router();
const holidayController = require("../controllers/holidayController");
const { verifyToken } = require("../middleware/auth");

router.get("/", verifyToken, holidayController.getHolidays);
router.post("/", verifyToken, holidayController.createHoliday);
router.put("/:id", verifyToken, holidayController.updateHoliday);
router.delete("/:id", verifyToken, holidayController.deleteHoliday);

module.exports = router;
