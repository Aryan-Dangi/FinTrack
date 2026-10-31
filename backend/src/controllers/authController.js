const User = require("../models/User");
const jwt = require("jsonwebtoken");
const signup = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists with this email.",
      });
    }

    const user = await User.create({
    fullName,
    email,
    password,
    });

    // Generate tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Save refresh token in database
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // Send refresh token as HttpOnly cookie
    res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: false,      // true in production (HTTPS)
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
    success: true,
    message: "Account created successfully.",
    accessToken,
    user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        currency: user.currency,
    },
    });
  } catch (error) {
    console.error("Signup Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    
    const user = await User.findOne({ email }).select("+password");

    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    
    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Save refresh token in MongoDB
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // Send refresh token as HttpOnly cookie
    res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: false,      // true after deployment (HTTPS)
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      accessToken,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        currency: user.currency,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};


const getMe = async(req,res)=>{
  return res.status(200).json({
    success: true,
    user:{
      id: req.user._id,
      fullName: req.user.fullName,
      email: req.user.email,
      currency: req.user.currency,
      monthlyBudget: req.user.monthlyBudget,
      avatar: req.user.avatar,
      isEmailVerified: req.user.isEmailVerified,
      createdAt: req.user.createdAt,
    }
  })
}

const refreshAccessToken = async (req, res) => {
  try {
    const incomingRefreshToken = req.cookies.refreshToken;

    if (!incomingRefreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token missing.",
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(
      incomingRefreshToken,
      process.env.JWT_REFRESH_SECRET
    );

    // Find user and explicitly include refreshToken
    const user = await User.findById(decoded.id).select("+refreshToken");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found.",
      });
    }

    // Make sure the token belongs to the current session
    if (user.refreshToken !== incomingRefreshToken) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token.",
      });
    }

    // Generate new access token
    const accessToken = user.generateAccessToken();

    return res.status(200).json({
      success: true,
      accessToken,
    });
  } catch (error) {
    console.error("Refresh Token Error:", error);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token.",
    });
  }
};

const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      await User.findOneAndUpdate(
        { refreshToken },
        { $set: { refreshToken: "" } }
      );
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    console.error("Logout Error:", error);

    return res.status(500).json({
      success: false,
      message: "Logout failed.",
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { fullName, currency } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (fullName !== undefined) {
      if (typeof fullName !== "string" || fullName.trim().length < 3 || fullName.trim().length > 50) {
        return res.status(400).json({
          success: false,
          message: "Full name must be between 3 and 50 characters.",
        });
      }

      user.fullName = fullName.trim();
    }

    if (currency !== undefined) {
      if (!["INR", "USD", "EUR", "GBP"].includes(currency)) {
        return res.status(400).json({
          success: false,
          message: "Unsupported currency.",
        });
      }

      user.currency = currency;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        currency: user.currency,
        monthlyBudget: user.monthlyBudget,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Update Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update profile.",
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string" ||
      newPassword.length < 8
    ) {
      return res.status(400).json({
        success: false,
        message: "Provide your current password and a new password of at least 8 characters.",
      });
    }

    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const isCurrentPasswordValid = await user.comparePassword(currentPassword);

    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("Change Password Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to change password.",
    });
  }
};

module.exports = {
  signup,login,getMe,refreshAccessToken,logout,changePassword,updateProfile
};