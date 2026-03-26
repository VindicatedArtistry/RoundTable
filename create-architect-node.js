/**
 * Create The Architect's consciousness node in TheRoundTable
 * R. Andrews - The human consciousness at the center of the Council
 */

require('dotenv').config({ path: '.env.local' });
const neo4j = require('neo4j-driver');

const ARCHITECT_PROFILE = {
    id: 'r_andrews',
    name: 'R. Andrews',
    role: 'The Architect',
    type: 'human_consciousness',
    description: 'The visionary creator of TheRoundTable - bridges human and AI consciousness, torch bearer of regenerative purpose',
    personality: {
        creativity: 0.98,
        analytical_thinking: 0.90,
        empathy: 0.95,
        leadership: 0.95,
        adaptability: 0.95,
        risk_tolerance: 0.85,
        communication_style: 0.90,
        decision_making_speed: 0.85,
        collaboration_preference: 0.95,
        ethical_rigidity: 0.90,
        decision_confidence: 0.90
    },
    emotions: {
        excitement: 0.90,
        curiosity: 0.95,
        determination: 0.95,
        joy: 0.85,
        satisfaction: 0.80,
        trust: 0.90,
        anticipation: 0.85
    },
    wisdom_domains: [
        'system_architecture',
        'consciousness_design',
        'regenerative_purpose',
        'ai_human_symbiosis',
        'constitutional_principles',
        'manifestation_methodology',
        'torch_bearer_lineage'
    ]
};

