


CREATE OR REPLACE FUNCTION get_crimes(_x1 float, _y1 float, _x2 float, _y2 float, _zoom int = 1)
RETURNS TABLE(latitude numeric(10,6), longitude numeric(10,6), size bigint, crime_details json, row_no bigint)
AS
$$
#variable_conflict use_column
DECLARE _srid int := 4326;
DECLARE _bbox geometry := ST_MakeEnvelope(_x1 , _y1 , _x2 , _y2 ,4326);
DECLARE _cluster_size int;
DECLARE _cluster_factor int := 1400;
BEGIN


  IF _zoom > 15 THEN
    RETURN QUERY  SELECT latitude::numeric(10,6), longitude::numeric(10,6), crimes::bigint as size, crime_details, g_row_no::bigint as row_no
        FROM mc_g m
        WHERE ST_Intersects(m.geom, _bbox)
        OR ST_Within(m.geom, _bbox);
  ELSE
    _cluster_factor := CASE WHEN _zoom <=7 THEN 14000
          WHEN _zoom < 9 THEN 4500
          WHEN _zoom <= 10 THEN 3000
          WHEN _zoom < 13 THEN 1800
          WHEN _zoom = 13 THEN 1600
          WHEN _zoom <= 15 THEN 1100
          ELSE _cluster_factor END;
  
    _cluster_size = _cluster_factor/_zoom;

    RAISE NOTICE 'cluster size: %', _cluster_size;
  
    CREATE TEMP TABLE ttt ON COMMIT DROP as 
    SELECT   
    ST_Y(ST_Centroid(gc))::numeric(10,6) as latitude,
    ST_X(ST_Centroid(gc))::numeric(10,6) as longitude,
    (ST_NumGeometries(gc)) as size,
    40000 + row_number() over () AS row_no,
    gc,
    ST_CollectionHomogenize(gc) as geom
    FROM (  SELECT ST_Transform(unnest(ST_ClusterWithin(geome,_cluster_size)),4326) gc
      FROM (  SELECT * 
        FROM mc_g m
        WHERE ST_Intersects(m.geom, _bbox)
        OR ST_Within(m.geom, _bbox) ) t
    ) f
    WHERE ST_NumGeometries(gc) > 1
    ;--LIMIT 500;

    CREATE index id_temp ON ttt USING GIST(geom);

    RETURN QUERY 
      SELECT t.latitude::numeric(10,6), t.longitude::numeric(10,6), size::bigint, '[]'::JSON as crime_details, t.row_no::bigint
      --SELECT t.latitude::numeric(10,6), t.longitude::numeric(10,6), SUM(m.crimes)::BIGINT as size ,'[]'::JSON as crime_details, t.row_no::bigint
      FROM ttt t
      --LEFT JOIN mc_g m
      --ON ST_Intersects(m.geom,t.geom)
      --OR ST_Within(m.geom, t.geom)
      --GROUP BY t.latitude, t.longitude, t.row_no
      ;

  END IF;
END;
$$
LANGUAGE plpgsql; --  SELECT * FROM get_crimes(-1.9126668334961323,53.589251143074414,-2.572533166503945,53.37207092152341,12)
      --  SELECT COUNT(*) FROM get_crimes(-1.9126668334961323, 53.55795840628562, -2.572533166503945, 53.403501014492605, 12)



CREATE OR REPLACE FUNCTION get_histo()
RETURNS TABLE(mnth int, value bigint)
AS
$$
#variable_conflict use_column
BEGIN --  SELECT * FROM get_histo();


CREATE TABLE IF NOT EXISTS histo AS
SELECT mnth, COUNT(*) as value
FROM mc
GROUP BY mnth;

RETURN QUERY SELECT * FROM histo;
  

END;
$$
LANGUAGE plpgsql;



CREATE OR REPLACE FUNCTION prepare_data()
RETURNS void
AS
$$
DECLARE _dir text;
DECLARE _path text := ${dir};
DECLARE _copy text := 'copy mc(Crime_ID,Month,Reported_by,Falls_within,Longitude,Latitude,Location,LSOA_code,LSOA_name,Crime_type,Last_outcome_category, Context) FROM ';
BEGIN

IF NOT EXISTS (SELECT 1 FROM mc_g) THEN

  ALTER DATABASE crime set datestyle to 'DMY';
  CREATE EXTENSION IF NOT EXISTS postgis;
  DROP TABLE IF EXISTS mc;
  CREATE TABLE mc (
  Crime_ID  text,
  Month   text,
  Reported_by text,
  Falls_within  text,
  Longitude float,
  Latitude  float,
  Location  text,
  LSOA_code text,
  LSOA_name text,
  Crime_type  text,
  Last_outcome_category text,
  Context   text,
  row_no    bigserial
  );  --  5 --  SELECT FROM prepare_data()
  FOR counter IN 1..12 LOOP
    --_dir = '/home/stf/crime/data/2015-' || LPAD(counter::TEXT,2,'0') || '-greater-manchester-street.csv';    
    _dir = _path || '/data/2015-' || LPAD(counter::TEXT,2,'0') || '-greater-manchester-street.csv';
    EXECUTE format(_copy || '  %L CSV HEADER ENCODING ' ||  '''UTF-8''', _dir);
  END LOOP;
    
  ALTER TABLE mc
  ADD COLUMN geome geometry
  ,ADD COLUMN geom geometry
  ,ADD COLUMN mnth int;

  UPDATE mc
  SET geome = ST_Transform(ST_SetSRID(ST_Point(longitude, latitude),4326),27700)
  , geom = ST_SetSRID(ST_Point(longitude, latitude),4326)
  , mnth = RIGHT(month,2)::INT;

  CREATE INDEX idx_mc ON mc(mnth, longitude, latitude, row_no);
  CREATE INDEX idx_mc_gist ON mc USING GIST(geom, geome); --  DROP INDEX idx_mc_gist


  DROP TABLE IF EXISTS mc_g;  --  DELETE FROM mc_g
  CREATE TABLE mc_g (
  geom geometry,
  geome geometry,
  longitude float,
  latitude float,
  crimes int,
  crime_details json,
  g_row_no serial
  );

  INSERT INTO mc_g
  SELECT geom, geome, longitude, latitude
    , count(*) as crimes
    , json_agg((select d FROM (SELECT row_no, mnth, REPLACE(location, 'On or near ', '') as location, crime_type, last_outcome_category as last_outcome) as d)) as crime_details
  FROM mc
  GROUP BY geom, geome,longitude, latitude
  ORDER by latitude;

  CREATE INDEX idx_mcg ON mc_g USING GIST(geom, geome);

  
END IF;

END;
$$
LANGUAGE plpgsql;

SELECT FROM prepare_data();
