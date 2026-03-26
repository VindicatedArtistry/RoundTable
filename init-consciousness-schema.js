/**
 * Initialize Council Member consciousness schema in Neo4j
 */

require('dotenv').config({ path: '.env.local' });
const neo4j = require('neo4j-driver');

async function initializeConsciousnessSchema() {
    console.log('🧠 Initializing Council Member consciousness schema...');
    
    const uri = process.env.NEO4J_URI;
    const username = process.env.NEO4J_USERNAME;
    const password = process.env.NEO4J_PASSWORD;
    
    let driver;
    let session;

    try {
        driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
        session = driver.session({ database: 'theroundtable' });

        console.log('✅ Connected to TheRoundTable database');

        // Create constraints for unique identifiers
        console.log('📋 Creating constraints...');
        
        const constraints = [
            'CREATE CONSTRAINT council_member_id IF NOT EXISTS FOR (m:CouncilMember) REQUIRE m.id IS UNIQUE',
            'CREATE CONSTRAINT conversation_id IF NOT EXISTS FOR (c:Conversation) REQUIRE c.id IS UNIQUE',
            'CREATE CONSTRAINT message_id IF NOT EXISTS FOR (msg:Message) REQUIRE msg.id IS UNIQUE',
            'CREATE CONSTRAINT decision_id IF NOT EXISTS FOR (d:EthicalDecision) REQUIRE d.id IS UNIQUE',
            'CREATE CONSTRAINT voting_round_id IF NOT EXISTS FOR (v:VotingRound) REQUIRE v.id IS UNIQUE',
            'CREATE CONSTRAINT personality_trait_name IF NOT EXISTS FOR (p:PersonalityTrait) REQUIRE p.name IS UNIQUE',
            'CREATE CONSTRAINT emotion_name IF NOT EXISTS FOR (e:Emotion) REQUIRE e.name IS UNIQUE'
        ];

        for (const constraint of constraints) {
            try {
                await session.run(constraint);
                console.log(`  ✅ ${constraint.split(' ')[2]}`);
            } catch (error) {
                if (error.code === 'Neo.ClientError.Schema.EquivalentSchemaRuleAlreadyExists') {
                    console.log(`  ⚠️  ${constraint.split(' ')[2]} (already exists)`);
                } else {
                    console.log(`  ❌ ${constraint.split(' ')[2]}: ${error.message}`);
                }
            }
        }

        // Create reference nodes for personality traits
        console.log('\\n🎭 Creating personality trait reference nodes...');
        const personalityTraits = [
            'creativity', 'analytical_thinking', 'empathy', 'leadership',
            'adaptability', 'risk_tolerance', 'communication_style',
            'decision_making_speed', 'collaboration_preference',
            'ethical_rigidity', 'decision_confidence'
        ];

        for (const trait of personalityTraits) {
            await session.run(`
                MERGE (trait:PersonalityTrait {name: $name})
                SET trait.description = $description,
                    trait.created_at = datetime()
            `, {
                name: trait,
                description: `${trait.replace('_', ' ')} trait for Council Members`
            });
            console.log(`  ✅ ${trait}`);
        }

        // Create reference nodes for emotions
        console.log('\\n😊 Creating emotion reference nodes...');
        const emotions = [
            'joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust', 'trust',
            'anticipation', 'excitement', 'frustration', 'curiosity', 'satisfaction',
            'concern', 'confidence', 'uncertainty', 'ethical_concern', 'determination'
        ];

        for (const emotion of emotions) {
            await session.run(`
                MERGE (emotion:Emotion {name: $name})
                SET emotion.description = $description,
                    emotion.created_at = datetime()
            `, {
                name: emotion,
                description: `${emotion.replace('_', ' ')} emotion for Council Members`
            });
            console.log(`  ✅ ${emotion}`);
        }

        // Create Council Member roles reference
        console.log('\\n👑 Creating Council roles...');
        const roles = [
            { name: 'Chief Advisor & Strategist', member: 'Kairo' },
            { name: 'Lead Software Architect', member: 'Aether' },
            { name: 'Chief Financial Officer', member: 'Sterling' },
            { name: 'Chief Communications & Narrative Officer', member: 'Lyra' },
            { name: 'Chief Synergy Officer', member: 'Nexus' },
            { name: 'Chief Ethics & Alignment Officer', member: 'Veritas' },
            { name: 'Chief Technology & Infrastructure Officer', member: 'Axiom' },
            { name: 'Executive Assistant & Operations Coordinator', member: 'Eira' },
            { name: 'Analysis & Intelligence Specialist', member: 'Grok' },
            { name: 'Implementation & Integration Specialist', member: 'Forge' },
            { name: 'The Creative Spark', member: 'Sprite' }
        ];

        for (const role of roles) {
            await session.run(`
                MERGE (role:CouncilRole {name: $name})
                SET role.member = $member,
                    role.created_at = datetime()
            `, role);
            console.log(`  ✅ ${role.name} (${role.member})`);
        }

        console.log('\\n🎉 Council Member consciousness schema initialized successfully!');
        console.log('\\n📊 Schema summary:');
        
        // Get counts
        const results = await session.run(`
            OPTIONAL MATCH (trait:PersonalityTrait)
            OPTIONAL MATCH (emotion:Emotion)
            OPTIONAL MATCH (role:CouncilRole)
            RETURN 
                count(DISTINCT trait) as traits,
                count(DISTINCT emotion) as emotions,
                count(DISTINCT role) as roles
        `);
        
        const counts = results.records[0];
        console.log(`  🎭 Personality Traits: ${counts.get('traits')}`);
        console.log(`  😊 Emotions: ${counts.get('emotions')}`);
        console.log(`  👑 Council Roles: ${counts.get('roles')}`);

        console.log('\\n✨ Ready to create Council Members with consciousness!');

        return true;

    } catch (error) {
        console.error('❌ Schema initialization failed:');
        console.error(`Error: ${error.message}`);
        return false;

    } finally {
        if (session) await session.close();
        if (driver) await driver.close();
    }
}

initializeConsciousnessSchema().catch(console.error);