const mongoose = require('mongoose');
require('dotenv').config();
const Medicine = require('./models/medicine');

const sampleMedicines = [
  // Antibiotics
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
    name: "Azithromycin 250mg",
    genericName: "Azithromycin",
    category: "Antibiotics",
    price: 280,
    description: "Macrolide antibiotic that treats respiratory and skin infections.",
    sideEffects: ["Abdominal pain", "Nausea", "Diarrhea", "Headache"],
    counselingNotes: "Take 1 hour before or 2 hours after meals for best absorption.",
    image: "https://images.unsplash.com/photo-1576602976047-174e57a47881?w=300&auto=format&fit=crop"
  },
  {
    name: "Ciprofloxacin 500mg",
    genericName: "Ciprofloxacin",
    category: "Antibiotics",
    price: 220,
    description: "Fluoroquinolone effective against urinary tract and chest infections.",
    sideEffects: ["Nausea", "Tendon discomfort", "Dizziness", "Sun sensitivity"],
    counselingNotes: "Drink plenty of fluids. Avoid taking with antacids, iron, or dairy simultaneously.",
    image: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=300&auto=format&fit=crop"
  },

  // Anticoagulants
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
    description: "Low-dose antiplatelet therapy for cardiovascular protection and clot prevention.",
    sideEffects: ["Gastric irritation", "Increased bleeding risk", "Dyspepsia"],
    counselingNotes: "Take with food or a full glass of water to minimize stomach irritation.",
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop"
  },
  {
    name: "Rivaroxaban 15mg",
    genericName: "Rivaroxaban",
    category: "Anticoagulants",
    price: 450,
    description: "Direct oral anticoagulant (DOAC) for deep vein thrombosis and stroke prevention in AFib.",
    sideEffects: ["Bleeding risk", "Dizziness", "Fatigue"],
    counselingNotes: "Take with the evening meal. Do not skip doses.",
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop"
  },

  // Analgesics & Pain Relief
  {
    name: "Paracetamol 500mg",
    genericName: "Acetaminophen",
    category: "Analgesics & Pain Relief",
    price: 60,
    description: "First-line analgesic and antipyretic for quick pain relief and fever reduction.",
    sideEffects: ["Rare hepatotoxicity at excessive doses"],
    counselingNotes: "Do not exceed 4000mg per 24 hours. Check other cold medicines for paracetamol content.",
    image: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=300&auto=format&fit=crop"
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
    name: "Diclofenac 50mg",
    genericName: "Diclofenac Sodium",
    category: "Analgesics & Pain Relief",
    price: 130,
    description: "Potent NSAID that relieves joint pain, osteoarthritis, and acute inflammation.",
    sideEffects: ["Stomach upset", "Dizziness", "Headache"],
    counselingNotes: "Take with plenty of water immediately after eating.",
    image: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=300&auto=format&fit=crop"
  },

  // Stroke & Cardiovascular
  {
    name: "Amlodipine 5mg",
    genericName: "Amlodipine Besylate",
    category: "Stroke & Cardiovascular",
    price: 180,
    description: "Dihydropyridine calcium channel blocker for hypertension and angina.",
    sideEffects: ["Peripheral edema (swollen ankles)", "Flushing", "Dizziness", "Headache"],
    counselingNotes: "Can be taken with or without food. Avoid abrupt discontinuation.",
    image: "https://images.unsplash.com/photo-1585435557343-3b092031a831?w=300&auto=format&fit=crop"
  },
  {
    name: "Clopidogrel 75mg",
    genericName: "Clopidogrel",
    category: "Stroke & Cardiovascular",
    price: 320,
    description: "Antiplatelet medication that prevents harmful blood clots after stroke or heart attack.",
    sideEffects: ["Easy bruising", "Minor nosebleeds", "GI irritation"],
    counselingNotes: "Inform dentists and surgeons of therapy before procedures.",
    image: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=300&auto=format&fit=crop"
  },
  {
    name: "Atorvastatin 20mg",
    genericName: "Atorvastatin Calcium",
    category: "Stroke & Cardiovascular",
    price: 250,
    description: "HMG-CoA reductase inhibitor (statin) that lowers LDL cholesterol and stabilizes plaques.",
    sideEffects: ["Myalgia (muscle aches)", "Headache", "Mild elevation in liver enzymes"],
    counselingNotes: "Take once daily in the evening. Report unexplained muscle soreness or weakness.",
    image: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=300&auto=format&fit=crop"
  },

  // Antimalarials
  {
    name: "Artemether/Lumefantrine (Coartem)",
    genericName: "Artemether + Lumefantrine",
    category: "Antimalarials",
    price: 190,
    description: "Artemisinin-based combination therapy (ACT) for uncomplicated P. falciparum malaria.",
    sideEffects: ["Anorexia", "Palpitations", "Headache", "Myalgia"],
    counselingNotes: "Take with fatty food or milk to significantly enhance Lumefantrine absorption.",
    image: "https://images.unsplash.com/photo-1576602976047-174e57a47881?w=300&auto=format&fit=crop"
  },
  {
    name: "Chloroquine Phosphate 250mg",
    genericName: "Chloroquine",
    category: "Antimalarials",
    price: 120,
    description: "Treatment and chemoprophylaxis of sensitive malaria strains.",
    sideEffects: ["Visual disturbances", "Pruritus", "Nausea"],
    counselingNotes: "Take with food to minimize nausea.",
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop"
  },

  // Tuberculosis Care
  {
    name: "Rifampicin / Isoniazid 300/150mg",
    genericName: "Rifampicin + Isoniazid",
    category: "Tuberculosis (TB) Care",
    price: 350,
    description: "Fixed-dose combination antibiotic therapy for active pulmonary tuberculosis.",
    sideEffects: ["Red-orange discoloration of bodily fluids", "Hepatotoxicity", "Peripheral neuropathy"],
    counselingNotes: "Body fluids (urine, sweat, tears) may turn orange. Do not miss any scheduled doses.",
    image: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=300&auto=format&fit=crop"
  },
  {
    name: "Ethambutol 400mg",
    genericName: "Ethambutol",
    category: "Tuberculosis (TB) Care",
    price: 210,
    description: "Bacteriostatic antimycobacterial agent essential in initial TB management.",
    sideEffects: ["Optic neuritis (decreased visual acuity/red-green color vision)"],
    counselingNotes: "Promptly report any changes in vision or color perception to your physician.",
    image: "https://images.unsplash.com/photo-1585435557343-3b092031a831?w=300&auto=format&fit=crop"
  },

  // HIV Management
  {
    name: "Tenofovir/Lamivudine/Dolutegravir (TLD)",
    genericName: "Tenofovir Disoproxil + Lamivudine + Dolutegravir",
    category: "HIV Management (ART)",
    price: 500,
    description: "Single-tablet first-line regimen for robust viral suppression in HIV-1.",
    sideEffects: ["Insomnia", "Headache", "Weight gain", "Mild nausea"],
    counselingNotes: "Take once daily at the same time. Strict adherence is vital to avoid resistance.",
    image: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=300&auto=format&fit=crop"
  },
  {
    name: "Efavirenz 600mg",
    genericName: "Efavirenz",
    category: "HIV Management (ART)",
    price: 380,
    description: "Non-nucleoside reverse transcriptase inhibitor (NNRTI) for antiretroviral therapy.",
    sideEffects: ["Vivid dreams/dizziness", "Rash", "Concentration changes"],
    counselingNotes: "Take at bedtime on an empty stomach to reduce central nervous system side effects.",
    image: "https://images.unsplash.com/photo-1576602976047-174e57a47881?w=300&auto=format&fit=crop"
  },

  // Oncology
  {
    name: "Tamoxifen 20mg",
    genericName: "Tamoxifen Citrate",
    category: "Oncology & Cancer Support",
    price: 650,
    description: "Selective estrogen receptor modulator (SERM) for hormone-receptor-positive breast cancer.",
    sideEffects: ["Hot flashes", "Fatigue", "Fluid retention", "Nausea"],
    counselingNotes: "Swallow tablets whole with water. Maintain regular follow-up appointments.",
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop"
  },
  {
    name: "Ondansetron 8mg",
    genericName: "Ondansetron",
    category: "Oncology & Cancer Support",
    price: 290,
    description: "5-HT3 receptor antagonist for prevention of chemotherapy-induced nausea and vomiting.",
    sideEffects: ["Constipation", "Headache", "Flushing"],
    counselingNotes: "Take 30 minutes before chemotherapy or as directed by your oncologist.",
    image: "https://images.unsplash.com/photo-1576602976047-174e57a47881?w=300&auto=format&fit=crop"
  }
];

const seedDB = async () => {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/careplus_pharmacy';
    await mongoose.connect(uri);
    console.log('🔄 Connected to MongoDB for seeding...');
    
    await Medicine.deleteMany({});
    console.log('🧹 Cleared existing medicine records.');
    
    const inserted = await Medicine.insertMany(sampleMedicines);
    console.log(`✅ Successfully seeded ${inserted.length} clinical medicines into CarePlus database!`);
    
    await mongoose.connection.close();
    console.log('🔒 Database connection closed cleanly.');
  } catch (err) {
    console.error('❌ Error seeding database:', err.message);
    process.exit(1);
  }
};

if (require.main === module) {
  seedDB();
}

module.exports = { sampleMedicines, seedDB };