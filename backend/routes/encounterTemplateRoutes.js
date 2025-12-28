const express = require("express");
const router = express.Router();
const encounterTemplateController = require("../controllers/encounterTemplateController");
const { verifyToken } = require("../middleware/auth");

router.post("/", verifyToken, encounterTemplateController.createTemplate);
router.get("/", verifyToken, encounterTemplateController.getTemplates);
router.get("/:id", verifyToken, encounterTemplateController.getTemplateById);
router.put("/:id", verifyToken, encounterTemplateController.updateTemplate);
router.delete("/:id", verifyToken, encounterTemplateController.deleteTemplate);

module.exports = router;

