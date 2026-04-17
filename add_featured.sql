alter table store_settings add column if not exists featured_product_ids uuid[] default '{}';  
