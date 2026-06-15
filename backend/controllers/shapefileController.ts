import { Request, Response } from "express";
import fs from "fs/promises";
import shp from "shpjs";
import { pool } from "../db.js";

export async function uploadShapefile(
  req: Request,
  res: Response,
) {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No ZIP uploaded",
      });
    }

    const zipBuffer = await fs.readFile(req.file.path);

    const geojson = await shp(zipBuffer);

    const features = geojson.features;
    const geometryType = features[0].geometry.type;

    const tableName = `uploaded_${geojson.fileName}`;

    await pool.query(`
      CREATE TABLE IF NOT EXISTS "${tableName}" (
        id SERIAL PRIMARY KEY,
        properties JSONB,
        geom geometry(${geometryType}, 4326)
      )
    `);

    await pool.query(`
      TRUNCATE TABLE "${tableName}"
    `);

    for (const feature of features) {
      await pool.query(
        `
        INSERT INTO "${tableName}" (properties, geom)
        VALUES (
          $1,
          ST_SetSRID(
            ST_GeomFromGeoJSON($2),
            4326
          )
        )
        `,
        [
          feature.properties,
          JSON.stringify(feature.geometry),
        ]
      );
    }

    res.json({
      message: "Shapefile converted successfully",
      tableName,
      featureCount: features.length,
      geojson,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Conversion failed",
    });
  }
}