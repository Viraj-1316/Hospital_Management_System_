const express = require("express");
const router = express.Router();
const encounterTemplateController = require("../controllers/encounterTemplateController");

router.post("/", encounterTemplateController.createTemplate);
router.get("/", encounterTemplateController.getTemplates);
router.get("/:id", encounterTemplateController.getTemplateById);
router.put("/:id", encounterTemplateController.updateTemplate);
router.delete("/:id", encounterTemplateController.deleteTemplate);

module.exports = router;
