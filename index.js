const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Connect MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("MongoDB Connected ✅"))
  .catch(err => console.log(err));

// Schemas
const userSchema = new mongoose.Schema({
  telegram_id: String,
  username: String,
  balance: { type: Number, default: 0 },
  referral_code: String,
  referred_by: String,
  daily_clicks: { type: Map, of: Number, default: {} }
});

const User = mongoose.model("User", userSchema);

// Routes
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

// API Example: Add click + balance
app.post("/click", async (req, res) => {
  const { telegram_id, slot } = req.body;
  let user = await User.findOne({ telegram_id });
  if (!user) return res.status(404).send("User not found");

  let clicks = user.daily_clicks.get(slot) || 0;
  if (clicks >= 10) return res.status(400).send("Daily click limit reached");

  // Add click & reward
  user.daily_clicks.set(slot, clicks + 1);
  user.balance += 0.1; // reward per click
  await user.save();

  res.json({ balance: user.balance, clicks: clicks + 1 });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port", PORT));
