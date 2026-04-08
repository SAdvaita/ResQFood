import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const { Schema, model } = mongoose;

// ─── Embedded Sub-schemas ────────────────────────────────────────────────────

/** Embedded: profile snapshot for denormalised references in other collections */
const profileSnapshotSchema = new Schema(
  {
    name:      { type: String },
    role:      { type: String },
    avatarUrl: { type: String, default: null }
  },
  { _id: false }
);

/** Embedded: refresh tokens stored in the user document */
const refreshTokenEntrySchema = new Schema(
  {
    token:     { type: String, required: true },
    createdAt: { type: Date,   default: Date.now }
  },
  { _id: false }
);

// ─── Main User Schema ─────────────────────────────────────────────────────────

const userSchema = new Schema(
  {
    // ── Core identity ──────────────────────────────
    name:         { type: String, required: true, trim: true },
    email:        { type: String, required: true, trim: true, lowercase: true },
    phone:        { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },

    // ── Role & approval ────────────────────────────
    role: {
      type:    String,
      enum:    ["customer", "ngo", "volunteer", "admin", "employee"],
      required: true
    },
    approvalStatus: {
      type:    String,
      enum:    ["pending", "approved", "rejected"],
      default: "pending"
    },
    isActive: { type: Boolean, default: true },

    // ── Verification flags ─────────────────────────────
    emailVerified:   { type: Boolean, default: false },
    emailVerifiedAt: { type: Date,    default: null  },
    phoneVerified:   { type: Boolean, default: false },

    /** Reference: employee sub-role links to parent customer user */
    parentCustomerId: {
      type: Schema.Types.ObjectId,
      ref:  "User",
      default: null
    },

    // ── Location (GeoJSON – enables 2dsphere index) ─
    location: {
      type:        { type: String, enum: ["Point"] },
      coordinates: { type: [Number] }
    },
    address: { type: String, default: null },

    // ── Login lockout ──────────────────────────────
    loginAttempts: { type: Number,  default: 0 },
    lockUntil:     { type: Date,    default: null },

    // ── Embedded: refresh tokens array ─────────────
    refreshTokens: [refreshTokenEntrySchema],

    // ── Embedded: profile snapshot ─────────────────
    profileSnapshot: profileSnapshotSchema,

    // ── Document uploads (paths/URLs) ─────────────
    documents: [String]
  },
  {
    timestamps: true,   // createdAt, updatedAt
    collection: "users"
  }
);

// ─── Indexing ─────────────────────────────────────────────────────────────────

userSchema.index({ email: 1 },                        { unique: true });
userSchema.index({ phone: 1 },                        { unique: true });
userSchema.index({ location: "2dsphere" });                             // geo queries
userSchema.index({ approvalStatus: 1, role: 1 });                       // admin filtering
userSchema.index({ role: 1, isActive: 1 });                             // dashboard queries

// ─── Virtual ─────────────────────────────────────────────────────────────────

userSchema.virtual("isLocked").get(function () {
  return this.lockUntil && this.lockUntil > Date.now();
});

// ─── Methods ─────────────────────────────────────────────────────────────────

/** Compare plain password against stored hash */
userSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

/** Increment failed login attempts; lock account after 4 failures for 5 minutes */
userSchema.methods.incrementLoginAttempts = async function () {
  const MAX_ATTEMPTS = 4;
  const LOCK_TIME_MS = 5 * 60 * 1000; // 5 minutes

  // if previous lock expired, reset and start fresh
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1, lockUntil: null }
    });
  }

  const update = { $inc: { loginAttempts: 1 } };

  // lock on the 4th failure
  if (this.loginAttempts + 1 >= MAX_ATTEMPTS) {
    update.$set = { lockUntil: new Date(Date.now() + LOCK_TIME_MS) };
  }

  return this.updateOne(update);
};

/** Reset attempts + lock after successful login */
userSchema.methods.resetLoginAttempts = async function () {
  return this.updateOne({
    $set:   { loginAttempts: 0, lockUntil: null }
  });
};

/** Sync embedded profile snapshot from current doc state */
userSchema.methods.syncSnapshot = async function () {
  this.profileSnapshot = { name: this.name, role: this.role };
  return this.save();
};

// ─── Statics ─────────────────────────────────────────────────────────────────

/** Find a user by email OR phone (used for login) */
userSchema.statics.findByIdentifier = function (identifier) {
  return this.findOne({
    $or: [
      { email: identifier.toLowerCase().trim() },
      { phone: identifier.trim() }
    ]
  });
};

/** Find all pending users for admin approval */
userSchema.statics.findPendingApprovals = function () {
  return this.find({ approvalStatus: "pending" }).sort({ createdAt: 1 });
};

// ─── Pre-save Hook ────────────────────────────────────────────────────────────

userSchema.pre("save", function (next) {
  // keep snapshot in sync on save
  if (this.isModified("name") || this.isModified("role")) {
    this.profileSnapshot = {
      name:      this.name,
      role:      this.role,
      avatarUrl: this.profileSnapshot?.avatarUrl ?? null
    };
  }
  next();
});

const User = model("User", userSchema);

export default User;
