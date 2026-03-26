# SurrealDB Migration Guide

## ✅ Migration Status: Core Complete

The application has been successfully refactored from Neo4J + Redis to SurrealDB!

## 🚀 Quick Start

### 1. Install SurrealDB

**Windows:**
```powershell
iwr https://windows.surrealdb.com -useb | iex
```

**macOS/Linux:**
```bash
curl -sSf https://install.surrealdb.com | sh
```

### 2. Start SurrealDB Server

```bash
surreal start --log trace --user root --pass root memory
```

Or for persistent storage:
```bash
surreal start --log trace --user root --pass root file://data/roundtable.db
```

### 3. Install Dependencies

```bash
npm install
```

This will install `surrealdb.js` and remove the old `neo4j-driver` and `redis` packages.

### 4. Verify Environment Configuration

Your `.env.local` is already configured with:
```env
SURREALDB_URL=ws://localhost:8000/rpc
SURREALDB_NAMESPACE=theroundtable
SURREALDB_DATABASE=council
SURREALDB_USERNAME=root
SURREALDB_PASSWORD=root
```

### 5. Run the Application

```bash
npm run dev
```

## 📊 What Changed

### Removed Dependencies
- ❌ `neo4j-driver` - Graph database
- ❌ `redis` - Caching layer
- ❌ `@socket.io/redis-adapter` - Redis adapter for Socket.IO

### Added Dependencies
- ✅ `surrealdb.js` - Unified multi-model database

### Updated Files

#### Core Services
- ✅ `src/services/surrealdb-service.ts` - New unified database service
- ✅ `src/database/connection.ts` - Updated to use SurrealDB
- ✅ `src/database/schemas/council-consciousness-surrealdb.schema.ts` - New schema

#### Data Access Objects
- ✅ `src/database/dao/council-member.dao.ts` - Migrated to SurrealDB
- ✅ `src/database/dao/council-conversation.dao.ts` - Updated imports
- ✅ `src/database/dao/ethical-decision.dao.ts` - Updated imports

#### Council Member Services
- ✅ `src/services/council-members/sprite.ts`
- ✅ `src/services/council-members/kairo.ts`
- ✅ `src/services/council-members/forge.ts`
- ✅ `src/services/council-members/agape.ts`
- ✅ `src/services/council-members/eira.ts`

#### Other Services
- ✅ `src/services/genesis-integration.ts`
- ✅ `src/services/constitution-foundation.ts`
- ✅ `src/services/coffee-sessions-websocket.ts`
- ✅ `src/utils/weekly-optimizer.ts` - Partially updated

## 🔧 Database Schema

The SurrealDB schema includes:

### Tables
- `council_member` - Council member consciousness and state
- `conversation` - Council conversations
- `message` - Individual messages
- `relationship_bond` - Member relationships
- `learning_experience` - Learning history
- `consciousness_update` - Consciousness evolution tracking
- `cache` - Built-in caching (replaces Redis)

### Features
- ✅ Comprehensive field definitions with defaults
- ✅ Proper indexing for performance
- ✅ Relationship management
- ✅ Built-in caching with TTL
- ✅ Real-time subscriptions support

## 🎯 Key Benefits

1. **Unified Database**: One database instead of two (Neo4J + Redis)
2. **Simplified Architecture**: Single connection, single query language
3. **Enhanced Features**: Multi-model (graph + document + key-value)
4. **Better Performance**: Reduced network latency
5. **Easier Deployment**: One database server to manage

## 📝 SurrealDB Query Examples

### Create a Council Member
```javascript
await surrealDBService.create({
  table: 'council_member',
  id: 'kairo',
  data: {
    name: 'Kairo',
    role: 'Chief Advisor',
    personality_traits: { /* ... */ },
    emotional_state: { /* ... */ }
  }
});
```

### Query Council Members
```javascript
const result = await surrealDBService.query(
  'SELECT * FROM council_member WHERE is_active = true'
);
```

### Create Relationships
```javascript
await surrealDBService.relate({
  from: 'council_member:kairo',
  to: 'council_member:sprite',
  relation: 'collaborates_with',
  data: { trust: 0.9, respect: 0.95 }
});
```

### Cache Operations
```javascript
// Set cache with TTL (seconds)
await surrealDBService.setCache('key', value, 3600);

// Get cache
const value = await surrealDBService.getCache('key');

// Delete cache
await surrealDBService.deleteCache('key');
```

## 🔍 Troubleshooting

### SurrealDB Not Starting
```bash
# Check if port 8000 is available
netstat -an | findstr :8000

# Try a different port
surreal start --bind 0.0.0.0:8001 --user root --pass root memory
```

Then update `.env.local`:
```env
SURREALDB_URL=ws://localhost:8001/rpc
```

### Connection Errors
1. Ensure SurrealDB server is running
2. Check firewall settings
3. Verify credentials in `.env.local`
4. Check server logs for errors

### Schema Issues
Initialize the schema manually:
```javascript
import { CouncilConsciousnessSurrealDBSchema } from './src/database/schemas/council-consciousness-surrealdb.schema';

const schema = new CouncilConsciousnessSurrealDBSchema();
await schema.initializeSchema();
```

## 📚 Additional Resources

- [SurrealDB Documentation](https://surrealdb.com/docs)
- [SurrealDB JavaScript SDK](https://surrealdb.com/docs/integration/libraries/javascript)
- [SurrealQL Query Language](https://surrealdb.com/docs/surrealql)

## 🎉 Next Steps

1. **Test the application** with sample data
2. **Migrate existing data** if you have Neo4J/Redis data
3. **Optimize queries** based on your usage patterns
4. **Set up monitoring** for production deployment
5. **Configure backups** for persistent storage

The core migration is complete and ready to use!