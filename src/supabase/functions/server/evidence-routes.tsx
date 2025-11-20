/**
 * Evidence Points and Aggregations API Routes
 * Phase 9.1 - NEW endpoints that EXTEND Phase 9.0
 * 
 * Phase 9.0 provides: POST/GET/PUT/DELETE /evidence (basic CRUD)
 * Phase 9.1 ADDS: validation workflow, aggregations, data guards
 * 
 * NOTE: We do NOT duplicate Phase 9.0 CRUD handlers here!
 */

import * as evidence from "../../../utils/supabase/evidence.ts";
import * as aggregations from "../../../utils/supabase/aggregations.ts";

// ============================================================================
// Evidence Validation Endpoints (NEW in Phase 9.1)
// ============================================================================

/**
 * PATCH /make-server-17cae920/evidence/:id/validation
 * Update evidence point validation status
 * Admin only
 */
export async function updateEvidenceValidation(c: any) {
  console.log('🔍 updateEvidenceValidation handler called!');
  try {
    const id = c.req.param('id');
    const userId = c.get('userId');
    const body = await c.req.json();
    const { status } = body;
    
    if (!['pending', 'validated', 'flagged', 'duplicate'].includes(status)) {
      return c.json({ 
        error: 'Invalid validation status. Must be: pending, validated, flagged, or duplicate' 
      }, 400);
    }
    
    const updatedEvidence = await evidence.updateEvidenceValidation(
      id, 
      status as evidence.ValidationStatus,
      userId
    );
    
    if (!updatedEvidence) {
      return c.json({ error: 'Evidence point not found' }, 404);
    }
    
    console.log(`✓ Updated validation status for evidence point ${id} to ${status}`);
    
    return c.json({ 
      success: true, 
      evidence: updatedEvidence 
    });
  } catch (error) {
    console.error('❌ Error updating evidence validation:', error);
    return c.json({ 
      error: 'Failed to update validation status', 
      details: String(error) 
    }, 500);
  }
}

// ============================================================================
// Aggregation Endpoints (NEW in Phase 9.1)
// ============================================================================

/**
 * POST /make-server-17cae920/aggregations
 * Create a new parameter aggregation
 * Admin only
 */
export async function createAggregation(c: any) {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();
    
    // Add calculated_by from authenticated user
    const input: aggregations.CreateAggregationInput = {
      ...body,
      calculated_by: userId,
    };
    
    const newAggregation = await aggregations.createAggregation(input);
    
    console.log(`✓ Created aggregation ${newAggregation.id} for material ${newAggregation.material_id}, parameter ${newAggregation.parameter}`);
    
    return c.json({ 
      success: true, 
      aggregation: newAggregation 
    }, 201);
  } catch (error) {
    console.error('❌ Error creating aggregation:', error);
    return c.json({ 
      error: 'Failed to create aggregation', 
      details: String(error) 
    }, 400);
  }
}

/**
 * GET /make-server-17cae920/aggregations/:id
 * Get a specific aggregation by ID
 */
export async function getAggregation(c: any) {
  try {
    const id = c.req.param('id');
    const aggregation = await aggregations.getAggregation(id);
    
    if (!aggregation) {
      return c.json({ error: 'Aggregation not found' }, 404);
    }
    
    return c.json({ aggregation });
  } catch (error) {
    console.error('❌ Error fetching aggregation:', error);
    return c.json({ 
      error: 'Failed to fetch aggregation', 
      details: String(error) 
    }, 500);
  }
}

/**
 * GET /make-server-17cae920/aggregations/material/:materialId
 * Get current aggregations for a material
 * Optional query param: ?parameter=Y
 */
export async function getAggregationsByMaterial(c: any) {
  try {
    const materialId = c.req.param('materialId');
    const parameter = c.req.query('parameter');
    
    const options = parameter ? { parameter } : undefined;
    const currentAggregations = await aggregations.getCurrentAggregationsByMaterial(materialId, options);
    
    return c.json({ 
      aggregations: currentAggregations,
      count: currentAggregations.length 
    });
  } catch (error) {
    console.error('❌ Error fetching aggregations:', error);
    return c.json({ 
      error: 'Failed to fetch aggregations', 
      details: String(error) 
    }, 500);
  }
}

/**
 * GET /make-server-17cae920/aggregations/material/:materialId/history
 * Get aggregation history for a material+parameter
 * Required query param: ?parameter=Y
 */
export async function getAggregationHistory(c: any) {
  try {
    const materialId = c.req.param('materialId');
    const parameter = c.req.query('parameter');
    
    if (!parameter) {
      return c.json({ 
        error: 'Missing required query parameter: parameter' 
      }, 400);
    }
    
    const history = await aggregations.getAggregationHistory(materialId, parameter);
    
    return c.json({ 
      history,
      count: history.length 
    });
  } catch (error) {
    console.error('❌ Error fetching aggregation history:', error);
    return c.json({ 
      error: 'Failed to fetch aggregation history', 
      details: String(error) 
    }, 500);
  }
}

/**
 * GET /make-server-17cae920/aggregations/material/:materialId/stats
 * Get aggregation statistics for a material
 */
export async function getAggregationStats(c: any) {
  try {
    const materialId = c.req.param('materialId');
    const stats = await aggregations.getAggregationStats(materialId);
    
    return c.json({ stats });
  } catch (error) {
    console.error('❌ Error fetching aggregation stats:', error);
    return c.json({ 
      error: 'Failed to fetch aggregation stats', 
      details: String(error) 
    }, 500);
  }
}

// ============================================================================
// Data Guard Endpoints (NEW in Phase 9.1)
// ============================================================================

/**
 * GET /make-server-17cae920/sources/:sourceRef/can-delete
 * Check if a source can be deleted (data guard)
 * Returns false if evidence points reference this source
 * Admin only
 */
export async function checkSourceCanDelete(c: any) {
  try {
    const sourceRef = c.req.param('sourceRef');
    const result = await evidence.canDeleteSource(sourceRef);
    
    return c.json(result);
  } catch (error) {
    console.error('❌ Error checking source deletion:', error);
    return c.json({ 
      error: 'Failed to check source deletion', 
      details: String(error) 
    }, 500);
  }
}