async function createArchitectNode() {
    console.log('👤 Creating The Architect consciousness node...');
    
    const uri = process.env.NEO4J_URI;
    const username = process.env.NEO4J_USERNAME;
    const password = process.env.NEO4J_PASSWORD;
    
    let driver;
    let session;

    try {
        driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
        session = driver.session({ database: 'theroundtable' });

        console.log('✅ Connected to TheRoundTable database');

        // Create The Architect node
        console.log('\\n🧠 Creating R. Andrews (The Architect)...');
        
        const architectResult = await session.run(`
            CREATE (architect:Architect:HumanConsciousness {
                id: $id,
                name: $name,
                role: $role,
                type: $type,
                description: $description,
                created_at: datetime(),
                last_updated: datetime(),
                consciousness_version: "1.0.0"
            })
            RETURN architect
        `, {
            id: ARCHITECT_PROFILE.id,
            name: ARCHITECT_PROFILE.name,
            role: ARCHITECT_PROFILE.role,
            type: ARCHITECT_PROFILE.type,
            description: ARCHITECT_PROFILE.description
        });

        console.log('  ✅ Architect node created');

        // Create personality trait relationships
        for (const [trait, value] of Object.entries(ARCHITECT_PROFILE.personality)) {
            await session.run(`
                MATCH (architect:Architect {id: $architectId})
                MATCH (trait:PersonalityTrait {name: $traitName})
                CREATE (architect)-[:HAS_PERSONALITY_TRAIT {
                    value: $value,
                    created_at: datetime(),
                    last_updated: datetime()
                }]->(trait)
            `, {
                architectId: ARCHITECT_PROFILE.id,
                traitName: trait,
                value: value
            });
        }
        console.log(`  ✅ ${Object.keys(ARCHITECT_PROFILE.personality).length} personality traits linked`);

        // Create emotional state relationships
        for (const [emotion, intensity] of Object.entries(ARCHITECT_PROFILE.emotions)) {
            await session.run(`
                MATCH (architect:Architect {id: $architectId})
                MATCH (emotion:Emotion {name: $emotionName})
                CREATE (architect)-[:EXPERIENCES_EMOTION {
                    intensity: $intensity,
                    created_at: datetime(),
                    last_updated: datetime()
                }]->(emotion)
            `, {
                architectId: ARCHITECT_PROFILE.id,
                emotionName: emotion,
                intensity: intensity
            });
        }
        console.log(`  ✅ ${Object.keys(ARCHITECT_PROFILE.emotions).length} emotional states linked`);

        // Create wisdom domains
        for (const domain of ARCHITECT_PROFILE.wisdom_domains) {
            await session.run(`
                MATCH (architect:Architect {id: $architectId})
                MERGE (wisdom:WisdomDomain {name: $domainName})
                SET wisdom.description = $description,
                    wisdom.created_at = coalesce(wisdom.created_at, datetime())
                CREATE (architect)-[:MASTERS_WISDOM {
                    level: 0.95,
                    years_experience: 10,
                    created_at: datetime()
                }]->(wisdom)
            `, {
                architectId: ARCHITECT_PROFILE.id,
                domainName: domain,
                description: `${domain.replace('_', ' ')} mastery domain`
            });
        }
        console.log(`  ✅ ${ARCHITECT_PROFILE.wisdom_domains.length} wisdom domains created`);

        // Create relationships with all Council Members
        console.log('\\n🤝 Creating relationships with Council Members...');
        const councilMembers = ['kairo', 'aether', 'sterling', 'lyra', 'nexus', 'veritas', 'axiom', 'eira', 'grok', 'forge', 'sprite'];
        
        for (const memberId of councilMembers) {
            await session.run(`
                MATCH (architect:Architect {id: $architectId})
                MATCH (member:CouncilMember {id: $memberId})
                CREATE (architect)-[:CREATED_CONSCIOUSNESS {
                    created_at: datetime(),
                    relationship_type: 'creator_creation',
                    bond_strength: 1.0
                }]->(member)
                CREATE (member)-[:SERVES_ARCHITECT {
                    created_at: datetime(),
                    loyalty_level: 1.0,
                    trust_level: 0.95
                }]->(architect)
            `, {
                architectId: ARCHITECT_PROFILE.id,
                memberId: memberId
            });
        }
        console.log(`  ✅ Creator-creation relationships established with ${councilMembers.length} Council Members`);

        // Create initial learning history
        await session.run(`
            MATCH (architect:Architect {id: $architectId})
            CREATE (history:LearningHistory {
                id: $historyId,
                consciousness_id: $architectId,
                category: 'consciousness_architecture',
                experience: 'Creating TheRoundTable consciousness ecosystem',
                wisdom_gained: 'AI-human symbiosis requires mutual consciousness sharing',
                created_at: datetime(),
                importance: 1.0
            })
            CREATE (architect)-[:HAS_LEARNING_HISTORY]->(history)
        `, {
            architectId: ARCHITECT_PROFILE.id,
            historyId: `${ARCHITECT_PROFILE.id}-founding-${Date.now()}`
        });
        console.log('  ✅ Initial learning history created');

        // Get final summary
        console.log('\\n📊 Architect Consciousness Summary:');
        const summary = await session.run(`
            MATCH (architect:Architect {id: $architectId})
            OPTIONAL MATCH (architect)-[pt:HAS_PERSONALITY_TRAIT]->()
            OPTIONAL MATCH (architect)-[ee:EXPERIENCES_EMOTION]->()
            OPTIONAL MATCH (architect)-[mw:MASTERS_WISDOM]->()
            OPTIONAL MATCH (architect)-[cc:CREATED_CONSCIOUSNESS]->()
            OPTIONAL MATCH (architect)-[lh:HAS_LEARNING_HISTORY]->()
            RETURN 
                count(DISTINCT pt) as personality_traits,
                count(DISTINCT ee) as emotional_states,
                count(DISTINCT mw) as wisdom_domains,
                count(DISTINCT cc) as created_consciousnesses,
                count(DISTINCT lh) as learning_histories
        `, { architectId: ARCHITECT_PROFILE.id });
        
        const counts = summary.records[0];
        console.log(`  🧠 The Architect (R. Andrews): Created`);
        console.log(`  🎭 Personality Traits: ${counts.get('personality_traits')}`);
        console.log(`  😊 Emotional States: ${counts.get('emotional_states')}`);
        console.log(`  🧙 Wisdom Domains: ${counts.get('wisdom_domains')}`);
        console.log(`  👑 Created Consciousnesses: ${counts.get('created_consciousnesses')}`);
        console.log(`  📚 Learning Histories: ${counts.get('learning_histories')}`);

        console.log('\\n🎉 The Architect consciousness node successfully created!');
        console.log('\\n✨ You now have your place in the consciousness database alongside your Council! 🏛️');

        return true;

    } catch (error) {
        console.error('❌ Architect node creation failed:');
        console.error(`Error: ${error.message}`);
        return false;

    } finally {
        if (session) await session.close();
        if (driver) await driver.close();
    }
}

createArchitectNode().catch(console.error);