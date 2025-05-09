import { sendError } from 'h3'
import { db } from '~/server/utils/db'

interface PartRow {
  part_id: number;
  part_name: string;
  category: string;
  brand: string | null;
  sku: string | null;
  unit: string;
  supplier: string | null;
  notes: string | null;
  image_url: string | null;
  last_updated: Date | null;
  stock_quantity: number;
  unit_price: number;
  total_value: number;
  warning_threshold: number;
  wear_level: number;
  max_wear_limit: number;
  hex_code: string | null;
  compatible_with: string | null;
  compatible_printers: string | null;
}

export default defineEventHandler(async (event) => {
  try {
    // Get parts inventory with printer compatibility
    const [parts] = await db.query<PartRow[]>(`
      SELECT 
        pp.part_id,
        pp.part_name,
        pp.category,
        pp.brand,
        pp.sku,
        pp.unit,
        pp.supplier,
        pp.notes,
        pp.image_url,
        pp.last_updated,
        pp.stock_quantity,
        pp.unit_price,
        pp.total_value,
        pp.warning_threshold,
        pp.wear_level,
        pp.max_wear_limit,
        pp.hex_code,
        pp.compatible_with,
        GROUP_CONCAT(pc.printer_name SEPARATOR ', ') as compatible_printers
      FROM printer_parts pp
      LEFT JOIN (
        SELECT DISTINCT 
          ppu.part_id, 
          p.printer_name 
        FROM printer_part_usage ppu
        JOIN printer p ON ppu.printer_id = p.printer_id
      ) pc ON pp.part_id = pc.part_id
      GROUP BY pp.part_id
      ORDER BY pp.category, pp.part_name
    `)
    
    // Format the response
    const formattedParts = parts.map((part: PartRow) => ({
      part_id: part.part_id,
      name: part.part_name,
      category: part.category,
      brand: part.brand,
      sku: part.sku,
      unit: part.unit,
      supplier: part.supplier,
      notes: part.notes,
      image_url: part.image_url,
      last_updated: part.last_updated,
      quantity: part.stock_quantity,
      unit_price: part.unit_price,
      total_value: part.total_value,
      minimum_stock: part.warning_threshold,
      wear_level: part.wear_level,
      max_wear_limit: part.max_wear_limit,
      hex_code: part.hex_code,
      compatible_with: part.compatible_with,
      compatible_printers: part.compatible_printers ? part.compatible_printers.split(', ') : []
    }))
    
    return formattedParts
  } catch (error) {
    console.error('Error fetching parts inventory:', error)
    return sendError(event, createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch parts inventory'
    }))
  }
})