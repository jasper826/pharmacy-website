const mongoose = require('mongoose');
require('dotenv').config();
const Medicine = require('./models/Medicine');

const sampleMedicines = [
  {
    name: "Amoxicillin 500mg",
    genericName: "Amoxicillin",
    category: "Antibiotics",
    price: 150,
    description: "Broad-spectrum aminopenicillin for bacterial infections.",
    sideEffects: ["Nausea", "Diarrhea", "Skin rash", "Hypersensitivity reactions"],
    counselingNotes: "Take at evenly spaced intervals. Complete full course even if feeling better.",
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop"
  },
  {
    name: "Warfarin 5mg",
    genericName: "Warfarin Sodium",
    category: "Anticoagulants",
    price: 200,
    description: "Vitamin K antagonist for blood clot prevention.",
    sideEffects: ["Bleeding/bruising risk", "Alopecia", "GI distress"],
    counselingNotes: "Maintain consistent Vitamin K intake. Report unusual bleeding or dark stools immediately.",
    image: "https://images.unsplash.com/photo-1585435557343-3b092031a831?w=300&auto=format&fit=crop"
  },
  {
    name: "Aspirin 81mg",
    genericName: "Acetylsalicylic Acid",
    category: "Anticoagulants",
    price: 90,
    description: "Low-dose antiplatelet therapy for cardiovascular protection.",
    sideEffects: ["Gastric irritation", "Increased bleeding risk", "Dyspepsia"],
    counselingNotes: "Take with food or a full glass of water to minimize stomach irritation.",
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop"
  },
  {
    name: "Ibuprofen 400mg",
    genericName: "Ibuprofen",
    category: "Analgesics & Pain Relief",
    price: 110,
    description: "NSAID for pain reduction and systemic anti-inflammatory relief.",
    sideEffects: ["Epigastric pain", "Heartburn", "Fluid retention", "Dizziness"],
    counselingNotes: "Always take after food or meals to protect the gastric mucosal barrier.",
    image: "https://images.unsplash.com/photo-1576602976047-174e57a47881?w=300&auto=format&fit=crop"
  },
  {
    name: "Amlodipine 5mg",
    genericName: "Amlodipine Besylate",
    category: "Stroke & Cardiovascular",
    price: 180,
    description: "Dihydropyridine calcium channel blocker for hypertension.",
    sideEffects: ["Peripheral edema (swollen ankles)", "Flushing", "Dizziness", "Headache"],
    counselingNotes: "Can be taken with or without food. Avoid abrupt discontinuation.",
    image: "https://images.unsplash.com/photo-1585435557343-3b092031a831?w=300&auto=format&fit=crop"
  },
  {
    name: "Artemether/Lumefantrine (Coartem)",
    genericName: "Artemether + Lumefantrine",
    category: "Antimalarials",
    price: 190,
    description: "Artemisinin-based combination therapy (ACT) for uncomplicated P. falciparum malaria.",
    sideEffects: ["Anorexia", "Palpitations", "Headache", "Myalgia"],
    counselingNotes: "Take with fatty food or milk to significantly enhance Lumefantrine absorption.",
    image: "https://images.unsplash.com/photo-1576602976047-174e57a47881?w=300&auto=format&fit=crop"
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/careplus_pharmacy');
    await Medicine.deleteMany({}); // Clears old entries
    await Medicine.insertMany(sampleMedicines);
    console.log('✅ Medicine Catalog successfully seeded with clinical data!');
    mongoose.connection.close();
  } catch (err) {
    console.error('❌ Error seeding database:', err);
  }
};

seedDB();