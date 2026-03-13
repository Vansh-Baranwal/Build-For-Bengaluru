-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create clusters table
CREATE TABLE IF NOT EXISTS clusters (
  cluster_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_type VARCHAR(50) NOT NULL,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  complaint_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create complaints table
CREATE TABLE IF NOT EXISTS complaints (
  complaint_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id),
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 10 AND 500),
  category VARCHAR(50) NOT NULL,
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved')),
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  image_url TEXT,
  cluster_id UUID REFERENCES clusters(cluster_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create assets table
CREATE TABLE IF NOT EXISTS assets (
  asset_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_type VARCHAR(50) NOT NULL,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create spatial indexes using GIST
CREATE INDEX IF NOT EXISTS idx_complaints_location ON complaints USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_clusters_location ON clusters USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_assets_location ON assets USING GIST(location);

-- Create indexes for query optimization
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_category ON complaints(category);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clusters_issue_type ON clusters(issue_type);
CREATE INDEX IF NOT EXISTS idx_clusters_complaint_count ON clusters(complaint_count DESC);

-- Create trigger function for automatic updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for complaints table
DROP TRIGGER IF EXISTS update_complaints_updated_at ON complaints;
CREATE TRIGGER update_complaints_updated_at
BEFORE UPDATE ON complaints
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for clusters table
DROP TRIGGER IF EXISTS update_clusters_updated_at ON clusters;
CREATE TRIGGER update_clusters_updated_at
BEFORE UPDATE ON clusters
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE complaints IS 'Stores citizen-reported infrastructure complaints';
COMMENT ON TABLE clusters IS 'Geographic groupings of similar complaints within 100 meters';
COMMENT ON TABLE users IS 'User information for internal tracking only (not exposed in public APIs)';
COMMENT ON TABLE assets IS 'Infrastructure assets like streetlights and traffic signals';

COMMENT ON COLUMN complaints.location IS 'PostGIS geography point in WGS84 (SRID 4326)';
COMMENT ON COLUMN complaints.cluster_id IS 'Links complaint to its geographic cluster';
COMMENT ON COLUMN complaints.updated_at IS 'Automatically updated by trigger on any UPDATE';
