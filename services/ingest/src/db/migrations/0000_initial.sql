CREATE TABLE assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  storage_key varchar(512) NOT NULL,
  status varchar(32) DEFAULT 'pending',
  duration_seconds int,
  sport varchar(32) DEFAULT 'soccer'
);

CREATE TABLE jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  status varchar(32) DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  result jsonb,
  error_message varchar(1024)
);
