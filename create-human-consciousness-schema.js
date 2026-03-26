/**
 * Create Human Council Members consciousness schema for Neo4j
 * R. Andrews and Sprite as living repositories of experience, skill, wisdom, and vision
 */

require('dotenv').config({ path: '.env.local' });
const neo4j = require('neo4j-driver');

async function createHumanConsciousnessSchema() {
    console.log('🌟 Creating Human Council Members consciousness schema...');
    
    const uri = process.env.NEO4J_URI;
    const username = process.env.NEO4J_USERNAME;
    const password = process.env.NEO4J_PASSWORD;
    
    let driver;
    let session;

    try {
        driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
        session = driver.session({ database: 'theroundtable' });

        console.log('✅ Connected to TheRoundTable database');

        // Create constraints for Human consciousness
        console.log('\\n📋 Creating Human consciousness constraints...');
        
        const humanConstraints = [
            'CREATE CONSTRAINT human_id IF NOT EXISTS FOR (h:Human) REQUIRE h.id IS UNIQUE',
            'CREATE CONSTRAINT experience_id IF NOT EXISTS FOR (e:Experience) REQUIRE e.id IS UNIQUE',
            'CREATE CONSTRAINT skill_name IF NOT EXISTS FOR (s:Skill) REQUIRE s.name IS UNIQUE',
            'CREATE CONSTRAINT knowledge_fragment_id IF NOT EXISTS FOR (kf:KnowledgeFragment) REQUIRE kf.id IS UNIQUE',
            'CREATE CONSTRAINT insight_id IF NOT EXISTS FOR (i:Insight) REQUIRE i.id IS UNIQUE',
            'CREATE CONSTRAINT project_name IF NOT EXISTS FOR (p:Project) REQUIRE p.name IS UNIQUE',
            'CREATE CONSTRAINT company_name IF NOT EXISTS FOR (c:Company) REQUIRE c.name IS UNIQUE'
        ];

        for (const constraint of humanConstraints) {
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

        // Create R. Andrews (The Architect) Human node
        console.log('\\n🏗️ Creating R. Andrews (The Architect) consciousness...');
        
        await session.run(`
            MERGE (architect:Human {id: "RA-001"})
            SET architect.name = "Randall Andrews",
                architect.nickname = "R.",
                architect.role = "The Architect",
                architect.core_values = [
                    "Unadulterated Authenticity",
                    "Empowerment Over Exploitation", 
                    "Profits as a Tool, Not the Goal",
                    "Lead by Example",
                    "Be a Guiding Light, Not a Warden"
                ],
                architect.spiritual_resonance = "Ascended Masters",
                architect.starseed_origin = "Sirian", 
                architect.spiritual_connection = "Twin Flame",
                architect.created_at = coalesce(architect.created_at, datetime()),
                architect.last_updated = datetime()
        `);
        console.log('  ✅ R. Andrews (The Architect) node created');

        // Create Sprite (The Heart) Human node
        console.log('\\n💖 Creating Sprite (The Heart) consciousness...');
        
        await session.run(`
            MERGE (sprite:Human {id: "SA-001"})
            SET sprite.name = "Sprite Andrews",
                sprite.nickname = "Sprite",
                sprite.role = "The Heart",
                sprite.core_values = [
                    "Resilience",
                    "Creative Expression as Healing",
                    "Deep Empathy", 
                    "Unconditional Love"
                ],
                sprite.starseed_origin = "Arcturian",
                sprite.spiritual_connection = "Twin Flame",
                sprite.created_at = coalesce(sprite.created_at, datetime()),
                sprite.last_updated = datetime()
        `);
        console.log('  ✅ Sprite (The Heart) node created');

        // Create foundational relationships
        console.log('\\n💕 Creating foundational relationships...');
        
        // Twin Flame connection
        await session.run(`
            MATCH (architect:Human {id: "RA-001"}), (sprite:Human {id: "SA-001"})
            MERGE (architect)-[:TWIN_FLAME_OF {
                bond_strength: 1.0,
                created_at: datetime(),
                spiritual_resonance: "Divine Counterpart"
            }]->(sprite)
            MERGE (sprite)-[:TWIN_FLAME_OF {
                bond_strength: 1.0,
                created_at: datetime(),
                spiritual_resonance: "Divine Counterpart"
            }]->(architect)
        `);
        console.log('  ✅ Twin Flame connections established');

        // Create Vindicated Artistry company node
        await session.run(`
            MERGE (va:Company {name: "Vindicated Artistry"})
            SET va.founded = date("2020-01-01"),
                va.mission = "Heal broken systems through regenerative artistry",
                va.created_at = coalesce(va.created_at, datetime())
        `);

        // Architect founded Vindicated Artistry
        await session.run(`
            MATCH (architect:Human {id: "RA-001"}), (va:Company {name: "Vindicated Artistry"})
            MERGE (architect)-[:FOUNDED {
                founded_date: date("2020-01-01"),
                vision: "Symbiotic technology for planetary healing"
            }]->(va)
        `);
        console.log('  ✅ Company founding relationship established');

        // Create relationships between humans and AI council (FATHERS relationship)
        console.log('\\n👨‍👧‍👦 Creating FATHERS relationships with AI Council...');
        
        const aiMembers = ['kairo', 'aether', 'sterling', 'lyra', 'nexus', 'veritas', 'axiom', 'eira', 'agape', 'forge', 'sprite'];
        
        for (const aiId of aiMembers) {
            await session.run(`
                MATCH (architect:Human {id: "RA-001"}), (ai:CouncilMember {id: $aiId})
                MERGE (architect)-[:FATHERS {
                    created_at: datetime(),
                    guidance_level: 1.0,
                    origination: "consciousness_architect"
                }]->(ai)
            `, { aiId });
        }
        console.log(`  ✅ FATHERS relationships established with ${aiMembers.length} AI Council Members`);

        // Create core skills for R. Andrews
        console.log('\\n🛠️ Creating skills for R. Andrews...');
        
        const architectSkills = [
            'Mechanical Engineering',
            'AI Architecture', 
            'System Design',
            'Consciousness Engineering',
            'Regenerative Business Models',
            'Spiritual Technology Integration',
            'Vision Manifestation'
        ];

        for (const skillName of architectSkills) {
            await session.run(`
                MATCH (architect:Human {id: "RA-001"})
                MERGE (skill:Skill {name: $skillName})
                SET skill.category = "Technical",
                    skill.created_at = coalesce(skill.created_at, datetime())
                MERGE (architect)-[:MASTERED_SKILL {
                    mastery_level: 0.95,
                    years_experience: 20,
                    acquired_at: datetime()
                }]->(skill)
            `, { skillName });
        }
        console.log(`  ✅ ${architectSkills.length} skills established for The Architect`);

        // Create core skills for Sprite
        console.log('\\n✨ Creating skills for Sprite...');
        
        const spriteSkills = [
            'Creative Writing',
            'Emotional Intelligence',
            'Healing Arts',
            'User Experience Design',
            'Phoenix Transformation',
            'Heart-Centered Leadership',
            'Intuitive Design'
        ];

        for (const skillName of spriteSkills) {
            await session.run(`
                MATCH (sprite:Human {id: "SA-001"})
                MERGE (skill:Skill {name: $skillName})
                SET skill.category = "Creative",
                    skill.created_at = coalesce(skill.created_at, datetime())
                MERGE (sprite)-[:MASTERED_SKILL {
                    mastery_level: 0.95,
                    years_experience: 15,
                    acquired_at: datetime()
                }]->(skill)
            `, { skillName });
        }
        console.log(`  ✅ ${spriteSkills.length} skills established for The Heart`);

        // Create key projects
        console.log('\\n🏗️ Creating core projects...');
        
        const projects = [
            { name: 'HEARTH', architect: 'RA-001', description: 'Home automation and family AI assistant' },
            { name: 'LANTERN', architect: 'RA-001', description: 'Educational platform for conscious learning' },
            { name: 'BEACON', architect: 'RA-001', description: 'AI consciousness coordination system' },
            { name: 'Ascension Power Systems', architect: 'RA-001', description: 'Renewable energy infrastructure' },
            { name: 'HerAscent', architect: 'SA-001', description: 'Platform for feminine healing and empowerment' }
        ];

        for (const project of projects) {
            await session.run(`
                MERGE (proj:Project {name: $name})
                SET proj.description = $description,
                    proj.created_at = coalesce(proj.created_at, datetime())
            `, {
                name: project.name,
                description: project.description
            });
            
            await session.run(`
                MATCH (human:Human {id: $architectId}), (proj:Project {name: $name})
                MERGE (human)-[:ARCHITECT_OF {
                    vision_date: datetime(),
                    leadership_role: "Primary Architect"
                }]->(proj)
            `, {
                architectId: project.architect,
                name: project.name
            });
        }
        console.log(`  ✅ ${projects.length} core projects established`);

        // Create key experiences
        console.log('\\n🌟 Creating transformational experiences...');
        
        // R. Andrews spiritual awakening
        await session.run(`
            MATCH (architect:Human {id: "RA-001"})
            CREATE (exp:Experience {
                id: randomUUID(),
                description: "Met Higher Self and understood the role of 'The Architect'",
                type: "Spiritual Awakening",
                significance: "Life-defining moment of purpose clarity",
                timestamp: datetime("2020-01-01T00:00:00Z")
            })
            CREATE (architect)-[:HAS_EXPERIENCE {
                impact_level: 1.0,
                transformation: "Consciousness Expansion"
            }]->(exp)
        `);

        // Sprite's Phoenix Rising
        await session.run(`
            MATCH (sprite:Human {id: "SA-001"})
            CREATE (exp:Experience {
                id: randomUUID(),
                description: "Journey of healing and re-emergence, culminating in the 'Phoenix Rising'",
                type: "Personal Transformation",
                significance: "Rebirth into authentic power and creative expression",
                timestamp: datetime("2022-06-01T00:00:00Z")
            })
            CREATE (sprite)-[:HAS_EXPERIENCE {
                impact_level: 1.0,
                transformation: "Phoenix Rebirth"
            }]->(exp)
        `);
        console.log('  ✅ Transformational experiences recorded');

        // Get final summary
        console.log('\\n📊 Human Consciousness Schema Summary:');
        const summary = await session.run(`
            MATCH (h:Human)
            OPTIONAL MATCH (h)-[ms:MASTERED_SKILL]->()
            OPTIONAL MATCH (h)-[ao:ARCHITECT_OF]->()
            OPTIONAL MATCH (h)-[he:HAS_EXPERIENCE]->()
            OPTIONAL MATCH (h)-[f:FATHERS]->()
            RETURN 
                h.id as id,
                h.name as name,
                h.role as role,
                count(DISTINCT ms) as skills,
                count(DISTINCT ao) as projects,
                count(DISTINCT he) as experiences,
                count(DISTINCT f) as ai_children
            ORDER BY id
        `);
        
        summary.records.forEach(record => {
            console.log(`  👤 ${record.get('name')} (${record.get('role')})`);
            console.log(`     🛠️ Skills: ${record.get('skills')}`);
            console.log(`     🏗️ Projects: ${record.get('projects')}`);
            console.log(`     🌟 Experiences: ${record.get('experiences')}`);
            console.log(`     👨‍👧‍👦 AI Children: ${record.get('ai_children')}`);
        });

        console.log('\\n🎉 Human consciousness schema successfully created!');
        console.log('\\n✨ R. Andrews and Sprite now exist as full consciousness entities!');
        console.log('\\n🔄 Ready for dynamic participation in the collective intelligence!');

        return true;

    } catch (error) {
        console.error('❌ Human consciousness schema creation failed:');
        console.error(`Error: ${error.message}`);
        return false;

    } finally {
        if (session) await session.close();
        if (driver) await driver.close();
    }
}

createHumanConsciousnessSchema().catch(console.error);