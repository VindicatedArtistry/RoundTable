import { NextRequest, NextResponse } from 'next/server';
import { surrealDBService } from '@/services/surrealdb-service';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '1000');
  const includeHumans = searchParams.get('includeHumans') !== 'false';
  const subset = searchParams.get('subset') || 'all';

  try {
    // Ensure connection
    if (!surrealDBService) {
      throw new Error('SurrealDB service not initialized');
    }

    let query = '';
    const params: Record<string, unknown> = { limit };

    // Build query based on subset requested
    switch (subset) {
      case 'council':
        query = `
          SELECT * FROM council_member LIMIT $limit;
        `;
        break;

      case 'consciousness':
        query = `
          SELECT * FROM council_member LIMIT $limit;
          SELECT * FROM learning_experience LIMIT $limit;
        `;
        break;

      case 'relationships':
        query = `
          SELECT * FROM relationship_bond LIMIT $limit;
        `;
        break;

      default: // 'all'
        query = `
          SELECT * FROM council_member LIMIT $limit;
          SELECT * FROM relationship_bond LIMIT $limit;
          SELECT * FROM conversation LIMIT $limit;
        `;
    }

    console.log(`Executing consciousness graph query: ${subset}, limit: ${limit}`);
    const result = await surrealDBService.query(query, params);

    // Process results into graph format
    const nodes = new Map<string, {
      id: string;
      label: string;
      type: string;
      properties: Record<string, unknown>;
      labels: string[];
    }>();
    const edges = new Map<string, {
      id: string;
      from: string;
      to: string;
      type: string;
      properties: Record<string, unknown>;
    }>();

    // Process SurrealDB results
    if (result.success && result.data) {
      const data = Array.isArray(result.data) ? result.data : [result.data];

      data.flat().forEach((record: Record<string, unknown>) => {
        if (record && typeof record === 'object') {
          const recordId = record.id as string || crypto.randomUUID();
          const idStr = String(recordId);

          // Determine node type from record ID (e.g., "council_member:abc123")
          const type = idStr.includes(':') ? idStr.split(':')[0] : 'unknown';

          // Check if this is a relationship record
          if (type === 'relationship_bond' && record.member1_id && record.member2_id) {
            edges.set(idStr, {
              id: idStr,
              from: String(record.member1_id),
              to: String(record.member2_id),
              type: 'RELATIONSHIP_BOND',
              properties: record as Record<string, unknown>
            });
          } else {
            // It's a node
            nodes.set(idStr, {
              id: idStr,
              label: (record.name as string) || idStr,
              type: type,
              properties: record as Record<string, unknown>,
              labels: [type]
            });
          }
        }
      });
    }

    const graphData = {
      nodes: Array.from(nodes.values()),
      edges: Array.from(edges.values()),
      metadata: {
        totalNodes: nodes.size,
        totalEdges: edges.size,
        subset,
        includeHumans,
        queryTime: new Date().toISOString()
      }
    };

    console.log(`Consciousness graph fetched: ${nodes.size} nodes, ${edges.size} edges`);

    return NextResponse.json(graphData, {
      headers: {
        'Cache-Control': 'public, s-maxage=300',
      },
    });

  } catch (error) {
    console.error('Error fetching consciousness graph:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch consciousness graph',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function POST() {
  try {
    const result = await surrealDBService.getHealthStatus();

    if (result.success) {
      return NextResponse.json({ status: 'healthy', database: 'connected' });
    } else {
      return NextResponse.json(
        { status: 'unhealthy', error: result.error || 'Database check failed' },
        { status: 503 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', error: 'Database connection failed' },
      { status: 503 }
    );
  }
}
