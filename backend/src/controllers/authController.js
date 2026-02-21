const User = require("../models/User");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");

const normalizeRole = (role) => {
  if (!role) return "citizen";
  const raw = role.toString().trim().toLowerCase();
  if (raw === "official" || raw === "government official") return "official";
  return "citizen";
};

const serializeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  location: user.location,
  isVerified: user.isVerified,
  officialApprovalStatus: user.officialApprovalStatus
});

// REGISTER
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, location, idVerification } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    // check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists"
      });
    }

    const normalizedRole = normalizeRole(role);

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    let officialApprovalStatus = "approved";
    let approvedBy = null;
    let approvedAt = null;
    let isVerified = false;

    if (normalizedRole === "official") {
      const approvedOfficialsCount = await User.countDocuments({
        role: "official",
        officialApprovalStatus: "approved"
      });

      if (approvedOfficialsCount === 0) {
        officialApprovalStatus = "approved";
        approvedAt = new Date();
        isVerified = true;
      } else {
        officialApprovalStatus = "pending";
      }
    }

    // create user
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: normalizedRole,
      location: location || "",
      idVerification: idVerification || "",
      isVerified,
      officialApprovalStatus,
      approvedBy,
      approvedAt
    });

    await user.save();

    if (normalizedRole === "official" && officialApprovalStatus === "pending") {
      return res.status(201).json({
        message: "Official registered and awaiting approval from an approved official",
        user: serializeUser(user)
      });
    }

    const token = generateToken(user);

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: serializeUser(user)
    });

  } catch (error) {
    res.status(500).json({
      message: "Error registering user",
      error: error.message
    });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials"
      });
    }

    if (user.role === "official" && user.officialApprovalStatus !== "approved") {
      return res.status(403).json({
        message: "Official account is pending approval"
      });
    }

    const token = generateToken(user);

    res.json({
      message: "Login successful",
      token,
      user: serializeUser(user)
    });

  } catch (error) {
    res.status(500).json({
      message: "Error logging in",
      error: error.message
    });
  }
};

exports.me = async (req, res) => {
  res.json({ user: req.user });
};

exports.listPendingOfficials = async (req, res) => {
  try {
    const pendingOfficials = await User.find({
      role: "official",
      officialApprovalStatus: "pending"
    }).select("name email location createdAt officialApprovalStatus");

    res.json({
      count: pendingOfficials.length,
      pendingOfficials
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching pending officials",
      error: error.message
    });
  }
};

exports.approveOfficial = async (req, res) => {
  try {
    const { officialId } = req.params;

    if (req.user.role !== "official" || req.user.officialApprovalStatus !== "approved") {
      return res.status(403).json({ message: "Only approved officials can approve registrations" });
    }

    const pendingOfficial = await User.findById(officialId);

    if (!pendingOfficial || pendingOfficial.role !== "official") {
      return res.status(404).json({ message: "Official user not found" });
    }

    if (pendingOfficial.officialApprovalStatus === "approved") {
      return res.status(400).json({ message: "Official is already approved" });
    }

    pendingOfficial.officialApprovalStatus = "approved";
    pendingOfficial.approvedBy = req.user._id;
    pendingOfficial.approvedAt = new Date();
    pendingOfficial.isVerified = true;

    await pendingOfficial.save();

    res.json({
      message: "Official registration approved",
      user: serializeUser(pendingOfficial)
    });
  } catch (error) {
    res.status(500).json({
      message: "Error approving official",
      error: error.message
    });
  }
};