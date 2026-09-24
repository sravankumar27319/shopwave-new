import { Router } from "express";
import {
  listAddresses,
  getSingleAddress,
  createAddressHandler,
  updateAddressHandler,
  deleteAddressHandler,
  setDefaultAddressHandler,
} from "../controllers/addressController.js";
import { authenticate } from "../middleware/index.js";

const router = Router();

router.use(authenticate);

router.get("/", listAddresses);
router.post("/", createAddressHandler);
router.get("/:id", getSingleAddress);
router.patch("/:id", updateAddressHandler);
router.delete("/:id", deleteAddressHandler);
router.patch("/:id/default", setDefaultAddressHandler);

export default router;
