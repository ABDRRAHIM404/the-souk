/**
 * The Souk — Database Seed Script
 *
 * Usage (from your backend root):
 *   npx ts-node seed.ts
 *   -- or, if you have a script in package.json --
 *   npm run seed
 *
 * Add to package.json scripts:
 *   "seed": "ts-node seed.ts"
 *
 * Requires: MONGO_URI in your .env file
 * Drops all existing Users, Cooperatives, Products, Reviews before inserting.
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

// ─── Inline minimal schemas (avoids import path issues) ───────────────────────
// If your models are importable from here, replace these with your actual imports:
// import User from "./src/models/User";
// import Cooperative from "./src/models/Cooperative";
// import Product from "./src/models/Product";
// import Review from "./src/models/Review";

const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true, lowercase: true },
    password: String,
    role: String,
    avatar: { type: String, default: "" },
    country: { type: String, default: "" },
    cooperativeId: { type: mongoose.Schema.Types.ObjectId, ref: "Cooperative", default: null }, // ← added
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  },
  { timestamps: true }
);
const User = mongoose.models.User ?? mongoose.model("User", UserSchema);

const CooperativeSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: String,
    description: String,
    location: { city: String, region: String },
    category: String,
    coverImage: { type: String, default: "" },
    photos: [String],
    verified: { type: Boolean, default: false },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);
const Cooperative = mongoose.models.Cooperative ?? mongoose.model("Cooperative", CooperativeSchema);

const ProductSchema = new mongoose.Schema(
  {
    cooperative: { type: mongoose.Schema.Types.ObjectId, ref: "Cooperative" },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: String,
    description: String,
    category: String,
    price: Number,
    fairTradeCertified: { type: Boolean, default: true },
    images: [String],
    stock: { type: Number, default: 1 },
    origin: { type: String, default: "" },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);
const Product = mongoose.models.Product ?? mongoose.model("Product", ProductSchema);

const ReviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    rating: Number,
    comment: String,
    photo: { type: String, default: "" },
  },
  { timestamps: true }
);
const Review = mongoose.models.Review ?? mongoose.model("Review", ReviewSchema);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const hash = (pw: string) => bcrypt.hash(pw, 12);

// ─── Data ─────────────────────────────────────────────────────────────────────

const TOURIST_PASSWORD = "tourist123";
const COOP_PASSWORD = "coop1234";

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌  MONGO_URI not found in .env — expected MONGODB_URI");
    process.exit(1);
  }

  console.log("🔌  Connecting to MongoDB Atlas…");
  await mongoose.connect(uri);
  console.log("✅  Connected\n");

  // ── Wipe ────────────────────────────────────────────────────────────────────
  console.log("🗑️   Dropping existing collections…");
  await Promise.all([
    User.deleteMany({}),
    Cooperative.deleteMany({}),
    Product.deleteMany({}),
    Review.deleteMany({}),
  ]);
  console.log("✅  Collections cleared\n");

  // ── Users ───────────────────────────────────────────────────────────────────
  console.log("👤  Creating users…");

  const tourists = await User.insertMany([
    {
      name: "Sophie Martin",
      email: "sophie@tourist.com",
      password: await hash(TOURIST_PASSWORD),
      role: "tourist",
      country: "France",
      avatar: "",
      wishlist: [],
    },
    {
      name: "James Okafor",
      email: "james@tourist.com",
      password: await hash(TOURIST_PASSWORD),
      role: "tourist",
      country: "United Kingdom",
      avatar: "",
      wishlist: [],
    },
  ]);

  const coopOwners = await User.insertMany([
    {
      name: "Fatima Ait Baha",
      email: "fatima@coop.com",
      password: await hash(COOP_PASSWORD),
      role: "coop_owner",
      country: "Morocco",
      avatar: "",
      wishlist: [],
    },
    {
      name: "Hassan Ouarzazate",
      email: "hassan@coop.com",
      password: await hash(COOP_PASSWORD),
      role: "coop_owner",
      country: "Morocco",
      avatar: "",
      wishlist: [],
    },
    {
      name: "Aicha Tiznit",
      email: "aicha@coop.com",
      password: await hash(COOP_PASSWORD),
      role: "coop_owner",
      country: "Morocco",
      avatar: "",
      wishlist: [],
    },
  ]);

  console.log(`   ✔ ${tourists.length} tourists, ${coopOwners.length} coop owners\n`);

  // ── Cooperatives ─────────────────────────────────────────────────────────────
  console.log("🏺  Creating cooperatives…");

  const coops = await Cooperative.insertMany([
    {
      owner: coopOwners[0]._id,
      name: "Coopérative Tiziri",
      description:
        "Founded in 2008 by a group of Amazigh women in the foothills of the Anti-Atlas, Tiziri specialises in hand-woven carpets and textiles using traditional berber patterns passed down through generations. Every purchase directly funds education programmes for the artisans' children.",
      location: { city: "Taroudannt", region: "Souss-Massa" },
      category: "carpets",
      coverImage: "",
      photos: [],
      verified: true,
      followers: [tourists[0]._id],
    },
    {
      owner: coopOwners[1]._id,
      name: "Argan d'Or",
      description:
        "A certified fair-trade argan oil cooperative run by 34 women from the Souss valley. We cold-press every drop by hand using traditional stone mills, producing culinary and cosmetic argan oil of exceptional purity. Profits are split equally among members.",
      location: { city: "Agadir", region: "Souss-Massa" },
      category: "argan",
      coverImage: "",
      photos: [],
      verified: true,
      followers: [tourists[0]._id, tourists[1]._id],
    },
    {
      owner: coopOwners[2]._id,
      name: "Poteries de Tiznit",
      description:
        "Three generations of potters from the walled city of Tiznit. We craft hand-painted terracotta using clay sourced locally from the Souss river bed, fired in a traditional wood kiln. Each piece is unique — no moulds, no machines.",
      location: { city: "Tiznit", region: "Souss-Massa" },
      category: "pottery",
      coverImage: "",
      photos: [],
      verified: false,
      followers: [],
    },
  ]);

  // ── Backfill cooperativeId onto coop owner users ─────────────────────────────
  await Promise.all(
    coops.map((coop, i) =>
      User.findByIdAndUpdate(coopOwners[i]._id, { cooperativeId: coop._id })
    )
  );
  console.log(`   ✔ ${coops.length} cooperatives (cooperativeId backfilled onto owners)\n`);

  // ── Products ─────────────────────────────────────────────────────────────────
  console.log("🛍️   Creating products…");

  const products = await Product.insertMany([
    // Tiziri — carpets
    {
      cooperative: coops[0]._id,
      postedBy: coopOwners[0]._id,
      name: "Beni Ourain Berber Rug — Small",
      description:
        "Hand-knotted wool rug in the classic Beni Ourain style, featuring bold black geometric motifs on an ivory background. Approx. 120 × 80 cm. Each rug takes 3–4 weeks to complete on a traditional loom and is one of a kind.",
      category: "carpets",
      price: 950,
      fairTradeCertified: true,
      images: [],
      stock: 3,
      origin: "Taroudannt, Souss-Massa",
      isAvailable: true,
    },
    {
      cooperative: coops[0]._id,
      postedBy: coopOwners[0]._id,
      name: "Kilim Flatweave Runner",
      description:
        "Vibrant flatweave kilim runner in red, orange and cream, hand-woven on a horizontal loom using undyed natural wool and plant-based dyes. 200 × 60 cm. Ideal for hallways or layering over larger rugs.",
      category: "carpets",
      price: 680,
      fairTradeCertified: true,
      images: [],
      stock: 5,
      origin: "Taroudannt, Souss-Massa",
      isAvailable: true,
    },
    {
      cooperative: coops[0]._id,
      postedBy: coopOwners[0]._id,
      name: "Hand-woven Wool Cushion Cover",
      description:
        "50 × 50 cm cushion cover woven in traditional Amazigh diamond and chevron patterns, using hand-spun merino wool dyed with pomegranate rind and indigo. Zipper closure. Insert not included.",
      category: "carpets",
      price: 185,
      fairTradeCertified: true,
      images: [],
      stock: 12,
      origin: "Taroudannt, Souss-Massa",
      isAvailable: true,
    },
    // Argan d'Or — argan
    {
      cooperative: coops[1]._id,
      postedBy: coopOwners[1]._id,
      name: "Cold-Pressed Culinary Argan Oil 250ml",
      description:
        "Rich, nutty cold-pressed argan oil for cooking, drizzling and dipping. Hand-extracted from sun-dried argan kernels using a stone mill, then filtered and bottled within 48 hours. No additives, no heat treatment. Certified organic.",
      category: "argan",
      price: 120,
      fairTradeCertified: true,
      images: [],
      stock: 40,
      origin: "Agadir, Souss-Massa",
      isAvailable: true,
    },
    {
      cooperative: coops[1]._id,
      postedBy: coopOwners[1]._id,
      name: "Cosmetic Argan Oil 50ml",
      description:
        "Pure cosmetic-grade argan oil, cold-pressed from unroasted kernels. Lightweight, fast-absorbing, rich in Vitamin E and omega fatty acids. Suitable for face, hair and body. Glass dropper bottle.",
      category: "argan",
      price: 95,
      fairTradeCertified: true,
      images: [],
      stock: 60,
      origin: "Agadir, Souss-Massa",
      isAvailable: true,
    },
    {
      cooperative: coops[1]._id,
      postedBy: coopOwners[1]._id,
      name: "Amlou — Argan & Almond Spread 200g",
      description:
        "Traditional Amazigh breakfast spread made from stone-ground argan oil, roasted almonds and raw honey. No palm oil, no preservatives. Eaten with Moroccan bread or drizzled over pancakes. 200g glass jar.",
      category: "argan",
      price: 75,
      fairTradeCertified: true,
      images: [],
      stock: 25,
      origin: "Agadir, Souss-Massa",
      isAvailable: true,
    },
    {
      cooperative: coops[1]._id,
      postedBy: coopOwners[1]._id,
      name: "Argan Gift Set — Oil + Amlou + Soap",
      description:
        "A curated gift set containing 100ml culinary argan oil, 200g amlou spread, and a handmade black soap (beldi) infused with argan. Presented in a hand-stamped kraft box with a card explaining the cooperative's story.",
      category: "argan",
      price: 260,
      fairTradeCertified: true,
      images: [],
      stock: 15,
      origin: "Agadir, Souss-Massa",
      isAvailable: true,
    },
    // Poteries de Tiznit — pottery
    {
      cooperative: coops[2]._id,
      postedBy: coopOwners[2]._id,
      name: "Hand-Painted Terracotta Tagine",
      description:
        "Traditional Moroccan tagine, hand-thrown on a wheel and painted with geometric berber motifs in cobalt and terracotta. Lead-free glazes, food safe, suitable for gas and electric hobs (not induction). Serves 2–3.",
      category: "pottery",
      price: 320,
      fairTradeCertified: false,
      images: [],
      stock: 8,
      origin: "Tiznit, Souss-Massa",
      isAvailable: true,
    },
    {
      cooperative: coops[2]._id,
      postedBy: coopOwners[2]._id,
      name: "Set of 4 Painted Espresso Cups",
      description:
        "Set of four hand-thrown terracotta espresso cups, each individually painted in a different traditional Tiznit pattern — no two are exactly alike. Food-safe, dishwasher-safe glaze. Capacity approx. 80ml each.",
      category: "pottery",
      price: 210,
      fairTradeCertified: false,
      images: [],
      stock: 10,
      origin: "Tiznit, Souss-Massa",
      isAvailable: true,
    },
    {
      cooperative: coops[2]._id,
      postedBy: coopOwners[2]._id,
      name: "Large Decorative Berber Plate",
      description:
        "A showpiece hand-painted terracotta plate, 38cm diameter, featuring a full Amazigh motif in burnt orange, black and white. Wall-hanging wire included. Made to order — allow 10 days for firing and painting.",
      category: "pottery",
      price: 450,
      fairTradeCertified: false,
      images: [],
      stock: 4,
      origin: "Tiznit, Souss-Massa",
      isAvailable: true,
    },
    {
      cooperative: coops[2]._id,
      postedBy: coopOwners[2]._id,
      name: "Unglazed Clay Water Jug",
      description:
        "Traditional unglazed terracotta water jug (guella), hand-formed and naturally porous so water stays cool through evaporation. 1.5L capacity. A functional piece of living heritage used in Moroccan homes for centuries.",
      category: "pottery",
      price: 140,
      fairTradeCertified: false,
      images: [],
      stock: 7,
      origin: "Tiznit, Souss-Massa",
      isAvailable: true,
    },
    {
      cooperative: coops[2]._id,
      postedBy: coopOwners[2]._id,
      name: "Mini Pottery Starter Set",
      description:
        "A small taster set of Tiznit pottery: one espresso cup, one small bowl and one incense holder, each in a different glaze style. Presented in a recycled cardboard box with a note about the cooperative. Perfect souvenir.",
      category: "pottery",
      price: 165,
      fairTradeCertified: false,
      images: [],
      stock: 20,
      origin: "Tiznit, Souss-Massa",
      isAvailable: true,
    },
  ]);

  console.log(`   ✔ ${products.length} products\n`);

  // ── Reviews ──────────────────────────────────────────────────────────────────
  console.log("⭐  Creating reviews…");

  await Review.insertMany([
    {
      product: products[0]._id, // Beni Ourain rug
      reviewer: tourists[0]._id,
      rating: 5,
      comment:
        "Absolutely stunning rug. The quality is incredible — you can feel how much work went into it. Arrived carefully packaged and looks even better in person than in the description.",
      photo: "",
    },
    {
      product: products[0]._id,
      reviewer: tourists[1]._id,
      rating: 4,
      comment:
        "Beautiful piece, very authentic. Slight colour variation from what I expected but that's part of the handmade charm. Would definitely buy from Tiziri again.",
      photo: "",
    },
    {
      product: products[3]._id, // Culinary argan oil
      reviewer: tourists[0]._id,
      rating: 5,
      comment:
        "The best argan oil I've ever tasted. Nutty, rich, nothing like the supermarket versions. I've already ordered a second bottle for my sister.",
      photo: "",
    },
    {
      product: products[3]._id,
      reviewer: tourists[1]._id,
      rating: 5,
      comment:
        "World-class product. I drizzle it on everything now. The story of the cooperative makes it taste even better.",
      photo: "",
    },
    {
      product: products[5]._id, // Amlou
      reviewer: tourists[0]._id,
      rating: 5,
      comment:
        "I bought this on a whim and now it's a household staple. Unbelievably good on fresh bread. The honey and argan balance is perfect.",
      photo: "",
    },
    {
      product: products[7]._id, // Tagine
      reviewer: tourists[1]._id,
      rating: 4,
      comment:
        "Gorgeous tagine, beautiful painting. Works perfectly on my gas hob. One small chip on the lid from shipping but the seller sorted it immediately — great service.",
      photo: "",
    },
    {
      product: products[8]._id, // Espresso cups
      reviewer: tourists[0]._id,
      rating: 5,
      comment:
        "These cups are a joy. Each one is different and they look incredible on a coffee table. My guests always ask about them.",
      photo: "",
    },
    {
      product: products[2]._id, // Cushion cover
      reviewer: tourists[1]._id,
      rating: 4,
      comment:
        "Great quality, the colours are vibrant and the weave is tight. Took about 2 weeks to arrive but worth the wait.",
      photo: "",
    },
  ]);

  console.log(`   ✔ 8 reviews\n`);

  // ── Wishlist items ────────────────────────────────────────────────────────────
  await User.findByIdAndUpdate(tourists[0]._id, {
    wishlist: [products[3]._id, products[7]._id, products[0]._id],
  });
  await User.findByIdAndUpdate(tourists[1]._id, {
    wishlist: [products[5]._id, products[8]._id],
  });

  // ── Summary ───────────────────────────────────────────────────────────────────
  console.log("─────────────────────────────────────────");
  console.log("✅  Seed complete!\n");
  console.log("📋  Test accounts:");
  console.log("   TOURISTS");
  console.log(`   Email: sophie@tourist.com   Password: ${TOURIST_PASSWORD}`);
  console.log(`   Email: james@tourist.com    Password: ${TOURIST_PASSWORD}`);
  console.log("");
  console.log("   COOP OWNERS");
  console.log(`   Email: fatima@coop.com      Password: ${COOP_PASSWORD}  → Coopérative Tiziri (carpets)`);
  console.log(`   Email: hassan@coop.com      Password: ${COOP_PASSWORD}  → Argan d'Or (argan)`);
  console.log(`   Email: aicha@coop.com       Password: ${COOP_PASSWORD}  → Poteries de Tiznit (pottery)`);
  console.log("─────────────────────────────────────────");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌  Seed failed:", err);
  mongoose.disconnect();
  process.exit(1);
});