-- CRM tags for athletes
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS modality text,
ADD COLUMN IF NOT EXISTS training_location text,
ADD COLUMN IF NOT EXISTS size_top text,
ADD COLUMN IF NOT EXISTS size_bottom text,
ADD COLUMN IF NOT EXISTS size_shoes text;
