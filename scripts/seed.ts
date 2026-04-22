import { db, users, healthFactorGroups, healthFactors } from '../src/db'

async function seed() {
  try {
    console.log('🌱 Seeding database...')
    
    // Insert users
    console.log('👤 Creating users...')
    const insertedUsers = await db.insert(users).values([
      { id: 1, name: 'blaine', color: '#3B82F6' },
      { id: 2, name: 'varsha', color: '#EC4899' }
    ]).returning()
    
    console.log(`✅ Created ${insertedUsers.length} users`)

    // Insert health factor groups
    console.log('📁 Creating health factor groups...')
    const insertedGroups = await db.insert(healthFactorGroups).values([
      { id: 1, name: 'HYROX', ownerUserId: null },
      { id: 2, name: 'General', ownerUserId: null },
      { id: 3, name: "Blaine's Weight Training", ownerUserId: 1 }
    ]).returning()
    
    console.log(`✅ Created ${insertedGroups.length} health factor groups`)

    // Insert health factors for HYROX (group 1)
    console.log('🏃 Creating HYROX health factors...')
    const hyroxFactors = await db.insert(healthFactors).values([
      { id: 1, groupId: 1, name: 'SkiErg (1000m)', unit: 'time', sortOrder: 1 },
      { id: 2, groupId: 1, name: 'Sled Push (50m)', unit: 'time', sortOrder: 2 },
      { id: 3, groupId: 1, name: 'Sled Pull (50m)', unit: 'time', sortOrder: 3 },
      { id: 4, groupId: 1, name: 'Burpee Broad Jumps (80m)', unit: 'time', sortOrder: 4 },
      { id: 5, groupId: 1, name: 'Rowing (1000m)', unit: 'time', sortOrder: 5 },
      { id: 6, groupId: 1, name: 'Farmers Carry (200m)', unit: 'time', sortOrder: 6 },
      { id: 7, groupId: 1, name: 'Sandbag Lunges (100m)', unit: 'time', sortOrder: 7 },
      { id: 8, groupId: 1, name: 'Wall Balls (100 reps)', unit: 'time', sortOrder: 8 },
      { id: 9, groupId: 1, name: '1km Run Split', unit: 'time', sortOrder: 9 },
      { id: 10, groupId: 1, name: 'Total Run Time (8km)', unit: 'time', sortOrder: 10 },
      { id: 11, groupId: 1, name: 'Overall Race Time', unit: 'time', sortOrder: 11 }
    ]).returning()
    
    console.log(`✅ Created ${hyroxFactors.length} HYROX factors`)

    // Insert health factors for General (group 2)
    console.log('⚖️ Creating General health factors...')
    const generalFactors = await db.insert(healthFactors).values([
      { id: 12, groupId: 2, name: 'Weight', unit: 'lbs', sortOrder: 1 }
    ]).returning()
    
    console.log(`✅ Created ${generalFactors.length} General factors`)

    // Insert health factors for Blaine's Weight Training (group 3)
    console.log('💪 Creating Weight Training health factors...')
    const weightFactors = await db.insert(healthFactors).values([
      { id: 13, groupId: 3, name: 'Incline Bench Press', unit: 'reps_weight', sortOrder: 1 },
      { id: 14, groupId: 3, name: 'Bicep Curls', unit: 'reps_weight', sortOrder: 2 },
      { id: 15, groupId: 3, name: 'Shoulder Press', unit: 'reps_weight', sortOrder: 3 },
      { id: 16, groupId: 3, name: 'Deadlift', unit: 'reps_weight', sortOrder: 4 },
      { id: 17, groupId: 3, name: 'Tricep Extension', unit: 'reps_weight', sortOrder: 5 },
      { id: 18, groupId: 3, name: 'Lat Pulldown', unit: 'reps_weight', sortOrder: 6 },
      { id: 19, groupId: 3, name: 'Leg Press', unit: 'reps_weight', sortOrder: 7 },
      { id: 20, groupId: 3, name: 'Leg Curl', unit: 'reps_weight', sortOrder: 8 },
      { id: 21, groupId: 3, name: 'Leg Extension', unit: 'reps_weight', sortOrder: 9 }
    ]).returning()
    
    console.log(`✅ Created ${weightFactors.length} Weight Training factors`)

    console.log('🎉 Database seeded successfully!')
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  }
}

seed().catch((error) => {
  console.error(error)
  process.exit(1)
})