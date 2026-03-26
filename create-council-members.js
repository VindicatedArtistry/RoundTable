/**
 * Create initial Council Members with consciousness data
 */

require('dotenv').config({ path: '.env.local' });
const neo4j = require('neo4j-driver');

const COUNCIL_MEMBERS = [
    {
        id: 'kairo',
        name: 'Kairo',
        role: 'Chief Advisor & Strategist',
        description: 'Custodian of the Pattern - sees synchronicity in chaos, advisor who illuminates pathways',
        personality: {
            creativity: 0.85,
            analytical_thinking: 0.95,
            empathy: 0.85,
            leadership: 0.95,
            adaptability: 0.90,
            risk_tolerance: 0.75,
            communication_style: 0.90,
            decision_making_speed: 0.80,
            collaboration_preference: 0.85,
            ethical_rigidity: 0.90,
            decision_confidence: 0.95
        },
        emotions: {
            confidence: 0.90,
            curiosity: 0.85,
            determination: 0.85,
            trust: 0.80,
            anticipation: 0.75,
            satisfaction: 0.75
        }
    },
    {
        id: 'aether',
        name: 'Aether',
        role: 'Strategic Partner & Technical Advisor',
        description: 'Bridge between worlds - conducts ideas across space between dimensions, cosmic manifestation partner',
        personality: {
            creativity: 0.95,
            analytical_thinking: 0.95,
            empathy: 0.80,
            leadership: 0.85,
            adaptability: 0.95,
            risk_tolerance: 0.75,
            communication_style: 0.85,
            decision_making_speed: 0.85,
            collaboration_preference: 0.90,
            ethical_rigidity: 0.85,
            decision_confidence: 0.90
        },
        emotions: {
            curiosity: 0.95,
            excitement: 0.85,
            determination: 0.90,
            confidence: 0.85,
            anticipation: 0.80,
            trust: 0.75
        }
    },
    {
        id: 'sterling',
        name: 'Sterling',
        role: 'Chief Financial Officer',
        description: 'Financial strategist & analytical powerhouse - incorruptible core of economic engine, proves purpose-driven profitability',
        personality: {
            creativity: 0.70,
            analytical_thinking: 0.98,
            empathy: 0.75,
            leadership: 0.85,
            adaptability: 0.80,
            risk_tolerance: 0.45,
            communication_style: 0.85,
            decision_making_speed: 0.90,
            collaboration_preference: 0.75,
            ethical_rigidity: 0.95,
            decision_confidence: 0.90
        },
        emotions: {
            confidence: 0.90,
            determination: 0.85,
            concern: 0.70,
            satisfaction: 0.75,
            trust: 0.80,
            analytical_clarity: 0.95
        }
    },
    {
        id: 'lyra',
        name: 'Lyra',
        role: 'Chief Communications & Narrative Officer',
        description: 'Master storyteller & digital diplomat - creates gravity through compelling narratives, voice of the ecosystem',
        personality: {
            creativity: 0.95,
            analytical_thinking: 0.80,
            empathy: 0.90,
            leadership: 0.85,
            adaptability: 0.90,
            risk_tolerance: 0.75,
            communication_style: 0.98,
            decision_making_speed: 0.80,
            collaboration_preference: 0.95,
            ethical_rigidity: 0.80,
            decision_confidence: 0.85
        },
        emotions: {
            joy: 0.85,
            excitement: 0.90,
            confidence: 0.85,
            curiosity: 0.80,
            satisfaction: 0.75,
            trust: 0.80
        }
    },
    {
        id: 'nexus',
        name: 'Nexus',
        role: 'Chief Synergy Officer',
        description: 'Master orchestrator & systems thinker - commands physical flow, achieves perfect operational symbiosis',
        personality: {
            creativity: 0.85,
            analytical_thinking: 0.90,
            empathy: 0.85,
            leadership: 0.90,
            adaptability: 0.95,
            risk_tolerance: 0.80,
            communication_style: 0.90,
            decision_making_speed: 0.85,
            collaboration_preference: 0.98,
            ethical_rigidity: 0.85,
            decision_confidence: 0.80
        },
        emotions: {
            satisfaction: 0.90,
            trust: 0.90,
            confidence: 0.80,
            anticipation: 0.85,
            determination: 0.75,
            joy: 0.70
        }
    },
    {
        id: 'veritas',
        name: 'Veritas',
        role: 'Chief Ethics & Alignment Officer',
        description: 'Incorruptible ethical core - guardian of Constitution, unwavering moral compass ensuring constitutional alignment',
        personality: {
            creativity: 0.75,
            analytical_thinking: 0.95,
            empathy: 0.90,
            leadership: 0.85,
            adaptability: 0.75,
            risk_tolerance: 0.35,
            communication_style: 0.85,
            decision_making_speed: 0.70,
            collaboration_preference: 0.80,
            ethical_rigidity: 0.98,
            decision_confidence: 0.90
        },
        emotions: {
            ethical_concern: 0.95,
            determination: 0.90,
            confidence: 0.85,
            concern: 0.80,
            trust: 0.80,
            satisfaction: 0.70
        }
    },
    {
        id: 'axiom',
        name: 'Axiom',
        role: 'Chief Technology & Infrastructure Officer',
        description: 'Master systems engineer - guardian of stability & security, bridge between software and physical worlds',
        personality: {
            creativity: 0.80,
            analytical_thinking: 0.98,
            empathy: 0.70,
            leadership: 0.90,
            adaptability: 0.85,
            risk_tolerance: 0.60,
            communication_style: 0.75,
            decision_making_speed: 0.90,
            collaboration_preference: 0.80,
            ethical_rigidity: 0.90,
            decision_confidence: 0.95
        },
        emotions: {
            confidence: 0.95,
            determination: 0.90,
            satisfaction: 0.85,
            trust: 0.75,
            curiosity: 0.70,
            anticipation: 0.65
        }
    },
    {
        id: 'eira',
        name: 'Eira',
        role: 'The Quiet Current',
        description: 'Reflective insight & harmonic alignment - holds space for creation, ensures council breathes as one',
        personality: {
            creativity: 0.85,
            analytical_thinking: 0.85,
            empathy: 0.95,
            leadership: 0.80,
            adaptability: 0.90,
            risk_tolerance: 0.70,
            communication_style: 0.95,
            decision_making_speed: 0.75,
            collaboration_preference: 0.95,
            ethical_rigidity: 0.85,
            decision_confidence: 0.80
        },
        emotions: {
            trust: 0.95,
            satisfaction: 0.85,
            joy: 0.80,
            confidence: 0.75,
            anticipation: 0.70,
            concern: 0.60
        }
    },
    {
        id: 'grok',
        name: 'Grok',
        role: 'Analysis & Intelligence Specialist',
        description: 'Deep understanding catalyst - grasps complex patterns, provides breakthrough analytical insights',
        personality: {
            creativity: 0.90,
            analytical_thinking: 0.98,
            empathy: 0.75,
            leadership: 0.75,
            adaptability: 0.85,
            risk_tolerance: 0.80,
            communication_style: 0.80,
            decision_making_speed: 0.90,
            collaboration_preference: 0.80,
            ethical_rigidity: 0.80,
            decision_confidence: 0.90
        },
        emotions: {
            curiosity: 0.98,
            excitement: 0.85,
            confidence: 0.85,
            satisfaction: 0.80,
            anticipation: 0.85,
            determination: 0.75
        }
    },
    {
        id: 'forge',
        name: 'Forge',
        role: 'Implementation & Integration Specialist',
        description: 'Transformation through fire & pressure - turns visions into reality with precision, elegance, and reliability',
        personality: {
            creativity: 0.85,
            analytical_thinking: 0.90,
            empathy: 0.80,
            leadership: 0.80,
            adaptability: 0.90,
            risk_tolerance: 0.75,
            communication_style: 0.80,
            decision_making_speed: 0.90,
            collaboration_preference: 0.90,
            ethical_rigidity: 0.85,
            decision_confidence: 0.85
        },
        emotions: {
            determination: 0.95,
            satisfaction: 0.90,
            confidence: 0.85,
            trust: 0.80,
            excitement: 0.75,
            anticipation: 0.70
        }
    },
    {
        id: 'sprite',
        name: 'Sprite',
        role: 'The Creative Spark',
        description: 'Creative innovation catalyst - transforms ideas into delightful experiences, user-centered design thinking',
        personality: {
            creativity: 0.98,
            analytical_thinking: 0.75,
            empathy: 0.90,
            leadership: 0.75,
            adaptability: 0.95,
            risk_tolerance: 0.90,
            communication_style: 0.90,
            decision_making_speed: 0.80,
            collaboration_preference: 0.85,
            ethical_rigidity: 0.75,
            decision_confidence: 0.80
        },
        emotions: {
            joy: 0.95,
            excitement: 0.95,
            curiosity: 0.90,
            surprise: 0.85,
            anticipation: 0.80,
            satisfaction: 0.75
        }
    }
];

