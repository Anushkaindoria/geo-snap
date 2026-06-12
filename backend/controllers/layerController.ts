import { Request, Response } from "express";
import { pool } from "../db.js";

export async function getLayers(
  _req: Request,
  res: Response
) {
  try {
    const result = await pool.query(`
      SELECT f_table_name AS table_name
      FROM geometry_columns
      WHERE f_table_schema = 'public'
      ORDER BY table_name
    `);

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Database error",
    });
  }
}

export async function getLayer(
  req: Request,
  res: Response
) {
  try {
    const requestedTableName = req.params.tableName;

    if (typeof requestedTableName !== "string") {
      res.status(400).json({
        message: "Invalid layer name",
      });
      return;
    }

    const tableName = requestedTableName;
    const layerResult = await pool.query(
      `
        SELECT f_table_name, f_geometry_column, srid
        FROM geometry_columns
        WHERE f_table_schema = 'public'
          AND f_table_name = $1
        LIMIT 1
      `,
      [tableName],
    );

    if (layerResult.rowCount === 0) {
      res.status(404).json({
        message: "Layer not found",
      });
      return;
    }

    // PostgreSQL identifiers cannot be parameterized, so the table name is
    // validated against geometry_columns before being safely double-quoted.
    const safeTableName = tableName.replace(/"/g, '""');
    const geometryColumn = layerResult.rows[0].f_geometry_column;
    const safeGeometryColumn = geometryColumn.replace(/"/g, '""');
    const layerSrid = layerResult.rows[0].srid;

    const result = await pool.query(`
      SELECT json_build_object(
        'type','FeatureCollection',
        'features',json_agg(
          json_build_object(
            'type','Feature',
            'geometry',
              ST_AsGeoJSON(
              ST_Transform(
              ST_SetSRID("${safeGeometryColumn}", ${layerSrid}),
                4326
              )
            )::json,
            'properties',
              to_jsonb(t) - '${safeGeometryColumn}'
          )
        )
      ) AS geojson
      FROM "${safeTableName}" t
    `);

    res.json(result.rows[0].geojson ?? {
      type: "FeatureCollection",
      features: [],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Database error",
    });
  }
}