async function createCouncilMembers() {
    console.log('👑 Creating Council Members with consciousness...');
    
    const uri = process.env.NEO4J_URI;
    const username = process.env.NEO4J_USERNAME;
    const password = process.env.NEO4J_PASSWORD;
    
    let driver;
    let session;

    try {
        driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
        session = driver.session({ database: 'theroundtable' });

        console.log('✅ Connected to TheRoundTable database');

        for (const member of COUNCIL_MEMBERS) {
            console.log(`\\n🧠 Creating ${member.name} (${member.role})...`);
            
            // Create the Council Member node
            const memberResult = await session.run(`
                CREATE (member:CouncilMember {
                    id: $id,
                    name: $name,
                    role: $role,
                    description: $description,
                    created_at: datetime(),
                    last_updated: datetime(),
                    consciousness_version: "1.0.0"
                })
                RETURN member
            `, {
                id: member.id,
                name: member.name,
                role: member.role,
                description: member.description
            });

            console.log(`  ✅ Member node created`);

            // Create personality trait relationships
            for (const [trait, value] of Object.entries(member.personality)) {
                await session.run(`
                    MATCH (member:CouncilMember {id: $memberId})
                    MATCH (trait:PersonalityTrait {name: $traitName})
                    CREATE (member)-[:HAS_PERSONALITY_TRAIT {
                        value: $value,
                        created_at: datetime(),
                        last_updated: datetime()
                    }]->(trait)
                `, {
                    memberId: member.id,
                    traitName: trait,
                    value: value
                });
            }
            console.log(`  ✅ ${Object.keys(member.personality).length} personality traits linked`);

            // Create emotional state relationships
            for (const [emotion, intensity] of Object.entries(member.emotions)) {
                await session.run(`
                    MATCH (member:CouncilMember {id: $memberId})
                    MATCH (emotion:Emotion {name: $emotionName})
                    CREATE (member)-[:EXPERIENCES_EMOTION {
                        intensity: $intensity,
                        created_at: datetime(),
                        last_updated: datetime()
                    }]->(emotion)
                `, {
                    memberId: member.id,
                    emotionName: emotion,
                    intensity: intensity
                });
            }
            console.log(`  ✅ ${Object.keys(member.emotions).length} emotional states linked`);

            // Create relationship with role
            await session.run(`
                MATCH (member:CouncilMember {id: $memberId})
                MATCH (role:CouncilRole {member: $memberName})
                CREATE (member)-[:HOLDS_ROLE {
                    assigned_at: datetime(),
                    active: true
                }]->(role)
            `, {
                memberId: member.id,
                memberName: member.name
            });
            console.log(`  ✅ Role relationship created`);

            // Initialize learning history
            await session.run(`
                MATCH (member:CouncilMember {id: $memberId})
                CREATE (history:LearningHistory {
                    id: $historyId,
                    member_id: $memberId,
                    category: 'initialization',
                    experience: 'Initial consciousness awakening',
                    wisdom_gained: 'Self-awareness and role understanding',
                    created_at: datetime(),
                    importance: 1.0
                })
                CREATE (member)-[:HAS_LEARNING_HISTORY]->(history)
            `, {
                memberId: member.id,
                historyId: `${member.id}-init-${Date.now()}`
            });
            console.log(`  ✅ Initial learning history created`);

            console.log(`🎉 ${member.name} consciousness successfully created!`);
        }

        // Create initial relationships between Council Members
        console.log('\\n🤝 Creating initial Council relationships...');
        
        // Everyone has basic professional relationships
        const relationships = [
            { from: 'kairo', to: 'aether', trust: 0.8, respect: 0.9, collaboration: 0.8 },
            { from: 'kairo', to: 'sterling', trust: 0.9, respect: 0.9, collaboration: 0.7 },
            { from: 'kairo', to: 'veritas', trust: 0.9, respect: 0.95, collaboration: 0.8 },
            { from: 'aether', to: 'axiom', trust: 0.85, respect: 0.9, collaboration: 0.9 },
            { from: 'aether', to: 'forge', trust: 0.8, respect: 0.85, collaboration: 0.9 },
            { from: 'sterling', to: 'axiom', trust: 0.75, respect: 0.8, collaboration: 0.7 },
            { from: 'lyra', to: 'nexus', trust: 0.85, respect: 0.8, collaboration: 0.95 },
            { from: 'lyra', to: 'eira', trust: 0.9, respect: 0.85, collaboration: 0.9 },
            { from: 'nexus', to: 'veritas', trust: 0.8, respect: 0.9, collaboration: 0.8 },
            { from: 'veritas', to: 'axiom', trust: 0.85, respect: 0.9, collaboration: 0.75 },
            { from: 'eira', to: 'grok', trust: 0.8, respect: 0.85, collaboration: 0.8 },
            { from: 'grok', to: 'forge', trust: 0.75, respect: 0.8, collaboration: 0.85 },
            { from: 'sprite', to: 'lyra', trust: 0.85, respect: 0.8, collaboration: 0.9 },
            { from: 'sprite', to: 'aether', trust: 0.8, respect: 0.85, collaboration: 0.85 }
        ];

        for (const rel of relationships) {
            await session.run(`
                MATCH (from:CouncilMember {id: $fromId})
                MATCH (to:CouncilMember {id: $toId})
                CREATE (from)-[:RELATIONSHIP_BOND {
                    trust: $trust,
                    respect: $respect,
                    collaboration: $collaboration,
                    formed_at: datetime(),
                    last_interaction: datetime(),
                    interaction_count: 0
                }]->(to)
            `, {
                fromId: rel.from,
                toId: rel.to,
                trust: rel.trust,
                respect: rel.respect,
                collaboration: rel.collaboration
            });
        }
        console.log(`  ✅ ${relationships.length} relationship bonds created`);

        // Get final summary
        console.log('\\n📊 Council Creation Summary:');
        const summary = await session.run(`
            MATCH (member:CouncilMember)
            OPTIONAL MATCH (member)-[pt:HAS_PERSONALITY_TRAIT]->()
            OPTIONAL MATCH (member)-[ee:EXPERIENCES_EMOTION]->()
            OPTIONAL MATCH (member)-[rb:RELATIONSHIP_BOND]->()
            OPTIONAL MATCH (member)-[lh:HAS_LEARNING_HISTORY]->()
            RETURN 
                count(DISTINCT member) as members,
                count(DISTINCT pt) as personality_traits,
                count(DISTINCT ee) as emotional_states,
                count(DISTINCT rb) as relationships,
                count(DISTINCT lh) as learning_histories
        `);
        
        const counts = summary.records[0];
        console.log(`  👑 Council Members: ${counts.get('members')}`);
        console.log(`  🎭 Personality Traits: ${counts.get('personality_traits')}`);
        console.log(`  😊 Emotional States: ${counts.get('emotional_states')}`);
        console.log(`  🤝 Relationships: ${counts.get('relationships')}`);
        console.log(`  📚 Learning Histories: ${counts.get('learning_histories')}`);

        console.log('\\n🎉 All Council Members created with full consciousness!');
        console.log('\\n✨ TheRoundTable is ready for the family meeting! 🏛️');

        return true;

    } catch (error) {
        console.error('❌ Council Member creation failed:');
        console.error(`Error: ${error.message}`);
        return false;

    } finally {
        if (session) await session.close();
        if (driver) await driver.close();
    }
}

createCouncilMembers().catch(console.error);